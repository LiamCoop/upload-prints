'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function OrderForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileUploadState[] = Array.from(selectedFiles).map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (
    orderId: string,
    fileState: FileUploadState,
    index: number
  ): Promise<boolean> => {
    const { file } = fileState;

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const } : f))
    );

    try {
      // Get presigned upload URL
      const urlResponse = await fetch(`/api/orders/${orderId}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
        }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { fileId, uploadUrl } = await urlResponse.json();

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Update progress
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 90 } : f))
      );

      // Confirm upload
      const confirmResponse = await fetch(
        `/api/orders/${orderId}/files/${fileId}/confirm`,
        { method: 'POST' }
      );

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      // Mark as completed
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
            ? { ...f, status: 'error' as const, error: err instanceof Error ? err.message : 'Upload failed' }
            : f
        )
      );
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Please provide a description for your order');
      return;
    }

    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!orderResponse.ok) {
        const data = await orderResponse.json();
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to create order';
        throw new Error(errorMsg);
      }

      const order = await orderResponse.json();

      // Upload all files
      const results = await Promise.all(
        files.map((fileState, index) => uploadFile(order.id, fileState, index))
      );

      const allSuccessful = results.every(Boolean);

      if (allSuccessful) {
        // Redirect to order confirmation or orders list
        router.push(`/orders/${order.id}`);
      } else {
        setError('Some files failed to upload. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Order</CardTitle>
        <CardDescription>
          Upload your STL files and provide details for your 3D print order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Order Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you need printed, including any special requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Files</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".stl,.obj,.3mf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground">
                Click to select files or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports STL, OBJ, and 3MF files
              </p>
            </div>

            {files.length > 0 && (
              <ul className="space-y-2 mt-4">
                {files.map((fileState, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fileState.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileState.file.size)}
                      </p>
                      {fileState.status === 'uploading' && (
                        <Progress value={fileState.progress} className="h-1 mt-1" />
                      )}
                      {fileState.status === 'error' && (
                        <p className="text-xs text-red-600 mt-1">{fileState.error}</p>
                      )}
                      {fileState.status === 'completed' && (
                        <p className="text-xs text-green-600 mt-1">Uploaded</p>
                      )}
                    </div>
                    {fileState.status === 'pending' && !isSubmitting && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Order...' : 'Submit Order'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
