'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

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

        {/* Empty State */}
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

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Total Projects</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Shipped</p>
            <p className="text-2xl font-bold text-success-500">0</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <p className="text-text-tertiary text-sm mb-1">Profile Views</p>
            <p className="text-2xl font-bold">0</p>
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
