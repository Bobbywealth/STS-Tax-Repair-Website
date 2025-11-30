import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import AwsS3 from "@uppy/aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ObjectUploaderProps {
  clientId: string;
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (files: Array<{ name: string; uploadURL: string; objectPath: string }>) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  clientId,
  maxNumberOfFiles = 5,
  maxFileSize = 10485760,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; uploadURL: string; objectPath: string }>>([]);

  useEffect(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file: any) => {
          const response = await fetch('/api/objects/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              clientId,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to get upload URL');
          }
          
          const { uploadURL, objectPath } = await response.json();
          
          file.meta.objectPath = objectPath;
          
          return {
            method: 'PUT' as const,
            url: uploadURL,
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
          };
        },
      })
      .on("complete", (result: any) => {
        const files = result.successful?.map((file: any) => ({
          name: file.name,
          uploadURL: file.uploadURL,
          objectPath: file.meta?.objectPath || '',
        })) || [];
        
        setUploadedFiles(files);
        onComplete?.(files);
        setShowModal(false);
      });

    setUppy(uppyInstance);

    return () => {
      uppyInstance.destroy();
    };
  }, [clientId, maxNumberOfFiles, maxFileSize, onComplete]);

  useEffect(() => {
    if (showModal && uppy) {
      const dashboardElement = document.getElementById('uppy-dashboard');
      if (dashboardElement && !uppy.getPlugin('Dashboard')) {
        uppy.use(Dashboard, {
          inline: true,
          target: '#uppy-dashboard',
          proudlyDisplayPoweredByUppy: false,
          hideProgressDetails: false,
          height: 400,
        });
      }
    }
  }, [showModal, uppy]);

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-upload-document">
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <div id="uppy-dashboard" className="min-h-[400px]" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
