import { useRef, forwardRef, useImperativeHandle } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

interface SignaturePadProps {
  onSignatureChange?: (isEmpty: boolean) => void;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSignatureChange }, ref) => {
    const sigCanvas = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigCanvas.current?.clear();
        onSignatureChange?.(true);
      },
      isEmpty: () => {
        return sigCanvas.current?.isEmpty() ?? true;
      },
      toDataURL: () => {
        return sigCanvas.current?.toDataURL("image/png") ?? "";
      },
    }));

    const handleClear = () => {
      sigCanvas.current?.clear();
      onSignatureChange?.(true);
    };

    const handleEnd = () => {
      const isEmpty = sigCanvas.current?.isEmpty() ?? true;
      onSignatureChange?.(!isEmpty);
    };

    const handleBegin = () => {
      // Once the user starts drawing, the canvas is no longer empty
      onSignatureChange?.(false);
    };

    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg bg-background relative">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "w-full h-48 cursor-crosshair rounded-lg",
            }}
            onEnd={handleEnd}
            onBegin={handleBegin}
          />
          <div className="absolute top-2 left-2 text-xs text-muted-foreground pointer-events-none">
            Sign here
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="w-full"
          data-testid="button-clear-signature"
        >
          <Eraser className="h-4 w-4 mr-2" />
          Clear Signature
        </Button>
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
