import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeGitHubRepo } from '@/lib/github-analyzer';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { github_repo_url } = body;

  // Parse GitHub URL
  const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = github_repo_url?.match(urlPattern);

  if (!match) {
    return NextResponse.json(
      { error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' },
      { status: 400 }
    );
  }

  const [, repo_owner, repo_name] = match;
  const cleanRepoName = repo_name.replace(/\.git$/, '');

  // Analyze the repository
  let analysisResult;
  let status: 'ready' | 'error' = 'ready';
  try {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CLIENT_SECRET;
    analysisResult = await analyzeGitHubRepo(repo_owner, cleanRepoName, token);
  } catch (err) {
    console.error('GitHub analysis failed:', err);
    status = 'error';
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: session.user.id,
      github_repo_url,
      repo_owner,
      repo_name: cleanRepoName,
      status,
      description: analysisResult?.description || null,
      tech_stack: analysisResult?.techStack || null,
      github_stars: analysisResult?.stats.stars || 0,
      github_forks: analysisResult?.stats.forks || 0,
      primary_language: analysisResult?.stats.language || null,
      deployment_url: analysisResult?.deploymentUrl || null,
      readme_content: analysisResult?.readmeContent || null,
      created_date: analysisResult?.stats.createdAt ? new Date(analysisResult.stats.createdAt) : null,
      last_commit_date: analysisResult?.stats.pushedAt ? new Date(analysisResult.stats.pushedAt) : null,
      analysis_completed_at: status === 'ready' ? new Date() : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
