import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking fetch
const { analyzeGitHubRepo } = await import('../github-analyzer');

describe('analyzeGitHubRepo', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockRepoInfo = {
    name: 'test-repo',
    description: 'A test repository',
    stargazers_count: 100,
    forks_count: 25,
    watchers_count: 100,
    language: 'TypeScript',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    pushed_at: '2024-02-01T00:00:00Z',
    html_url: 'https://github.com/test/test-repo',
    homepage: 'https://test-repo.vercel.app',
    default_branch: 'main',
    topics: ['typescript', 'react'],
  };

  const mockContents = [
    { name: 'package.json', type: 'file', download_url: 'https://raw.githubusercontent.com/test/test-repo/main/package.json' },
    { name: 'README.md', type: 'file', download_url: 'https://raw.githubusercontent.com/test/test-repo/main/README.md' },
    { name: 'tsconfig.json', type: 'file', download_url: 'https://raw.githubusercontent.com/test/test-repo/main/tsconfig.json' },
    { name: 'src', type: 'dir', download_url: null },
  ];

  const mockPackageJson = {
    content: Buffer.from(JSON.stringify({
      name: 'test-repo',
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
        next: '^14.0.0',
        tailwindcss: '^3.0.0',
      },
    })).toString('base64'),
    encoding: 'base64',
  };

  const mockReadme = {
    content: Buffer.from(`# Test Repo

A cool test repository for testing purposes.

## Features
- Feature 1
- Feature 2

## Demo
Check out the live demo: https://test-repo.vercel.app
`).toString('base64'),
    encoding: 'base64',
  };

  it('should analyze a repository and return correct data', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepoInfo),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPackageJson),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReadme),
        headers: new Headers(),
      });

    const result = await analyzeGitHubRepo('test', 'test-repo');

    expect(result.name).toBe('test-repo');
    expect(result.description).toBe('A test repository');
    expect(result.stats.stars).toBe(100);
    expect(result.stats.forks).toBe(25);
    expect(result.stats.language).toBe('TypeScript');
    expect(result.deploymentUrl).toBe('https://test-repo.vercel.app');
    expect(result.techStack).toContain('TypeScript');
    expect(result.techStack).toContain('React');
    expect(result.techStack).toContain('Next.js');
    expect(result.techStack).toContain('Tailwind');
  });

  it('should detect tech stack from file names', async () => {
    const contentsWithDocker = [
      ...mockContents,
      { name: 'Dockerfile', type: 'file', download_url: null },
      { name: 'docker-compose.yml', type: 'file', download_url: null },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepoInfo),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(contentsWithDocker),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPackageJson),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReadme),
        headers: new Headers(),
      });

    const result = await analyzeGitHubRepo('test', 'test-repo');

    expect(result.techStack).toContain('Docker');
  });

  it('should handle rate limit errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
      }),
    });

    await expect(analyzeGitHubRepo('test', 'test-repo')).rejects.toThrow(/rate limit/i);
  });

  it('should handle 404 errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    });

    await expect(analyzeGitHubRepo('test', 'nonexistent-repo')).rejects.toThrow(/404/);
  });

  it('should extract deployment URL from README', async () => {
    const repoWithoutHomepage = { ...mockRepoInfo, homepage: null };
    const readmeWithNetlify = {
      content: Buffer.from(`# My App

Check it out at https://my-app.netlify.app/
`).toString('base64'),
      encoding: 'base64',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(repoWithoutHomepage),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContents),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPackageJson),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(readmeWithNetlify),
        headers: new Headers(),
      });

    const result = await analyzeGitHubRepo('test', 'test-repo');

    expect(result.deploymentUrl).toBe('https://my-app.netlify.app/');
  });

  it('should detect Python tech stack', async () => {
    const pythonRepo = { ...mockRepoInfo, language: 'Python' };
    const pythonContents = [
      { name: 'requirements.txt', type: 'file', download_url: null },
      { name: 'README.md', type: 'file', download_url: null },
    ];
    const requirementsTxt = {
      content: Buffer.from('django==4.2.0\npsycopg2-binary==2.9.0\n').toString('base64'),
      encoding: 'base64',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(pythonRepo),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(pythonContents),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(requirementsTxt),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReadme),
        headers: new Headers(),
      });

    const result = await analyzeGitHubRepo('test', 'test-repo');

    expect(result.techStack).toContain('Python');
    expect(result.techStack).toContain('Django');
  });

  it('should detect Go tech stack', async () => {
    const goRepo = { ...mockRepoInfo, language: 'Go' };
    const goContents = [
      { name: 'go.mod', type: 'file', download_url: null },
      { name: 'main.go', type: 'file', download_url: null },
    ];
    const goMod = {
      content: Buffer.from('module example.com/app\n\nrequire github.com/gin-gonic/gin v1.9.0\n').toString('base64'),
      encoding: 'base64',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(goRepo),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(goContents),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(goMod),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      });

    const result = await analyzeGitHubRepo('test', 'test-repo');

    expect(result.techStack).toContain('Go');
    expect(result.techStack).toContain('Gin');
  });

  it('should detect Rust tech stack', async () => {
    const rustRepo = { ...mockRepoInfo, language: 'Rust' };
    const rustContents = [
      { name: 'Cargo.toml', type: 'file', download_url: null },
      { name: 'src', type: 'dir', download_url: null },
    ];
    const cargoToml = {
      content: Buffer.from('[dependencies]\nactix-web = "4"\n').toString('base64'),
      encoding: 'base64',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rustRepo),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rustContents),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(cargoToml),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      });

    const result = await analyzeGitHubRepo('test', 'test-repo');

    expect(result.techStack).toContain('Rust');
    expect(result.techStack).toContain('Actix');
  });
});
