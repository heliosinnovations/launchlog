'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectCard, type Project } from '@/components/projects/ProjectCard';
import { DeleteProjectModal } from '@/components/projects/DeleteProjectModal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { DashboardFilters, type FilterState, type SortOption } from '@/components/dashboard/DashboardFilters';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';

const PROJECTS_PER_PAGE = 20;

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    techStack: 'all',
    search: '',
  });
  const [sortBy, setSortBy] = useState<SortOption>('date_added');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetch('/api/projects')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setProjects(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Extract unique tech stacks for filter dropdown
  const availableTechStacks = useMemo(() => {
    const stacks = new Set<string>();
    projects.forEach((p) => p.tech_stack?.forEach((t) => stacks.add(t)));
    return Array.from(stacks).sort();
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter((p) => p.project_status === filters.status);
    }

    // Filter by tech stack
    if (filters.techStack !== 'all') {
      result = result.filter((p) => p.tech_stack?.includes(filters.techStack));
    }

    // Filter by search
    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      result = result.filter((p) => {
        const name = (p.custom_name || p.repo_name).toLowerCase();
        const desc = (p.custom_description || p.description || '').toLowerCase();
        return name.includes(search) || desc.includes(search);
      });
    }

    // Sort
    switch (sortBy) {
      case 'date_added':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'stars':
        result.sort((a, b) => (b.github_stars || 0) - (a.github_stars || 0));
        break;
      case 'name':
        result.sort((a, b) => {
          const nameA = (a.custom_name || a.repo_name).toLowerCase();
          const nameB = (b.custom_name || b.repo_name).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
    }

    return result;
  }, [projects, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PROJECTS_PER_PAGE;
    return filteredProjects.slice(start, start + PROJECTS_PER_PAGE);
  }, [filteredProjects, currentPage]);

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

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to page 1 when sort changes
  }, []);

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

  const totalStars = projects.reduce((sum, p) => sum + (p.github_stars || 0), 0);
  const shippedCount = projects.filter((p) => p.project_status === 'shipped').length;

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Your Projects</h1>
            <p className="text-text-secondary text-sm sm:text-base">
              Welcome back, {user.name}!
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-3 sm:p-4">
            <p className="text-text-tertiary text-xs sm:text-sm mb-1">Total Projects</p>
            <p className="text-xl sm:text-2xl font-bold">{projects.length}</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-3 sm:p-4">
            <p className="text-text-tertiary text-xs sm:text-sm mb-1">Shipped</p>
            <p className="text-xl sm:text-2xl font-bold text-success-500">{shippedCount}</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-3 sm:p-4">
            <p className="text-text-tertiary text-xs sm:text-sm mb-1">Total Stars</p>
            <p className="text-xl sm:text-2xl font-bold">{totalStars.toLocaleString()}</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-3 sm:p-4">
            <p className="text-text-tertiary text-xs sm:text-sm mb-1">Your Tier</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-500 capitalize">{user.tier || 'Free'}</p>
          </div>
        </div>

        {/* Filters and Search */}
        {projects.length > 0 && (
          <DashboardFilters
            filters={filters}
            sortBy={sortBy}
            availableTechStacks={availableTechStacks}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            resultCount={filteredProjects.length}
          />
        )}

        {/* Projects Grid/List or Empty State */}
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-4'}>
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
          <EmptyState />
        ) : filteredProjects.length === 0 ? (
          <div className="bg-bg-secondary border border-border-default rounded-xl p-8 sm:p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
              <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-text-secondary text-sm mb-4">
              Try adjusting your filters or search query
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ status: 'all', techStack: 'all', search: '' })}
            >
              Clear Filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paginatedProjects.map((project) => (
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
            {paginatedProjects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                onDelete={() => setDeleteTarget(project)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border-default hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-brand-500 text-white'
                        : 'hover:bg-bg-secondary'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border-default hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
            loading="lazy"
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
