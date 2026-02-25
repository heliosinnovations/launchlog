"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Star,
  Check,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Code,
  Camera,
  Upload,
  SkipForward,
  ImageIcon,
  X,
  Globe,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface Repo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  updatedAt: string;
}

type ScreenshotOption = "auto" | "upload" | "skip";

interface RepoScreenshotConfig {
  repoId: number;
  option: ScreenshotOption;
  uploadedFile?: File;
  previewUrl?: string;
  autoCapturing?: boolean;
  error?: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Vue: "#41b883",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Scala: "#c22d40",
};

// Steps in the onboarding flow
type OnboardingStep = "select" | "screenshots" | "preview";

export default function OnboardingPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding step
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("select");

  // Screenshot configuration
  const [screenshotConfigs, setScreenshotConfigs] = useState<
    Map<number, RepoScreenshotConfig>
  >(new Map());

  const fetchRepos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/github/repos");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/signin");
          return;
        }
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data.repos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos;

    const query = searchQuery.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query) ||
        repo.topics.some((t) => t.toLowerCase().includes(query)),
    );
  }, [repos, searchQuery]);

  const selectedReposList = useMemo(() => {
    return repos.filter((repo) => selectedRepos.has(repo.id));
  }, [repos, selectedRepos]);

  function toggleRepo(repoId: number) {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) {
        next.delete(repoId);
      } else {
        next.add(repoId);
      }
      return next;
    });
  }

  // Initialize screenshot configs when moving to screenshot step
  function initializeScreenshotConfigs() {
    const configs = new Map<number, RepoScreenshotConfig>();
    selectedReposList.forEach((repo) => {
      // Smart default: if repo has homepage (demo URL), default to auto-capture
      const hasHomepage = repo.homepage && repo.homepage.trim() !== "";
      configs.set(repo.id, {
        repoId: repo.id,
        option: hasHomepage ? "auto" : "upload",
      });
    });
    setScreenshotConfigs(configs);
  }

  function handleContinueToScreenshots() {
    if (selectedRepos.size === 0) {
      setError("Please select at least one repository");
      return;
    }
    initializeScreenshotConfigs();
    setCurrentStep("screenshots");
    setError(null);
  }

  function handleBackToSelect() {
    setCurrentStep("select");
    setError(null);
  }

  function handleContinueToPreview() {
    setCurrentStep("preview");
    setError(null);
  }

  function handleBackToScreenshots() {
    setCurrentStep("screenshots");
    setError(null);
  }

  function updateScreenshotConfig(
    repoId: number,
    update: Partial<RepoScreenshotConfig>,
  ) {
    setScreenshotConfigs((prev) => {
      const next = new Map(prev);
      const current = next.get(repoId) || { repoId, option: "skip" as const };
      next.set(repoId, { ...current, ...update });
      return next;
    });
  }

  function handleBulkAutoCapture() {
    setScreenshotConfigs((prev) => {
      const next = new Map(prev);
      selectedReposList.forEach((repo) => {
        const current = next.get(repo.id) || {
          repoId: repo.id,
          option: "skip" as const,
        };
        // Only auto-capture repos with homepage URL
        if (repo.homepage && repo.homepage.trim() !== "") {
          next.set(repo.id, { ...current, option: "auto" });
        }
      });
      return next;
    });
  }

  function handleBulkSkipAll() {
    setScreenshotConfigs((prev) => {
      const next = new Map(prev);
      selectedReposList.forEach((repo) => {
        const current = next.get(repo.id) || {
          repoId: repo.id,
          option: "skip" as const,
        };
        next.set(repo.id, { ...current, option: "skip" });
      });
      return next;
    });
  }

  function handleFileUpload(repoId: number, file: File) {
    const previewUrl = URL.createObjectURL(file);
    updateScreenshotConfig(repoId, {
      option: "upload",
      uploadedFile: file,
      previewUrl,
      error: undefined,
    });
  }

  function clearUpload(repoId: number) {
    const config = screenshotConfigs.get(repoId);
    if (config?.previewUrl) {
      URL.revokeObjectURL(config.previewUrl);
    }
    updateScreenshotConfig(repoId, {
      uploadedFile: undefined,
      previewUrl: undefined,
    });
  }

  async function handleSubmit() {
    if (selectedRepos.size === 0) {
      setError("Please select at least one repository");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const selectedRepoData = repos
        .filter((repo) => selectedRepos.has(repo.id))
        .map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          url: repo.url,
          language: repo.language,
          stars: repo.stars,
        }));

      const response = await fetch("/api/user/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repos: selectedRepoData }),
      });

      if (!response.ok) {
        throw new Error("Failed to save selections");
      }

      // TODO: In the future, process screenshots here
      // For now, we just save the repos and redirect

      const data = await response.json();
      router.push(data.redirectUrl || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">
            Loading your repositories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <StepIndicator
            step={1}
            label="Select Repos"
            active={currentStep === "select"}
            completed={currentStep !== "select"}
          />
          <div className="w-8 h-0.5 bg-[var(--color-border)]" />
          <StepIndicator
            step={2}
            label="Screenshots"
            active={currentStep === "screenshots"}
            completed={currentStep === "preview"}
          />
          <div className="w-8 h-0.5 bg-[var(--color-border)]" />
          <StepIndicator
            step={3}
            label="Preview"
            active={currentStep === "preview"}
            completed={false}
          />
        </div>

        {/* Step 1: Select Repositories */}
        {currentStep === "select" && (
          <RepoSelectionStep
            repos={repos}
            filteredRepos={filteredRepos}
            selectedRepos={selectedRepos}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            toggleRepo={toggleRepo}
            error={error}
            onContinue={handleContinueToScreenshots}
          />
        )}

        {/* Step 2: Screenshot Configuration */}
        {currentStep === "screenshots" && (
          <ScreenshotConfigStep
            selectedRepos={selectedReposList}
            screenshotConfigs={screenshotConfigs}
            updateScreenshotConfig={updateScreenshotConfig}
            handleFileUpload={handleFileUpload}
            clearUpload={clearUpload}
            onBulkAutoCapture={handleBulkAutoCapture}
            onBulkSkipAll={handleBulkSkipAll}
            onBack={handleBackToSelect}
            onContinue={handleContinueToPreview}
            error={error}
          />
        )}

        {/* Step 3: Preview */}
        {currentStep === "preview" && (
          <PreviewStep
            selectedRepos={selectedReposList}
            screenshotConfigs={screenshotConfigs}
            onBack={handleBackToScreenshots}
            onSubmit={handleSubmit}
            saving={saving}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  label,
  active,
  completed,
}: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
          completed
            ? "bg-green-500 text-white"
            : active
              ? "bg-indigo-500 text-white"
              : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
        }`}
      >
        {completed ? <Check className="w-4 h-4" /> : step}
      </div>
      <span
        className={`hidden sm:inline text-sm font-medium ${
          active
            ? "text-[var(--color-text)]"
            : "text-[var(--color-text-secondary)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// Step 1: Repository Selection
function RepoSelectionStep({
  filteredRepos,
  selectedRepos,
  searchQuery,
  setSearchQuery,
  toggleRepo,
  error,
  onContinue,
}: {
  repos: Repo[];
  filteredRepos: Repo[];
  selectedRepos: Set<number>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleRepo: (repoId: number) => void;
  error: string | null;
  onContinue: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <h1
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Select Your Best Work
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base md:text-lg max-w-xl mx-auto">
          Choose the repositories you want to showcase on your LaunchLog
          profile. You can change this later.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
        <input
          type="text"
          placeholder="Search by name, language, or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Selection count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {filteredRepos.length} repositories
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
        <p className="text-sm font-medium text-indigo-500">
          {selectedRepos.size} selected
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Repo grid */}
      <div className="grid gap-3 mb-8">
        {filteredRepos.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <Code className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--color-text-secondary)]">
              {searchQuery
                ? "No repositories match your search"
                : "No public repositories found"}
            </p>
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              selected={selectedRepos.has(repo.id)}
              onToggle={() => toggleRepo(repo.id)}
            />
          ))
        )}
      </div>

      {/* Continue button */}
      <div className="sticky bottom-6 flex justify-center">
        <button
          onClick={onContinue}
          disabled={selectedRepos.size === 0}
          className="inline-flex items-center gap-2.5 px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold text-base md:text-lg transition-all duration-300 hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          Continue to Screenshots
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

