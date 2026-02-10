import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { ProjectUpdatePayload } from '@/types/project';

type Params = { params: Promise<{ id: string }> };

const ALLOWED_UPDATE_FIELDS: (keyof ProjectUpdatePayload)[] = [
  'custom_name', 'custom_description', 'description', 'tech_stack',
  'deployment_url', 'github_repo_url', 'project_status', 'metrics',
  'metrics_public', 'screenshots', 'primary_screenshot_index', 'is_public', 'deleted_at'
];

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Allow public projects or own projects
  if (!data.is_public && data.user_id !== session?.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('user_id, screenshots')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!project || project.user_id !== session.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();

  // Filter to only allowed fields
  const sanitizedBody: Record<string, unknown> = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in body) {
      sanitizedBody[key] = body[key];
    }
  }

  // Validate screenshots limit (max 5)
  if (sanitizedBody.screenshots && Array.isArray(sanitizedBody.screenshots)) {
    if (sanitizedBody.screenshots.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 screenshots allowed' }, { status: 400 });
    }
  }

  // Validate primary_screenshot_index
  if (typeof sanitizedBody.primary_screenshot_index === 'number') {
    const screenshots = sanitizedBody.screenshots as string[] || project.screenshots || [];
    if (sanitizedBody.primary_screenshot_index >= screenshots.length) {
      sanitizedBody.primary_screenshot_index = 0;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(sanitizedBody)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: Params) {
  return PATCH(request, { params });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for hard delete flag
  const { searchParams } = new URL(request.url);
  const hardDelete = searchParams.get('hard') === 'true';

  // Verify ownership
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!project || project.user_id !== session.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (hardDelete) {
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Soft delete
    const { error } = await supabaseAdmin
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return new NextResponse(null, { status: 204 });
}
