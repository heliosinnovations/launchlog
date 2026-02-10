import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

const MAX_SCREENSHOTS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('user_id, screenshots')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!project || project.user_id !== session.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const currentScreenshots: string[] = project.screenshots || [];

  // Parse multipart form data
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  if (currentScreenshots.length + files.length > MAX_SCREENSHOTS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_SCREENSHOTS} screenshots allowed. You have ${currentScreenshots.length} and tried to add ${files.length}.` },
      { status: 400 }
    );
  }

  const uploadedUrls: string[] = [];

  for (const file of files) {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from('screenshots')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
      });

    if (uploadError) {
      console.error('Screenshot upload failed:', uploadError);
      return NextResponse.json({ error: 'Failed to upload screenshot' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('screenshots')
      .getPublicUrl(filename);

    uploadedUrls.push(urlData.publicUrl);
  }

  // Update project with new screenshots
  const newScreenshots = [...currentScreenshots, ...uploadedUrls];
  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ screenshots: newScreenshots })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ screenshots: data.screenshots, uploaded: uploadedUrls }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const indexStr = searchParams.get('index');

  if (indexStr === null) {
    return NextResponse.json({ error: 'Screenshot index required' }, { status: 400 });
  }

  const index = parseInt(indexStr, 10);

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('user_id, screenshots, primary_screenshot_index')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!project || project.user_id !== session.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const screenshots: string[] = project.screenshots || [];

  if (index < 0 || index >= screenshots.length) {
    return NextResponse.json({ error: 'Invalid screenshot index' }, { status: 400 });
  }

  // Remove screenshot from storage
  const urlToRemove = screenshots[index];
  const pathMatch = urlToRemove.match(/screenshots\/(.+)$/);
  if (pathMatch) {
    await supabaseAdmin.storage.from('screenshots').remove([pathMatch[1]]);
  }

  // Remove from array
  const newScreenshots = screenshots.filter((_, i) => i !== index);

  // Adjust primary index if needed
  let newPrimaryIndex = project.primary_screenshot_index || 0;
  if (index < newPrimaryIndex) {
    newPrimaryIndex = Math.max(0, newPrimaryIndex - 1);
  } else if (index === newPrimaryIndex) {
    newPrimaryIndex = 0;
  }
  if (newPrimaryIndex >= newScreenshots.length) {
    newPrimaryIndex = Math.max(0, newScreenshots.length - 1);
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ screenshots: newScreenshots, primary_screenshot_index: newPrimaryIndex })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ screenshots: data.screenshots });
}
