'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project, ProjectStatus, ProjectMetrics, ProjectUpdatePayload } from '@/types/project';
import { Button } from '@/components/ui/Button';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { MetricsEditor } from './MetricsEditor';
import { ScreenshotUploader } from './ScreenshotUploader';
import { DeleteProjectModal } from './DeleteProjectModal';

interface ProjectEditFormProps {
  project: Project;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'shipped', label: 'Shipped' },
  { value: 'beta', label: 'Beta' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'sunset', label: 'Sunset' },
];

export function ProjectEditForm({ project: initialProject }: ProjectEditFormProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [techInput, setTechInput] = useState('');

  const handleChange = <K extends keyof ProjectUpdatePayload>(key: K, value: ProjectUpdatePayload[K]) => {
    setProject((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddTech = () => {
    if (!techInput.trim()) return;
    const stack = project.tech_stack || [];
    if (!stack.includes(techInput.trim())) {
      handleChange('tech_stack', [...stack, techInput.trim()]);
    }
    setTechInput('');
  };

  const handleRemoveTech = (tech: string) => {
    const stack = project.tech_stack || [];
    handleChange('tech_stack', stack.filter((t) => t !== tech));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: ProjectUpdatePayload = {
        custom_name: project.custom_name || undefined,
        custom_description: project.custom_description || undefined,
        tech_stack: project.tech_stack || undefined,
        deployment_url: project.deployment_url || undefined,
        github_repo_url: project.github_repo_url,
        project_status: project.project_status,
        metrics: project.metrics,
        metrics_public: project.metrics_public,
        screenshots: project.screenshots,
        primary_screenshot_index: project.primary_screenshot_index,
        is_public: project.is_public,
      };

      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }

      setProject(data);
      setSuccess('Changes saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hardDelete: boolean) => {
    const res = await fetch(`/api/projects/${project.id}${hardDelete ? '?hard=true' : ''}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Delete failed');
    }

    router.push('/dashboard');
  };

  const displayName = project.custom_name || project.repo_name;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Edit Project</h1>
          <p className="text-text-secondary">{displayName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-lg text-danger-400">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-success-500/10 border border-success-500/20 rounded-lg text-success-400">{success}</div>
      )}

      {/* Form Sections */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <section className="bg-bg-secondary border border-border-default rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <input
                type="text"
                value={project.custom_name || ''}
                onChange={(e) => handleChange('custom_name', e.target.value || null)}
                placeholder={project.repo_name}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500"
              />
              <p className="text-xs text-text-tertiary mt-1">Leave empty to use repo name: {project.repo_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={project.custom_description || project.description || ''}
                onChange={(e) => handleChange('custom_description', e.target.value || null)}
                rows={4}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500 resize-none"
                placeholder="Describe your project..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('project_status', opt.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      project.project_status === opt.value
                        ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                        : 'border-border-default hover:border-border-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <ProjectStatusBadge status={project.project_status} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.is_public}
                  onChange={(e) => handleChange('is_public', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm">Show on public profile</span>
            </div>
          </section>

          {/* Links */}
          <section className="bg-bg-secondary border border-border-default rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Links</h2>

            <div>
              <label className="block text-sm font-medium mb-2">GitHub URL</label>
              <input
                type="url"
                value={project.github_repo_url || ''}
                onChange={(e) => handleChange('github_repo_url', e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deployment URL</label>
              <input
                type="url"
                value={project.deployment_url || ''}
                onChange={(e) => handleChange('deployment_url', e.target.value || null)}
                placeholder="https://your-app.com"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>
          </section>

          {/* Tech Stack */}
          <section className="bg-bg-secondary border border-border-default rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Tech Stack</h2>

            <div className="flex flex-wrap gap-2">
              {(project.tech_stack || []).map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-full text-sm"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tech)}
                    className="hover:text-danger-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTech())}
                placeholder="Add technology..."
                className="flex-1 px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg focus:outline-none focus:border-brand-500"
              />
              <Button type="button" variant="secondary" onClick={handleAddTech}>
                Add
              </Button>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Screenshots */}
          <section className="bg-bg-secondary border border-border-default rounded-xl p-6">
            <ScreenshotUploader
              projectId={project.id}
              screenshots={project.screenshots || []}
              primaryIndex={project.primary_screenshot_index || 0}
              onUpdate={(screenshots, primaryIndex) => {
                setProject((prev) => ({ ...prev, screenshots, primary_screenshot_index: primaryIndex }));
              }}
            />
          </section>

          {/* Metrics */}
          <section className="bg-bg-secondary border border-border-default rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Metrics</h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={project.metrics_public}
                  onChange={(e) => handleChange('metrics_public', e.target.checked)}
                  className="rounded border-border-default bg-bg-tertiary"
                />
                Public
              </label>
            </div>
            <MetricsEditor
              metrics={project.metrics || {}}
              onChange={(metrics: ProjectMetrics) => handleChange('metrics', metrics)}
            />
          </section>

          {/* Danger Zone */}
          <section className="bg-danger-500/5 border border-danger-500/20 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-danger-400">Danger Zone</h2>
            <p className="text-sm text-text-secondary">
              Deleting a project will remove it from your public profile.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowDeleteModal(true)}
              className="bg-danger-500 hover:bg-danger-600"
            >
              Delete Project
            </Button>
          </section>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteProjectModal
        projectName={displayName}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
      />
    </div>
  );
}
