/**
 * GitHub Repository Analyzer
 * Analyzes GitHub repositories to extract tech stack, stats, and deployment URLs
 */

interface GitHubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  html_url: string;
  homepage: string | null;
  default_branch: string;
  topics: string[];
}

interface FileContent {
  name: string;
  content: string;
}

export interface AnalysisResult {
  name: string;
  description: string;
  techStack: string[];
  stats: {
    stars: number;
    forks: number;
    watchers: number;
    language: string | null;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    topics: string[];
  };
  deploymentUrl: string | null;
  readmeContent: string | null;
}

// Tech stack detection patterns
const TECH_PATTERNS: Record<string, { files: string[]; dependencies?: string[] }> = {
  // JavaScript/TypeScript
  TypeScript: { files: ['tsconfig.json'], dependencies: ['typescript'] },
  React: { files: [], dependencies: ['react', 'react-dom'] },
  'Next.js': { files: ['next.config.js', 'next.config.ts', 'next.config.mjs'], dependencies: ['next'] },
  Vue: { files: ['vue.config.js'], dependencies: ['vue'] },
  Nuxt: { files: ['nuxt.config.js', 'nuxt.config.ts'], dependencies: ['nuxt'] },
  Angular: { files: ['angular.json'], dependencies: ['@angular/core'] },
  Svelte: { files: ['svelte.config.js'], dependencies: ['svelte'] },
  SvelteKit: { files: [], dependencies: ['@sveltejs/kit'] },
  Express: { files: [], dependencies: ['express'] },
  NestJS: { files: ['nest-cli.json'], dependencies: ['@nestjs/core'] },
  Fastify: { files: [], dependencies: ['fastify'] },
  Node: { files: ['package.json'] },
  Deno: { files: ['deno.json', 'deno.jsonc'] },
  Bun: { files: ['bun.lockb', 'bunfig.toml'] },
  Electron: { files: [], dependencies: ['electron'] },
  Tailwind: { files: ['tailwind.config.js', 'tailwind.config.ts'], dependencies: ['tailwindcss'] },
  Vite: { files: ['vite.config.js', 'vite.config.ts'], dependencies: ['vite'] },
  Webpack: { files: ['webpack.config.js'], dependencies: ['webpack'] },
  // Python
  Python: { files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'] },
  Django: { files: ['manage.py'], dependencies: ['django'] },
  Flask: { files: [], dependencies: ['flask'] },
  FastAPI: { files: [], dependencies: ['fastapi'] },
  // Go
  Go: { files: ['go.mod', 'go.sum'] },
  Gin: { files: [], dependencies: ['github.com/gin-gonic/gin'] },
  Fiber: { files: [], dependencies: ['github.com/gofiber/fiber'] },
  // Rust
  Rust: { files: ['Cargo.toml', 'Cargo.lock'] },
  Actix: { files: [], dependencies: ['actix-web'] },
  Axum: { files: [], dependencies: ['axum'] },
  // Java/Kotlin
  Java: { files: ['pom.xml', 'build.gradle'] },
  Kotlin: { files: ['build.gradle.kts'] },
  'Spring Boot': { files: [], dependencies: ['spring-boot'] },
  // Ruby
  Ruby: { files: ['Gemfile', 'Gemfile.lock'] },
  Rails: { files: [], dependencies: ['rails'] },
  // PHP
  PHP: { files: ['composer.json'] },
  Laravel: { files: ['artisan'], dependencies: ['laravel/framework'] },
  // Databases & Infrastructure
  PostgreSQL: { files: [], dependencies: ['pg', 'psycopg2', 'postgres'] },
  MongoDB: { files: [], dependencies: ['mongodb', 'mongoose', 'pymongo'] },
  Redis: { files: [], dependencies: ['redis', 'ioredis'] },
  Docker: { files: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'] },
  Kubernetes: { files: ['k8s.yaml', 'kubernetes.yaml'] },
  // Cloud/Services
  Supabase: { files: [], dependencies: ['@supabase/supabase-js', 'supabase'] },
  Firebase: { files: ['firebase.json'], dependencies: ['firebase', 'firebase-admin'] },
  Prisma: { files: ['prisma/schema.prisma'], dependencies: ['prisma', '@prisma/client'] },
  Drizzle: { files: [], dependencies: ['drizzle-orm'] },
  GraphQL: { files: [], dependencies: ['graphql', 'apollo-server'] },
  tRPC: { files: [], dependencies: ['@trpc/server', '@trpc/client'] },
};

// Deployment URL patterns
const DEPLOYMENT_PATTERNS = [
  /https?:\/\/[a-z0-9-]+\.vercel\.app\/?/gi,
  /https?:\/\/[a-z0-9-]+\.netlify\.app\/?/gi,
  /https?:\/\/[a-z0-9-]+\.herokuapp\.com\/?/gi,
  /https?:\/\/[a-z0-9-]+\.railway\.app\/?/gi,
  /https?:\/\/[a-z0-9-]+\.fly\.dev\/?/gi,
  /https?:\/\/[a-z0-9-]+\.render\.com\/?/gi,
  /https?:\/\/[a-z0-9-]+\.pages\.dev\/?/gi,
  /https?:\/\/[a-z0-9-]+\.web\.app\/?/gi,
  /https?:\/\/[a-z0-9-]+\.firebaseapp\.com\/?/gi,
  /https?:\/\/[a-z0-9-]+\.supabase\.co\/?/gi,
  // Custom domains with common patterns
  /https?:\/\/(?:www\.)?[a-z0-9][a-z0-9-]*\.[a-z]{2,}(?:\/[^\s)]*)?/gi,
];

async function fetchGitHubAPI<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'LaunchLog-Analyzer',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com${path}`, { headers });

  if (res.status === 403) {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    if (remaining === '0') {
      const resetTime = res.headers.get('X-RateLimit-Reset');
      throw new Error(`GitHub API rate limit exceeded. Resets at ${new Date(Number(resetTime) * 1000).toISOString()}`);
    }
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function getRepoInfo(owner: string, repo: string, token?: string): Promise<GitHubRepo> {
  return fetchGitHubAPI(`/repos/${owner}/${repo}`, token);
}

async function getRepoContents(owner: string, repo: string, path: string = '', token?: string): Promise<FileContent[]> {
  try {
    const contents = await fetchGitHubAPI<Array<{ name: string; type: string; download_url: string | null }>>(`/repos/${owner}/${repo}/contents/${path}`, token);
    return contents
      .filter((item) => item.type === 'file')
      .map((item) => ({ name: item.name, content: '' }));
  } catch {
    return [];
  }
}

async function getFileContent(owner: string, repo: string, path: string, token?: string): Promise<string | null> {
  try {
    const res = await fetchGitHubAPI<{ content: string; encoding: string }>(`/repos/${owner}/${repo}/contents/${path}`, token);
    if (res.encoding === 'base64') {
      return Buffer.from(res.content, 'base64').toString('utf-8');
    }
    return res.content;
  } catch {
    return null;
  }
}

function detectTechStackFromFiles(files: string[]): string[] {
  const detected = new Set<string>();

  for (const [tech, { files: patterns }] of Object.entries(TECH_PATTERNS)) {
    for (const pattern of patterns) {
      if (files.some((f) => f.toLowerCase() === pattern.toLowerCase() || f.includes(pattern))) {
        detected.add(tech);
        break;
      }
    }
  }

  return Array.from(detected);
}

function detectTechStackFromDependencies(content: string, type: 'npm' | 'python' | 'go' | 'rust' | 'ruby' | 'php'): string[] {
  const detected = new Set<string>();

  for (const [tech, { dependencies }] of Object.entries(TECH_PATTERNS)) {
    if (!dependencies) continue;
    for (const dep of dependencies) {
      if (content.includes(dep)) {
        detected.add(tech);
        break;
      }
    }
  }

  return Array.from(detected);
}

function extractDeploymentUrls(readme: string, homepage: string | null): string | null {
  // First check homepage
  if (homepage && homepage.startsWith('http')) {
    return homepage;
  }

  // Check README for deployment URLs
  for (const pattern of DEPLOYMENT_PATTERNS) {
    const match = readme.match(pattern);
    if (match) {
      // Filter out GitHub URLs and common non-deployment URLs
      const url = match[0];
      if (!url.includes('github.com') && !url.includes('github.io') && !url.includes('npmjs.com') && !url.includes('pypi.org')) {
        return url;
      }
    }
  }

  return null;
}

function extractDescriptionFromReadme(readme: string): string | null {
  // Remove badges and images at the start
  const lines = readme.split('\n');
  let startIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('![') && !line.startsWith('[![') && !line.startsWith('#')) {
      startIndex = i;
      break;
    }
    if (line.startsWith('#')) {
      startIndex = i + 1;
      break;
    }
  }

  // Get first paragraph after title
  const content = lines.slice(startIndex).join('\n').trim();
  const firstParagraph = content.split(/\n\n+/)[0];

  if (firstParagraph && firstParagraph.length > 20 && firstParagraph.length < 500) {
    return firstParagraph.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
  }

  return null;
}

export async function analyzeGitHubRepo(owner: string, repo: string, token?: string): Promise<AnalysisResult> {
  // Fetch repo info
  const repoInfo = await getRepoInfo(owner, repo, token);

  // Get root contents for file detection
  const rootContents = await getRepoContents(owner, repo, '', token);
  const fileNames = rootContents.map((f) => f.name);

  // Detect tech stack from files
  let techStack = detectTechStackFromFiles(fileNames);

  // Try to get package.json for npm dependencies
  if (fileNames.some((f) => f === 'package.json')) {
    const packageJson = await getFileContent(owner, repo, 'package.json', token);
    if (packageJson) {
      const npmTech = detectTechStackFromDependencies(packageJson, 'npm');
      techStack = [...new Set([...techStack, ...npmTech])];
    }
  }

  // Try to get requirements.txt for Python dependencies
  if (fileNames.some((f) => f === 'requirements.txt')) {
    const requirements = await getFileContent(owner, repo, 'requirements.txt', token);
    if (requirements) {
      const pythonTech = detectTechStackFromDependencies(requirements, 'python');
      techStack = [...new Set([...techStack, ...pythonTech])];
    }
  }

  // Try to get go.mod for Go dependencies
  if (fileNames.some((f) => f === 'go.mod')) {
    const goMod = await getFileContent(owner, repo, 'go.mod', token);
    if (goMod) {
      const goTech = detectTechStackFromDependencies(goMod, 'go');
      techStack = [...new Set([...techStack, ...goTech])];
    }
  }

  // Try to get Cargo.toml for Rust dependencies
  if (fileNames.some((f) => f === 'Cargo.toml')) {
    const cargoToml = await getFileContent(owner, repo, 'Cargo.toml', token);
    if (cargoToml) {
      const rustTech = detectTechStackFromDependencies(cargoToml, 'rust');
      techStack = [...new Set([...techStack, ...rustTech])];
    }
  }

  // Get README content
  let readmeContent: string | null = null;
  const readmeFiles = ['README.md', 'readme.md', 'Readme.md', 'README.MD', 'README'];
  for (const readmeFile of readmeFiles) {
    if (fileNames.some((f) => f.toLowerCase() === readmeFile.toLowerCase())) {
      readmeContent = await getFileContent(owner, repo, readmeFile, token);
      if (readmeContent) break;
    }
  }

  // Extract deployment URL
  const deploymentUrl = extractDeploymentUrls(readmeContent || '', repoInfo.homepage);

  // Get description - prefer repo description, fallback to README
  let description = repoInfo.description || '';
  if (!description && readmeContent) {
    const readmeDesc = extractDescriptionFromReadme(readmeContent);
    if (readmeDesc) description = readmeDesc;
  }

  // Add primary language to tech stack if not already present
  if (repoInfo.language && !techStack.includes(repoInfo.language)) {
    techStack.unshift(repoInfo.language);
  }

  // Remove generic 'Node' if we have more specific JS frameworks
  const hasJsFramework = techStack.some((t) => ['React', 'Next.js', 'Vue', 'Nuxt', 'Angular', 'Svelte', 'SvelteKit'].includes(t));
  if (hasJsFramework) {
    techStack = techStack.filter((t) => t !== 'Node');
  }

  return {
    name: repoInfo.name,
    description,
    techStack,
    stats: {
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      watchers: repoInfo.watchers_count,
      language: repoInfo.language,
      createdAt: repoInfo.created_at,
      updatedAt: repoInfo.updated_at,
      pushedAt: repoInfo.pushed_at,
      topics: repoInfo.topics,
    },
    deploymentUrl,
    readmeContent,
  };
}
