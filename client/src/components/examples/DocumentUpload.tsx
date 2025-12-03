import { DocumentUpload } from '../DocumentUpload';

export default function DocumentUploadExample() {
  return (
    <div className="p-4 max-w-2xl">
      <DocumentUpload 
        clientId="example-client-id"
        onUpload={(files) => console.log('Files uploaded:', files.map(f => f.name))}
      />
    </div>
  );
}
