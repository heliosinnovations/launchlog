'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectCard, type Project } from '@/components/projects/ProjectCard';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/projects')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setProjects(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

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

  const readyCount = projects.filter((p) => p.status === 'ready').length;
  const totalStars = projects.reduce((sum, p) => sum + (p.github_stars || 0), 0);

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
            <p className="text-text-secondary">
              Welcome back, {session.user?.name}!
            </p>
          </div>
          <Link href="/projects/new">
            <Button variant="primary">
              + Add Project
            </Button>
          </Link>
        </div>

        {/* Projects Grid or Empty State */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-bg-tertiary" />
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
              <Button variant="primary" size="lg">
                Add Your First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Total Projects</p>
            <p className="text-2xl font-bold">{projects.length}</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Ready</p>
            <p className="text-2xl font-bold text-success-500">{readyCount}</p>
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
      </div>
    </div>
  );
}
