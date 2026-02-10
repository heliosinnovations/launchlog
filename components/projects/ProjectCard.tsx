'use client';

import Link from 'next/link';
import { TechStackBadges } from './TechStackBadges';
import { GithubStats } from './GithubStats';

export interface Project {
  id: string;
  repo_name: string;
  repo_owner: string;
  github_repo_url: string;
  description: string | null;
  custom_name: string | null;
  custom_description: string | null;
  tech_stack: string[] | null;
  github_stars: number;
  github_forks: number;
  primary_language: string | null;
  deployment_url: string | null;
  screenshot_url: string | null;
  status: 'analyzing' | 'ready' | 'error';
  created_at: string;
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const name = project.custom_name || project.repo_name;
  const description = project.custom_description || project.description;
  const isAnalyzing = project.status === 'analyzing';
  const hasError = project.status === 'error';

  return (
    <article className="group bg-bg-secondary border border-border-default rounded-xl overflow-hidden hover:border-border-hover transition-all">
      {/* Screenshot or Placeholder */}
      <div className="aspect-video bg-bg-tertiary relative overflow-hidden">
        {project.screenshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.screenshot_url}
            alt={`Screenshot of ${name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-text-tertiary">Analyzing...</span>
              </div>
            ) : (
              <svg className="w-12 h-12 text-border-default" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        )}

        {/* Status badge */}
        {hasError && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-danger-500/80 text-white text-xs rounded">
            Error
          </div>
        )}

        {/* External link overlay */}
        {project.deployment_url && (
          <a
            href={project.deployment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <span className="bg-white text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
              Visit Site
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Links */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">{name}</h3>
          <a
            href={project.github_repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="View on GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
            </svg>
          </a>
        </div>

        {/* Description */}
        {description && (
          <p className="text-text-secondary text-sm line-clamp-2">{description}</p>
        )}

        {/* Tech Stack */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <TechStackBadges stack={project.tech_stack} maxVisible={4} size="sm" />
        )}

        {/* GitHub Stats */}
        <GithubStats
          stars={project.github_stars}
          forks={project.github_forks}
          language={project.primary_language}
          size="sm"
        />
      </div>
    </article>
  );
}
