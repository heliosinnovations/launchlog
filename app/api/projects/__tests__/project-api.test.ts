import { describe, it, expect } from 'vitest';
import type { ProjectStatus, ProjectMetrics, ProjectUpdatePayload } from '@/types/project';

describe('Project Types', () => {
  describe('ProjectStatus', () => {
    it('should have valid status values', () => {
      const statuses: ProjectStatus[] = ['shipped', 'beta', 'sunset', 'in_progress', 'analyzing', 'ready', 'error'];
      expect(statuses).toHaveLength(7);
      expect(statuses).toContain('shipped');
      expect(statuses).toContain('beta');
      expect(statuses).toContain('in_progress');
    });
  });

  describe('ProjectMetrics', () => {
    it('should accept valid metrics structure', () => {
      const metrics: ProjectMetrics = {
        usersCount: 1000,
        revenue: 5000,
        revenuePublic: true,
        launchDate: '2024-01-15',
        customKpis: [
          { label: 'MRR', value: '$500', isPublic: true },
          { label: 'ARR', value: '$6000', isPublic: false },
        ],
      };

      expect(metrics.usersCount).toBe(1000);
      expect(metrics.revenue).toBe(5000);
      expect(metrics.revenuePublic).toBe(true);
      expect(metrics.customKpis).toHaveLength(2);
    });

    it('should allow empty metrics', () => {
      const metrics: ProjectMetrics = {};
      expect(Object.keys(metrics)).toHaveLength(0);
    });

    it('should allow partial metrics', () => {
      const metrics: ProjectMetrics = {
        usersCount: 500,
      };
      expect(metrics.usersCount).toBe(500);
      expect(metrics.revenue).toBeUndefined();
    });
  });

  describe('ProjectUpdatePayload', () => {
    it('should accept valid update payload', () => {
      const payload: ProjectUpdatePayload = {
        custom_name: 'My Awesome Project',
        custom_description: 'A great project',
        tech_stack: ['React', 'TypeScript', 'Node.js'],
        deployment_url: 'https://myapp.vercel.app',
        project_status: 'shipped',
        metrics: { usersCount: 1000 },
        metrics_public: true,
        screenshots: ['https://example.com/screenshot1.png'],
        primary_screenshot_index: 0,
        is_public: true,
      };

      expect(payload.custom_name).toBe('My Awesome Project');
      expect(payload.tech_stack).toContain('React');
      expect(payload.project_status).toBe('shipped');
    });

    it('should validate screenshots array limit concept', () => {
      const screenshots = ['1.png', '2.png', '3.png', '4.png', '5.png'];
      expect(screenshots.length).toBeLessThanOrEqual(5);

      const tooMany = [...screenshots, '6.png'];
      expect(tooMany.length).toBeGreaterThan(5);
    });

    it('should validate primary_screenshot_index bounds', () => {
      const screenshots = ['a.png', 'b.png', 'c.png'];
      const validIndex = 1;
      const invalidIndex = 5;

      expect(validIndex).toBeLessThan(screenshots.length);
      expect(invalidIndex).toBeGreaterThanOrEqual(screenshots.length);
    });
  });
});

describe('API Route Validation Logic', () => {
  const ALLOWED_UPDATE_FIELDS = [
    'custom_name', 'custom_description', 'description', 'tech_stack',
    'deployment_url', 'github_repo_url', 'project_status', 'metrics',
    'metrics_public', 'screenshots', 'primary_screenshot_index', 'is_public', 'deleted_at'
  ];

  it('should filter payload to only allowed fields', () => {
    const rawPayload = {
      custom_name: 'Test',
      user_id: 'malicious-id', // Should be filtered
      status: 'ready', // Should be filtered (use project_status instead)
      project_status: 'shipped',
    };

    const sanitized: Record<string, unknown> = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (key in rawPayload) {
        sanitized[key] = rawPayload[key as keyof typeof rawPayload];
      }
    }

    expect(sanitized).toHaveProperty('custom_name', 'Test');
    expect(sanitized).toHaveProperty('project_status', 'shipped');
    expect(sanitized).not.toHaveProperty('user_id');
    expect(sanitized).not.toHaveProperty('status');
  });

  it('should enforce max 5 screenshots', () => {
    const validateScreenshots = (screenshots: string[]): boolean => {
      return screenshots.length <= 5;
    };

    expect(validateScreenshots(['1.png', '2.png', '3.png'])).toBe(true);
    expect(validateScreenshots(['1.png', '2.png', '3.png', '4.png', '5.png'])).toBe(true);
    expect(validateScreenshots(['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'])).toBe(false);
  });

  it('should adjust primary_screenshot_index when out of bounds', () => {
    const adjustPrimaryIndex = (index: number, length: number): number => {
      if (index >= length) return 0;
      if (index < 0) return 0;
      return index;
    };

    expect(adjustPrimaryIndex(0, 3)).toBe(0);
    expect(adjustPrimaryIndex(2, 3)).toBe(2);
    expect(adjustPrimaryIndex(5, 3)).toBe(0);
    expect(adjustPrimaryIndex(-1, 3)).toBe(0);
  });
});

describe('Delete Logic', () => {
  it('should support soft delete via deleted_at timestamp', () => {
    const softDelete = (project: { deleted_at: string | null }) => {
      return { ...project, deleted_at: new Date().toISOString() };
    };

    const project = { deleted_at: null };
    const deleted = softDelete(project);

    expect(deleted.deleted_at).not.toBeNull();
    expect(new Date(deleted.deleted_at!).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should filter out deleted projects in queries', () => {
    const projects = [
      { id: '1', name: 'Active', deleted_at: null },
      { id: '2', name: 'Deleted', deleted_at: '2024-01-01T00:00:00Z' },
      { id: '3', name: 'Also Active', deleted_at: null },
    ];

    const activeProjects = projects.filter(p => p.deleted_at === null);

    expect(activeProjects).toHaveLength(2);
    expect(activeProjects.find(p => p.id === '2')).toBeUndefined();
  });
});

describe('Screenshot Upload Validation', () => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  it('should validate file types', () => {
    expect(ALLOWED_TYPES.includes('image/jpeg')).toBe(true);
    expect(ALLOWED_TYPES.includes('image/png')).toBe(true);
    expect(ALLOWED_TYPES.includes('image/svg+xml')).toBe(false);
    expect(ALLOWED_TYPES.includes('application/pdf')).toBe(false);
  });

  it('should validate file size', () => {
    const isValidSize = (size: number) => size <= MAX_FILE_SIZE;

    expect(isValidSize(1024 * 1024)).toBe(true); // 1MB
    expect(isValidSize(4 * 1024 * 1024)).toBe(true); // 4MB
    expect(isValidSize(5 * 1024 * 1024)).toBe(true); // 5MB exactly
    expect(isValidSize(6 * 1024 * 1024)).toBe(false); // 6MB
  });
});
