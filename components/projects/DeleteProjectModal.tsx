'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface DeleteProjectModalProps {
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (hardDelete: boolean) => Promise<void>;
}

export function DeleteProjectModal({ projectName, isOpen, onClose, onDelete }: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const canDelete = confirmText.toLowerCase() === 'delete';

  const handleDelete = async (hard: boolean) => {
    setLoading(true);
    try {
      await onDelete(hard);
      onClose();
    } finally {
      setLoading(false);
      setConfirmText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary border border-border-default rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-2">Delete Project</h2>
        <p className="text-text-secondary mb-4">
          Are you sure you want to delete <span className="font-semibold text-text-primary">{projectName}</span>?
        </p>

        <div className="mb-6">
          <label className="block text-sm text-text-secondary mb-2">
            Type <span className="font-mono bg-bg-tertiary px-1 rounded">delete</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500"
            placeholder="delete"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={() => handleDelete(false)}
            disabled={!canDelete || loading}
            className="w-full bg-warning-500 hover:bg-warning-600"
          >
            {loading ? 'Deleting...' : 'Archive (Soft Delete)'}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDelete(true)}
            disabled={!canDelete || loading}
            className="w-full bg-danger-500 hover:bg-danger-600"
          >
            {loading ? 'Deleting...' : 'Permanently Delete'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading} className="w-full">
            Cancel
          </Button>
        </div>

        <p className="text-xs text-text-tertiary mt-4">
          Archiving will hide the project but keep the data. Permanent deletion cannot be undone.
        </p>
      </div>
    </div>
  );
}
