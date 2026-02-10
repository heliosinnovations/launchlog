'use client';

import { Suspense } from 'react';
import { createClientSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleSignIn = async () => {
    const supabase = createClientSupabase();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-8">
      {error && (
        <div className="mb-4 p-3 bg-danger-500/10 border border-danger-500/20 rounded-lg">
          <p className="text-danger-400 text-sm">
            {error === 'no_code' ? 'Authentication failed. Please try again.' :
             error === 'auth_failed' ? 'Could not complete sign in. Please try again.' :
             error === 'missing_metadata' ? 'Could not retrieve GitHub profile. Please try again.' :
             error === 'user_sync_failed' ? 'Could not create account. Please try again.' :
             'An error occurred. Please try again.'}
          </p>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleSignIn}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Continue with GitHub
      </Button>

      <p className="text-sm text-text-tertiary text-center mt-6">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 text-brand-500">
              <Image src="/logo.svg" alt="LaunchLog" width={40} height={40} />
            </div>
            <span className="font-bold text-2xl">
              <span className="text-brand-500">Launch</span>
              <span className="text-text-primary">Log</span>
              <span className="text-success-500">.</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome to LaunchLog</h1>
          <p className="text-text-secondary">Sign in with GitHub to get started</p>
        </div>

        <Suspense fallback={
          <div className="bg-bg-secondary border border-border-default rounded-xl p-8 animate-pulse">
            <div className="h-12 bg-bg-tertiary rounded-lg" />
            <div className="h-4 bg-bg-tertiary rounded w-2/3 mx-auto mt-6" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
