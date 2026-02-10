import type { ProjectStatus } from '@/types/project';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  shipped: { label: 'Shipped', color: 'bg-success-500/10 text-success-400 border-success-500/20' },
  beta: { label: 'Beta', color: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-warning-500/10 text-warning-400 border-warning-500/20' },
  sunset: { label: 'Sunset', color: 'bg-text-tertiary/10 text-text-tertiary border-text-tertiary/20' },
  analyzing: { label: 'Analyzing', color: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  ready: { label: 'Ready', color: 'bg-success-500/10 text-success-400 border-success-500/20' },
  error: { label: 'Error', color: 'bg-danger-500/10 text-danger-400 border-danger-500/20' },
};

export function ProjectStatusBadge({ status, size = 'md' }: ProjectStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.shipped;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium border rounded-full ${config.color} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
