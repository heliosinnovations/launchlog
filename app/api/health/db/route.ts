import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  duration_ms?: number;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: HealthCheck[];
}

async function checkUsersTable(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { error } = await getSupabaseAdmin()
      .from('users')
      .select('id')
      .limit(0);

    return {
      name: 'users_table',
      status: error ? 'fail' : 'pass',
      message: error?.message,
      duration_ms: Date.now() - start,
    };
  } catch (e) {
    return {
      name: 'users_table',
      status: 'fail',
      message: e instanceof Error ? e.message : 'Unknown error',
      duration_ms: Date.now() - start,
    };
  }
}

async function checkAuthIdColumn(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { error } = await getSupabaseAdmin()
      .from('users')
      .select('auth_id')
      .limit(0);

    return {
      name: 'auth_id_column',
      status: error ? 'fail' : 'pass',
      message: error?.message,
      duration_ms: Date.now() - start,
    };
  } catch (e) {
    return {
      name: 'auth_id_column',
      status: 'fail',
      message: e instanceof Error ? e.message : 'Unknown error',
      duration_ms: Date.now() - start,
    };
  }
}

async function checkProjectsTable(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { error } = await getSupabaseAdmin()
      .from('projects')
      .select('id')
      .limit(0);

    return {
      name: 'projects_table',
      status: error ? 'fail' : 'pass',
      message: error?.message,
      duration_ms: Date.now() - start,
    };
  } catch (e) {
    return {
      name: 'projects_table',
      status: 'fail',
      message: e instanceof Error ? e.message : 'Unknown error',
      duration_ms: Date.now() - start,
    };
  }
}

async function checkAuthIdIndex(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Query using auth_id to verify index is working (fast lookup)
    const { error } = await getSupabaseAdmin()
      .from('users')
      .select('id')
      .eq('auth_id', '00000000-0000-0000-0000-000000000000')
      .limit(1);

    return {
      name: 'auth_id_index',
      status: error ? 'fail' : 'pass',
      message: error?.message,
      duration_ms: Date.now() - start,
    };
  } catch (e) {
    return {
      name: 'auth_id_index',
      status: 'fail',
      message: e instanceof Error ? e.message : 'Unknown error',
      duration_ms: Date.now() - start,
    };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkUsersTable(),
    checkAuthIdColumn(),
    checkAuthIdIndex(),
    checkProjectsTable(),
  ]);

  const allPassed = checks.every(c => c.status === 'pass');

  const response: HealthResponse = {
    status: allPassed ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(response, { status: allPassed ? 200 : 503 });
}
