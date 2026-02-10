'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface ScreenshotUploaderProps {
  projectId: string;
  screenshots: string[];
  primaryIndex: number;
  onUpdate: (screenshots: string[], primaryIndex: number) => void;
}

const MAX_SCREENSHOTS = 5;

export function ScreenshotUploader({ projectId, screenshots, primaryIndex, onUpdate }: ScreenshotUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');

    if (screenshots.length + files.length > MAX_SCREENSHOTS) {
      setError(`Maximum ${MAX_SCREENSHOTS} screenshots allowed. You have ${screenshots.length}.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const res = await fetch(`/api/projects/${projectId}/screenshots`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      onUpdate(data.screenshots, primaryIndex);
    } catch {
      setError('Failed to upload screenshots');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (index: number) => {
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/screenshots?index=${index}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Delete failed');
        return;
      }

      // Calculate new primary index
      let newPrimary = primaryIndex;
      if (index < primaryIndex) newPrimary--;
      else if (index === primaryIndex) newPrimary = 0;
      if (newPrimary >= data.screenshots.length) newPrimary = Math.max(0, data.screenshots.length - 1);

      onUpdate(data.screenshots, newPrimary);
    } catch {
      setError('Failed to delete screenshot');
    }
  };

  const handleSetPrimary = (index: number) => {
    onUpdate(screenshots, index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Screenshots ({screenshots.length}/{MAX_SCREENSHOTS})</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading || screenshots.length >= MAX_SCREENSHOTS}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || screenshots.length >= MAX_SCREENSHOTS}
        >
          {uploading ? 'Uploading...' : '+ Add'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-lg text-sm text-danger-400">
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-border-default'
        } ${screenshots.length >= MAX_SCREENSHOTS ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => screenshots.length < MAX_SCREENSHOTS && fileInputRef.current?.click()}
      >
        <p className="text-sm text-text-secondary">
          {screenshots.length >= MAX_SCREENSHOTS
            ? 'Maximum screenshots reached'
            : 'Drag & drop images here or click to browse'}
        </p>
        <p className="text-xs text-text-tertiary mt-1">JPEG, PNG, WebP, GIF (max 5MB each)</p>
      </div>

      {/* Screenshot Grid */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {screenshots.map((url, index) => (
            <div
              key={url}
              className={`relative group aspect-video rounded-lg overflow-hidden border-2 ${
                index === primaryIndex ? 'border-brand-500' : 'border-border-default'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== primaryIndex && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="px-2 py-1 bg-brand-500 text-white text-xs rounded"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="px-2 py-1 bg-danger-500 text-white text-xs rounded"
                >
                  Delete
                </button>
              </div>

              {/* Primary badge */}
              {index === primaryIndex && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-brand-500 text-white text-xs rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