function RepoCard({
  repo,
  selected,
  onToggle,
}: {
  repo: Repo;
  selected: boolean;
  onToggle: () => void;
}) {
  const languageColor = repo.language
    ? LANGUAGE_COLORS[repo.language] || "#6e7681"
    : null;

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? "bg-indigo-500/10 border-indigo-500"
          : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-text-secondary)]/30"
      }`}
    >
      <div className="flex items-start gap-3 md:gap-4">
        {/* Checkbox */}
        <div
          className={`flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            selected
              ? "bg-indigo-500 border-indigo-500"
              : "border-[var(--color-border)]"
          }`}
        >
          {selected && <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-[var(--color-text)] truncate text-sm md:text-base">
              {repo.name}
            </h3>
            {repo.homepage && (
              <span title="Has demo URL">
                <Globe className="w-3.5 h-3.5 text-green-500" />
              </span>
            )}
            {repo.stars > 0 && (
              <span className="inline-flex items-center gap-1 text-xs md:text-sm text-[var(--color-text-secondary)]">
                <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current text-amber-400" />
                {repo.stars.toLocaleString()}
              </span>
            )}
          </div>

          {repo.description && (
            <p className="text-xs md:text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-2">
              {repo.description}
            </p>
          )}

          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {repo.language && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <span
                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full"
                  style={{ backgroundColor: languageColor || "#6e7681" }}
                />
                {repo.language}
              </span>
            )}
            {repo.topics.slice(0, 2).map((topic) => (
              <span
                key={topic}
                className="px-1.5 md:px-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-400 rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// Step 2: Screenshot Configuration
function ScreenshotConfigStep({
  selectedRepos,
  screenshotConfigs,
  updateScreenshotConfig,
  handleFileUpload,
  clearUpload,
  onBulkAutoCapture,
  onBulkSkipAll,
  onBack,
  onContinue,
  error,
}: {
  selectedRepos: Repo[];
  screenshotConfigs: Map<number, RepoScreenshotConfig>;
  updateScreenshotConfig: (
    repoId: number,
    update: Partial<RepoScreenshotConfig>,
  ) => void;
  handleFileUpload: (repoId: number, file: File) => void;
  clearUpload: (repoId: number) => void;
  onBulkAutoCapture: () => void;
  onBulkSkipAll: () => void;
  onBack: () => void;
  onContinue: () => void;
  error: string | null;
}) {
  const reposWithHomepage = selectedRepos.filter(
    (r) => r.homepage && r.homepage.trim() !== "",
  );

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <h1
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Configure Screenshots
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base md:text-lg max-w-xl mx-auto">
          Add screenshots to make your projects stand out. Choose how to capture
          each one.
        </p>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Quick Actions:
        </span>
        <div className="flex flex-wrap gap-2">
          {reposWithHomepage.length > 0 && (
            <button
              onClick={onBulkAutoCapture}
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Auto-capture all ({reposWithHomepage.length})
            </button>
          )}
          <button
            onClick={onBulkSkipAll}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg text-sm font-medium transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Skip all screenshots
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Repo Screenshot Cards */}
      <div className="space-y-4 mb-8">
        {selectedRepos.map((repo) => (
          <RepoScreenshotCard
            key={repo.id}
            repo={repo}
            config={screenshotConfigs.get(repo.id)}
            onOptionChange={(option) =>
              updateScreenshotConfig(repo.id, { option })
            }
            onFileUpload={(file) => handleFileUpload(repo.id, file)}
            onClearUpload={() => clearUpload(repo.id)}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="sticky bottom-6 flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl font-semibold transition-all hover:bg-[var(--color-surface-elevated)]"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2.5 px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold text-base md:text-lg transition-all duration-300 hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.45)]"
        >
          Continue to Preview
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

function RepoScreenshotCard({
  repo,
  config,
  onOptionChange,
  onFileUpload,
  onClearUpload,
}: {
  repo: Repo;
  config: RepoScreenshotConfig | undefined;
  onOptionChange: (option: ScreenshotOption) => void;
  onFileUpload: (file: File) => void;
  onClearUpload: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentOption = config?.option || "skip";
  const hasHomepage = repo.homepage && repo.homepage.trim() !== "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      onFileUpload(file);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-5">
      {/* Repo Info */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--color-text)] truncate">
            {repo.name}
          </h3>
          {repo.description && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">
              {repo.description}
            </p>
          )}
        </div>
        {hasHomepage && (
          <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs font-medium">
            <Globe className="w-3 h-3" />
            Demo URL
          </span>
        )}
      </div>

      {/* Screenshot Options */}
      <div className="flex flex-wrap gap-2 mb-4">
        <ScreenshotOptionButton
          icon={<Camera className="w-4 h-4" />}
          label="Auto-capture"
          selected={currentOption === "auto"}
          disabled={!hasHomepage}
          onClick={() => onOptionChange("auto")}
          tooltip={!hasHomepage ? "No demo URL available" : undefined}
        />
        <ScreenshotOptionButton
          icon={<Upload className="w-4 h-4" />}
          label="Upload"
          selected={currentOption === "upload"}
          onClick={() => onOptionChange("upload")}
        />
        <ScreenshotOptionButton
          icon={<SkipForward className="w-4 h-4" />}
          label="Skip"
          selected={currentOption === "skip"}
          onClick={() => onOptionChange("skip")}
        />
      </div>

      {/* Upload UI */}
      {currentOption === "upload" && (
        <div className="mt-4">
          {config?.previewUrl ? (
            <div className="relative">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]">
                <Image
                  src={config.previewUrl}
                  alt={`Screenshot for ${repo.name}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={onClearUpload}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"
                title="Remove screenshot"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                {config.uploadedFile?.name}
              </p>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="border-2 border-dashed border-[var(--color-border)] hover:border-indigo-500 rounded-xl p-6 text-center transition-colors">
                <ImageIcon className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <span className="text-indigo-500 font-medium">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </label>
          )}
        </div>
      )}

      {/* Auto-capture info */}
      {currentOption === "auto" && hasHomepage && (
        <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg">
          <p className="text-sm text-indigo-400">
            Screenshot will be captured from:{" "}
            <a
              href={repo.homepage!}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              {repo.homepage}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

function ScreenshotOptionButton({
  icon,
  label,
  selected,
  disabled = false,
  onClick,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  tooltip?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        selected
          ? "bg-indigo-500 text-white"
          : disabled
            ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] opacity-50 cursor-not-allowed"
            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// Step 3: Preview
function PreviewStep({
  selectedRepos,
  screenshotConfigs,
  onBack,
  onSubmit,
  saving,
  error,
}: {
  selectedRepos: Repo[];
  screenshotConfigs: Map<number, RepoScreenshotConfig>;
  onBack: () => void;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
}) {
  const getScreenshotStatus = (repoId: number) => {
    const config = screenshotConfigs.get(repoId);
    if (!config) return "skip";
    if (config.option === "auto") return "auto";
    if (config.option === "upload" && config.previewUrl) return "uploaded";
    if (config.option === "upload") return "pending-upload";
    return "skip";
  };

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <h1
          className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Preview Your Profile
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base md:text-lg max-w-xl mx-auto">
          Here&apos;s how your projects will appear on your LaunchLog profile.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Preview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {selectedRepos.map((repo) => {
          const status = getScreenshotStatus(repo.id);
          const config = screenshotConfigs.get(repo.id);
          const languageColor = repo.language
            ? LANGUAGE_COLORS[repo.language] || "#6e7681"
            : null;

          return (
            <div
              key={repo.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden"
            >
              {/* Screenshot Preview */}
              <div className="aspect-video bg-[var(--color-bg)] relative">
                {status === "uploaded" && config?.previewUrl ? (
                  <Image
                    src={config.previewUrl}
                    alt={repo.name}
                    fill
                    className="object-cover"
                  />
                ) : status === "auto" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
                    <Camera className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">Auto-capture pending</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">No screenshot</span>
                  </div>
                )}
              </div>

              {/* Repo Info */}
              <div className="p-4">
                <h3 className="font-semibold text-[var(--color-text)] truncate mb-1">
                  {repo.name}
                </h3>
                {repo.description && (
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-3">
                    {repo.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  {repo.language && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: languageColor || "#6e7681" }}
                      />
                      {repo.language}
                    </span>
                  )}
                  {repo.stars > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {repo.stars}
                    </span>
                  )}
                </div>
              </div>

              {/* Change button */}
              <div className="px-4 pb-4">
                <button
                  onClick={onBack}
                  className="w-full py-2 text-sm text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
                >
                  Change screenshot
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl mb-8">
        <h3 className="font-semibold mb-3">Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-500">
              {selectedRepos.length}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              Projects
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">
              {
                selectedRepos.filter(
                  (r) =>
                    screenshotConfigs.get(r.id)?.option === "auto" &&
                    r.homepage,
                ).length
              }
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              Auto-capture
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-500">
              {
                selectedRepos.filter(
                  (r) =>
                    screenshotConfigs.get(r.id)?.option === "upload" &&
                    screenshotConfigs.get(r.id)?.previewUrl,
                ).length
              }
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              Uploaded
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--color-text-secondary)]">
              {
                selectedRepos.filter(
                  (r) => screenshotConfigs.get(r.id)?.option === "skip",
                ).length
              }
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              Skipped
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="sticky bottom-6 flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={onBack}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl font-semibold transition-all hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2.5 px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white rounded-xl font-semibold text-base md:text-lg transition-all duration-300 hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Profile...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Create My LaunchLog Profile
            </>
          )}
        </button>
      </div>
    </>
  );
}
