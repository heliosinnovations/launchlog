'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProjectEditForm } from '@/components/projects/ProjectEditForm';
import type { Project } from '@/types/project';

export default function EditProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && projectId) {
      fetch(`/api/projects/${projectId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Project not found');
          return res.json();
        })
        .then((data) => {
          // Verify ownership
          if (data.user_id !== user.id) {
            setError('You do not have permission to edit this project');
            return;
          }
          setProject(data);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user, projectId]);

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-border-default" />
          <div className="h-4 w-24 bg-border-default rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-danger-400 mb-2">Error</h1>
            <p className="text-text-secondary">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-brand-400 hover:text-brand-300"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <ProjectEditForm project={project} />
      </div>
    </div>
  );
}
