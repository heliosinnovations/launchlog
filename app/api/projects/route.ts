import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', session.user.id)
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

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: session.user.id,
      github_repo_url,
      repo_owner,
      repo_name: repo_name.replace(/\.git$/, ''),
      status: 'analyzing',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
