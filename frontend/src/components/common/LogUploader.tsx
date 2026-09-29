import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

interface LogUploaderProps {
  onUploadComplete?: () => void;
}

export const LogUploader: React.FC<LogUploaderProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const logs = text.split('\n').filter(line => line.trim().length > 0);
      
      let completed = 0;
      for (const log of logs) {
        try {
          await fetch('http://localhost:8000/api/quarantine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_log: log.trim() })
          });
        } catch (err) {
          console.error("Failed to upload log:", err);
        }
        completed++;
        setProgress(Math.round((completed / logs.length) * 100));
      }

      setIsUploading(false);
      if (onUploadComplete) onUploadComplete();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      <input 
        type="file" 
        accept=".txt,.csv,.log" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileUpload} 
        disabled={isUploading} 
      />
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isUploading}
        title="Upload raw log file"
      >
        {isUploading ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-zinc-400" />
        ) : (
          <Upload className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
        )}
        {isUploading ? `Uploading ${progress}%` : 'Upload Logs'}
      </Button>
    </>
  );
};