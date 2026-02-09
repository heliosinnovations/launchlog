import { supabaseAdmin } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  // Fetch user profile
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', params.username)
    .single();

  if (!user) {
    notFound();
  }

  // Fetch user's public projects
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_public', true)
    .order('display_order', { ascending: true });

  const projectCount = projects?.length || 0;
  const shippedCount = projects?.filter(p => p.status === 'ready').length || 0;

  return (
    <div className="min-h-screen pt-24 px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border-default flex-shrink-0">
              <Image
                src={user.avatar_url || '/logo.svg'}
                alt={user.name || user.username}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{user.name || user.username}</h1>
              <p className="text-text-tertiary mb-3">@{user.username}</p>
              {user.bio && (
                <p className="text-text-secondary max-w-2xl mb-4">{user.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                {user.github_username && (
                  <a
                    href={`https://github.com/${user.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
                {user.twitter_username && (
                  <a
                    href={`https://twitter.com/${user.twitter_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter
                  </a>
                )}
                {user.website_url && (
                  <a
                    href={user.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
              <p className="text-text-tertiary text-sm mb-1">Projects</p>
              <p className="text-2xl font-bold">{projectCount}</p>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
              <p className="text-text-tertiary text-sm mb-1">Shipped</p>
              <p className="text-2xl font-bold text-success-500">{shippedCount}</p>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
              <p className="text-text-tertiary text-sm mb-1">In Progress</p>
              <p className="text-2xl font-bold text-warning-500">
                {projects?.filter(p => p.status === 'analyzing').length || 0}
              </p>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
              <p className="text-text-tertiary text-sm mb-1">Profile Views</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projectCount > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {projects?.map((project) => (
                <div
                  key={project.id}
                  className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden hover:border-border-hover transition-all duration-200"
                >
                  {/* Screenshot */}
                  <div className="aspect-video bg-bg-tertiary flex items-center justify-center relative">
                    {project.screenshot_url ? (
                      <Image
                        src={project.screenshot_url}
                        alt={project.custom_name || project.repo_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <p className="text-text-tertiary text-sm">No screenshot</p>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={
                          project.status === 'ready' ? 'success' :
                          project.status === 'analyzing' ? 'warning' :
                          'danger'
                        }
                      >
                        {project.status === 'ready' ? 'Shipped' : project.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-semibold mb-2 line-clamp-1">
                      {project.custom_name || project.repo_name}
                    </h3>
                    <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                      {project.custom_description || project.description || 'No description'}
                    </p>

                    {/* Tech Stack */}
                    {project.tech_stack && Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tech_stack.slice(0, 4).map((tech: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-3 text-sm">
                      {project.deployment_url && (
                        <a
                          href={project.deployment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:text-brand-500 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          Live
                        </a>
                      )}
                      <a
                        href={project.github_repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-text-primary flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-secondary">No projects yet</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border-default text-center">
          <p className="text-text-tertiary text-sm">
            Powered by{' '}
            <Link href="/" className="text-brand-400 hover:text-brand-500">
              LaunchLog
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
