import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function getSession() {
  return getServerSession();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session };
}
