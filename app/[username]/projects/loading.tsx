/**
 * Loading skeleton for the projects page
 * Matches the minimal/clean design from projects-page-v1-minimal.html
 */
export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header Skeleton */}
      <header className="border-b border-[var(--color-border)] px-4 sm:px-8 py-4 sticky top-0 bg-[var(--color-bg)]">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="w-36 h-8 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse" />
          <div className="flex gap-3">
            <div className="w-16 h-8 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse" />
            <div className="w-40 h-8 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Sidebar Skeleton */}
          <aside className="space-y-6">
            {/* User Card Skeleton */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-elevated)] mb-4 animate-pulse" />
              <div className="w-32 h-6 bg-[var(--color-surface-elevated)] rounded mb-2 animate-pulse" />
              <div className="w-24 h-4 bg-[var(--color-surface-elevated)] rounded mb-4 animate-pulse" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse"
                  />
                ))}
              </div>
              <div className="w-28 h-5 bg-[var(--color-surface-elevated)] rounded animate-pulse" />
            </div>

            {/* Filter Skeleton */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
              <div className="w-16 h-4 bg-[var(--color-surface-elevated)] rounded mb-4 animate-pulse" />
              <div className="h-10 bg-[var(--color-surface-elevated)] rounded-lg mb-6 animate-pulse" />
              <div className="w-20 h-4 bg-[var(--color-surface-elevated)] rounded mb-3 animate-pulse" />
              <div className="flex flex-wrap gap-2 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-20 h-8 bg-[var(--color-surface-elevated)] rounded-full animate-pulse"
                  />
                ))}
              </div>
              <div className="w-16 h-4 bg-[var(--color-surface-elevated)] rounded mb-3 animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-20 h-8 bg-[var(--color-surface-elevated)] rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="w-48 h-8 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse" />
              <div className="w-40 h-10 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse" />
            </div>

            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden"
                >
                  {/* Screenshot placeholder */}
                  <div className="aspect-[16/10] bg-[var(--color-surface-elevated)] animate-pulse" />
                  {/* Content */}
                  <div className="p-5">
                    <div className="flex justify-between mb-2">
                      <div className="w-32 h-5 bg-[var(--color-surface-elevated)] rounded animate-pulse" />
                      <div className="w-20 h-4 bg-[var(--color-surface-elevated)] rounded animate-pulse" />
                    </div>
                    <div className="w-full h-4 bg-[var(--color-surface-elevated)] rounded mb-2 animate-pulse" />
                    <div className="w-3/4 h-4 bg-[var(--color-surface-elevated)] rounded mb-4 animate-pulse" />
                    <div className="flex gap-4 pb-4 mb-4 border-b border-[var(--color-border-subtle)]">
                      <div className="w-16 h-5 bg-[var(--color-surface-elevated)] rounded animate-pulse" />
                      <div className="w-24 h-5 bg-[var(--color-surface-elevated)] rounded animate-pulse ml-auto" />
                    </div>
                    <div className="h-10 bg-[var(--color-surface-elevated)] rounded-lg mb-4 animate-pulse" />
                    <div className="flex gap-2.5">
                      <div className="w-20 h-8 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse" />
                      <div className="w-16 h-8 bg-[var(--color-surface-elevated)] rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
