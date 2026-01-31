'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function AdminFilesActions({
  orderId,
  adminFileCount,
}: {
  orderId: string;
  adminFileCount: number;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (selectedFiles: FileList) => {
    const newFiles: FileUploadState[] = Array.from(selectedFiles).map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.files?.length) return;
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileState: FileUploadState, index: number): Promise<boolean> => {
    const { file } = fileState;

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const, progress: 15 } : f))
    );

    try {
      const urlResponse = await fetch(`/api/orders/${orderId}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          fileType: 'processed',
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { fileId, uploadUrl } = await urlResponse.json();

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 55 } : f))
      );

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.status}`);
      }

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 85 } : f))
      );

      const confirmResponse = await fetch(
        `/api/orders/${orderId}/files/${fileId}/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileType: 'processed' }),
        }
      );

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'Failed to confirm upload');
      }

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, progress: 100, status: 'completed' as const } : f
        )
      );

      return true;
    } catch (err) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'error' as const,
                error: err instanceof Error ? err.message : 'Upload failed',
              }
            : f
        )
      );
      return false;
    }
  };

  const handleUploadAll = async () => {
    setError(null);

    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setIsUploading(true);

    try {
      const results = await Promise.all(
        files.map((fileState, index) => uploadFile(fileState, index))
      );
      const allSuccessful = results.every(Boolean);

      if (allSuccessful) {
        setUploadOpen(false);
        setFiles([]);
        router.refresh();
      } else {
        setError('Some files failed to upload. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadAll = async () => {
    setError(null);
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/processed-files/download-urls`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch download links');
      }

      const data = await response.json();
      const files: Array<{ fileName: string; downloadUrl: string }> = data.files || [];

      if (files.length === 0) {
        setError('No admin files available to download.');
        return;
      }

      files.forEach((file) => {
        const link = document.createElement('a');
        link.href = file.downloadUrl;
        link.download = file.fileName;
        link.rel = 'noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download files.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetUploadState = () => {
    setFiles([]);
    setError(null);
    setIsUploading(false);
  };

  return (
    <>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Admin file actions">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin File Actions</DialogTitle>
            <DialogDescription>Manage processed files for this order.</DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          <div className="grid gap-2">
            <Button
              variant="secondary"
              onClick={handleDownloadAll}
              disabled={isDownloading || adminFileCount === 0}
            >
              {isDownloading ? 'Preparing Downloads...' : 'Download All'}
            </Button>
            <Button
              onClick={() => {
                setSettingsOpen(false);
                setUploadOpen(true);
              }}
            >
              Add Files
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) resetUploadState();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Files</DialogTitle>
            <DialogDescription>Upload processed files for this order.</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div
            className="border border-dashed border-gray-300 rounded-md p-6 text-center space-y-2 bg-gray-50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or browse to upload.
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              {files.map((fileState, index) => (
                <div key={`${fileState.file.name}-${index}`} className="p-3 border rounded-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{fileState.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileState.file.size)}
                      </p>
                    </div>
                    {fileState.status === 'pending' && !isUploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <Progress value={fileState.progress} className="h-1" />
                    {fileState.status === 'error' && (
                      <p className="text-xs text-red-600">{fileState.error}</p>
                    )}
                    {fileState.status === 'completed' && (
                      <p className="text-xs text-green-600">Uploaded</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setUploadOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUploadAll} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
