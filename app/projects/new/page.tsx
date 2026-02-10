'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function NewProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_repo_url: githubUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create project');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-border-default" />
          <div className="h-4 w-24 bg-border-default rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Add a New Project</h1>
          <p className="text-text-secondary">
            Enter your GitHub repository URL to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border-default rounded-xl p-8">
          <div className="mb-6">
            <label htmlFor="github-url" className="block text-sm font-medium mb-2">
              GitHub Repository URL
            </label>
            <input
              id="github-url"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-4 py-3 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500 transition-colors"
              required
              disabled={loading}
            />
            <p className="text-sm text-text-tertiary mt-2">
              We&apos;ll automatically analyze your repository and extract details
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/20 rounded-lg">
              <p className="text-danger-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !githubUrl}
              className="flex-1"
            >
              {loading ? 'Adding Project...' : 'Add Project'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-border-default">
            <h3 className="font-semibold mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                We&apos;ll fetch your repository details from GitHub
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Auto-detect tech stack, description, and metadata
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                You can customize the details afterward
              </li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
