'use client';

import { useEffect, useRef, useState } from 'react';

export type SortOption = 'date_added' | 'stars' | 'name';
export type StatusFilter = 'all' | 'shipped' | 'beta' | 'in_progress' | 'sunset';

export interface FilterState {
  status: StatusFilter;
  techStack: string;
  search: string;
}

interface DashboardFiltersProps {
  filters: FilterState;
  sortBy: SortOption;
  availableTechStacks: string[];
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'beta', label: 'Beta' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'sunset', label: 'Sunset' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date_added', label: 'Date Added' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'name', label: 'Name (A-Z)' },
];

export function DashboardFilters({
  filters,
  sortBy,
  availableTechStacks,
  onFilterChange,
  onSortChange,
  resultCount,
}: DashboardFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFilterChange({ ...filters, search: searchValue });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, filters, onFilterChange]);

  // Sync search value when filters change externally (e.g., clear filters)
  useEffect(() => {
    if (filters.search !== searchValue) {
      setSearchValue(filters.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const hasActiveFilters = filters.status !== 'all' || filters.techStack !== 'all' || filters.search !== '';

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search projects..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-default rounded-lg focus:outline-none focus:border-brand-500 transition-colors text-sm"
        />
        {searchValue && (
          <button
            onClick={() => setSearchValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-tertiary rounded"
          >
            <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value as StatusFilter })}
            className="appearance-none pl-3 pr-8 py-2 bg-bg-secondary border border-border-default rounded-lg focus:outline-none focus:border-brand-500 text-sm cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Tech Stack Filter */}
        {availableTechStacks.length > 0 && (
          <div className="relative">
            <select
              value={filters.techStack}
              onChange={(e) => onFilterChange({ ...filters, techStack: e.target.value })}
              className="appearance-none pl-3 pr-8 py-2 bg-bg-secondary border border-border-default rounded-lg focus:outline-none focus:border-brand-500 text-sm cursor-pointer"
            >
              <option value="all">All Tech</option>
              {availableTechStacks.map((tech) => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Sort */}
        <div className="relative ml-auto">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none pl-3 pr-8 py-2 bg-bg-secondary border border-border-default rounded-lg focus:outline-none focus:border-brand-500 text-sm cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
            ))}
          </select>
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Result count and clear filters */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-tertiary">
          {resultCount} project{resultCount !== 1 ? 's' : ''}
          {hasActiveFilters && ' found'}
        </span>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchValue('');
              onFilterChange({ status: 'all', techStack: 'all', search: '' });
            }}
            className="text-brand-400 hover:text-brand-500 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
