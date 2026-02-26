"use client";

import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";

interface ProjectsFiltersProps {
  languages: string[];
  languageCounts: Record<string, number>;
  statusCounts: Record<"active" | "recent" | "archived", number>;
}

// Use URL search params to sync filters
export function useProjectFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "active" | "recent" | "archived"
  >("all");
  const [sortBy, setSortBy] = useState<
    "mentions" | "stars" | "recent" | "name"
  >("mentions");

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedLanguage(null);
    setSelectedStatus("all");
    setSortBy("mentions");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    selectedStatus,
    setSelectedStatus,
    sortBy,
    setSortBy,
    clearFilters,
  };
}

// Filter context to share state between components
import { createContext, useContext } from "react";

interface FilterContextType {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedLanguage: string | null;
  setSelectedLanguage: (value: string | null) => void;
  selectedStatus: "all" | "active" | "recent" | "archived";
  setSelectedStatus: (value: "all" | "active" | "recent" | "archived") => void;
  sortBy: "mentions" | "stars" | "recent" | "name";
  setSortBy: (value: "mentions" | "stars" | "recent" | "name") => void;
  clearFilters: () => void;
}

export const FilterContext = createContext<FilterContextType | null>(null);

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within FilterProvider");
  }
  return context;
}

export function ProjectsFilters({
  languages,
  languageCounts,
  statusCounts,
}: ProjectsFiltersProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedLanguage,
    setSelectedLanguage,
    selectedStatus,
    setSelectedStatus,
  } = useFilterContext();

  const handleLanguageClick = (language: string | null) => {
    setSelectedLanguage(language === selectedLanguage ? null : language);
  };

  const handleStatusClick = (
    status: "all" | "active" | "recent" | "archived"
  ) => {
    setSelectedStatus(status);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
        Filters
      </h3>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          className="w-full pl-10 pr-10 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Language Filter */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-[var(--color-text)] mb-3">
          Language
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleLanguageClick(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedLanguage === null
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            All
          </button>
          {languages.map((language) => (
            <button
              key={language}
              onClick={() => handleLanguageClick(language)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedLanguage === language
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
              }`}
            >
              {language}{" "}
              <span className="opacity-60">{languageCounts[language]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <div className="text-sm font-semibold text-[var(--color-text)] mb-3">
          Status
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusClick("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedStatus === "all"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusClick("active")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedStatus === "active"
                ? "bg-green-500/10 text-green-500 border border-green-500"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            Active <span className="opacity-60">{statusCounts.active}</span>
          </button>
          <button
            onClick={() => handleStatusClick("recent")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedStatus === "recent"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            Recent <span className="opacity-60">{statusCounts.recent}</span>
          </button>
          <button
            onClick={() => handleStatusClick("archived")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedStatus === "archived"
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-text-secondary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            Archived <span className="opacity-60">{statusCounts.archived}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
