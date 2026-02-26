"use client";

import { useState, useMemo } from "react";
import { FolderOpen, Search } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import {
  FilterContext,
  useProjectFilters,
} from "./ProjectsFilters";

interface MentionCount {
  hackernews: number;
  reddit: number;
}

interface EnrichedRepo {
  id: string;
  repo_id: number;
  repo_name: string;
  repo_full_name: string;
  repo_url: string;
  repo_description: string | null;
  repo_language: string | null;
  repo_stars: number;
  repo_forks?: number;
  display_order: number;
  screenshot_url: string | null;
  screenshot_source: string | null;
  demo_url: string | null;
  updated_at: string | null;
  created_at: string | null;
  activityStatus: "active" | "recent" | "archived";
  mentions: MentionCount;
}

interface ProjectsGridProps {
  projects: EnrichedRepo[];
}

const ITEMS_PER_PAGE = 12;

export function ProjectsGrid({
  projects,
}: ProjectsGridProps) {
  const filterState = useProjectFilters();
  const {
    searchQuery,
    selectedLanguage,
    selectedStatus,
    sortBy,
    setSortBy,
  } = filterState;

  const [currentPage, setCurrentPage] = useState(1);

  // Filter projects based on search, language, and status
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = project.repo_name.toLowerCase().includes(query);
        const matchesDescription =
          project.repo_description?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Language filter
      if (selectedLanguage && project.repo_language !== selectedLanguage) {
        return false;
      }

      // Status filter
      if (
        selectedStatus !== "all" &&
        project.activityStatus !== selectedStatus
      ) {
        return false;
      }

      return true;
    });
  }, [projects, searchQuery, selectedLanguage, selectedStatus]);

  // Sort filtered projects
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];

    switch (sortBy) {
      case "mentions":
        sorted.sort((a, b) => {
          const aMentions = a.mentions.hackernews + a.mentions.reddit;
          const bMentions = b.mentions.hackernews + b.mentions.reddit;
          return bMentions - aMentions;
        });
        break;
      case "stars":
        sorted.sort((a, b) => b.repo_stars - a.repo_stars);
        break;
      case "recent":
        sorted.sort((a, b) => {
          const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return bDate - aDate;
        });
        break;
      case "name":
        sorted.sort((a, b) =>
          a.repo_name.toLowerCase().localeCompare(b.repo_name.toLowerCase())
        );
        break;
    }

    return sorted;
  }, [filteredProjects, sortBy]);

  // Paginate
  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProjects, currentPage]);

  // Reset to page 1 when filters change
  // Using useEffect instead of useMemo for side effects
  const filterKey = `${searchQuery}-${selectedLanguage}-${selectedStatus}-${sortBy}`;
  useMemo(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "mentions" | "stars" | "recent" | "name");
  };

  return (
    <FilterContext.Provider value={filterState}>
      <div>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            All Projects
            <span className="text-[var(--color-text-secondary)] font-normal ml-2">
              ({filteredProjects.length})
            </span>
          </h1>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="px-4 py-2 pr-10 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text)] cursor-pointer appearance-none focus:outline-none focus:border-[var(--color-primary)]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="mentions">Sort by mentions</option>
            <option value="stars">Sort by stars</option>
            <option value="recent">Sort by recent</option>
            <option value="name">Sort by name</option>
          </select>
        </div>

        {/* Projects Grid or Empty State */}
        {paginatedProjects.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                  aria-label="Previous page"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first, last, current, and adjacent pages
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    if (!showPage) {
                      // Show ellipsis for gaps
                      if (
                        page === 2 ||
                        page === totalPages - 1
                      ) {
                        return (
                          <span
                            key={page}
                            className="px-2 text-[var(--color-text-secondary)]"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-[var(--color-primary)] text-white"
                            : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                  aria-label="Next page"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20 px-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
            {searchQuery || selectedLanguage || selectedStatus !== "all" ? (
              <>
                <Search className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-6 opacity-50" />
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  No matching projects
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">
                  {searchQuery && `No projects matching "${searchQuery}". `}
                  {selectedLanguage &&
                    `No ${selectedLanguage} projects found. `}
                  {selectedStatus !== "all" &&
                    `No ${selectedStatus} projects found.`}
                </p>
              </>
            ) : (
              <>
                <FolderOpen className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-6 opacity-50" />
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  No projects yet
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  This user hasn&apos;t showcased any projects yet.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </FilterContext.Provider>
  );
}
