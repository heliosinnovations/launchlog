'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '../ui/Button';
import { createClientSupabase } from '@/lib/supabase';

function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-16 h-8 bg-border-default rounded-lg" />
      <div className="w-24 h-8 bg-border-default rounded-lg" />
    </div>
  );
}

export function Nav() {
  const { user, loading, signOut } = useAuth();

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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-default bg-bg-primary/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 text-brand-500">
            <Image src="/logo.svg" alt="LaunchLog" width={32} height={32} />
          </div>
          <span className="font-bold text-lg">
            <span className="text-brand-500">Launch</span>
            <span className="text-text-primary">Log</span>
            <span className="text-success-500">.</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-text-secondary hover:text-text-primary font-medium transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-text-secondary hover:text-text-primary font-medium transition-colors">
            Pricing
          </Link>
          <Link href="#examples" className="text-text-secondary hover:text-text-primary font-medium transition-colors">
            Examples
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {loading ? (
            <AuthLoadingSkeleton />
          ) : user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              {user.username ? (
                <Link href={`/${user.username}`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-500">
                    <Image
                      src={user.avatar_url || '/logo.svg'}
                      alt={user.name || 'User'}
                      width={32}
                      height={32}
                    />
                  </div>
                </Link>
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center border-2 border-brand-500">
                  <span className="text-white text-sm font-medium">{user.name?.[0]?.toUpperCase() || '?'}</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleSignIn}>
                Sign in
              </Button>
              <Button variant="primary" size="sm" onClick={handleSignIn}>
                Get Started →
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
