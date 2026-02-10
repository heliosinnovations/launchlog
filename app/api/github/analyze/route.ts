import { NextRequest, NextResponse } from 'next/server';
import { analyzeGitHubRepo, type AnalysisResult } from '@/lib/github-analyzer';

export interface AnalyzeResponse extends AnalysisResult {
  success: true;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /^([^\/]+)\/([^\/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.replace(/\.git$/, '').match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }

  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse | AnalyzeErrorResponse>> {
  try {
    const body = await request.json();
    const { githubUrl } = body;

    if (!githubUrl || typeof githubUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'GitHub URL is required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return NextResponse.json({ success: false, error: 'Invalid GitHub URL format' }, { status: 400 });
    }

    const { owner, repo } = parsed;

    // Use GitHub token from env if available (for higher rate limits)
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CLIENT_SECRET;

    const result = await analyzeGitHubRepo(owner, repo, token);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';

    // Check for rate limit errors
    if (message.includes('rate limit')) {
      return NextResponse.json({ success: false, error: message }, { status: 429 });
    }

    // Check for not found errors
    if (message.includes('404') || message.includes('Not Found')) {
      return NextResponse.json({ success: false, error: 'Repository not found. Make sure the URL is correct and the repository is public.' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

