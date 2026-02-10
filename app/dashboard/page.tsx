'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectCard, type Project } from '@/components/projects/ProjectCard';
import { DeleteProjectModal } from '@/components/projects/DeleteProjectModal';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true;
      fetch('/api/projects')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setProjects(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  const handleDelete = async (hardDelete: boolean) => {
    if (!deleteTarget) return;

    const res = await fetch(`/api/projects/${deleteTarget.id}${hardDelete ? '?hard=true' : ''}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Delete failed');
    }

    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-border-default" />
          <div className="h-4 w-24 bg-border-default rounded" />
        </div>
      </div>
    );
  }

  const totalStars = projects.reduce((sum, p) => sum + (p.github_stars || 0), 0);
  const shippedCount = projects.filter((p) => p.project_status === 'shipped').length;

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
            <p className="text-text-secondary">
              Welcome back, {session.user?.name}!
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex border border-border-default rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-bg-tertiary' : 'hover:bg-bg-secondary'}`}
                title="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-bg-tertiary' : 'hover:bg-bg-secondary'}`}
                title="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <Link href="/projects/new">
              <Button variant="primary">+ Add Project</Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Total Projects</p>
            <p className="text-2xl font-bold">{projects.length}</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Shipped</p>
            <p className="text-2xl font-bold text-success-500">{shippedCount}</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Total Stars</p>
            <p className="text-2xl font-bold">{totalStars.toLocaleString()}</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Your Tier</p>
            <p className="text-2xl font-bold text-brand-500 capitalize">{session.user?.tier || 'Free'}</p>
          </div>
        </div>

        {/* Projects Grid/List or Empty State */}
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden animate-pulse">
                {viewMode === 'grid' && <div className="aspect-video bg-bg-tertiary" />}
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-bg-tertiary rounded w-3/4" />
                  <div className="h-4 bg-bg-tertiary rounded w-full" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-bg-tertiary rounded w-16" />
                    <div className="h-6 bg-bg-tertiary rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-bg-secondary border border-border-default rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Add your first project to start showcasing what you&apos;ve built.
            </p>
            <Link href="/projects/new">
              <Button variant="primary" size="lg">Add Your First Project</Button>
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showActions
                onDelete={() => setDeleteTarget(project)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                onDelete={() => setDeleteTarget(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteProjectModal
        projectName={deleteTarget?.custom_name || deleteTarget?.repo_name || ''}
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

function ProjectListItem({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const name = project.custom_name || project.repo_name;
  const description = project.custom_description || project.description;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 flex items-center gap-4 hover:border-border-hover transition-colors">
      {/* Thumbnail */}
      <div className="w-16 h-16 bg-bg-tertiary rounded-lg overflow-hidden flex-shrink-0">
        {project.screenshots?.[0] || project.screenshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.screenshots?.[0] || project.screenshot_url || ''}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-border-default" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{name}</h3>
        {description && <p className="text-sm text-text-secondary truncate">{description}</p>}
        <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
          {project.github_stars > 0 && <span>⭐ {project.github_stars}</span>}
          {project.primary_language && <span>{project.primary_language}</span>}
          {project.updated_at && <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {project.deployment_url && (
          <a
            href={project.deployment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary"
            title="Visit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
        <a
          href={project.github_repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary"
          title="GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
          </svg>
        </a>
        <Link
          href={`/projects/${project.id}/edit`}
          className="p-2 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary"
          title="Edit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
        <button
          onClick={onDelete}
          className="p-2 rounded hover:bg-danger-500/10 text-text-tertiary hover:text-danger-400"
          title="Delete"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
