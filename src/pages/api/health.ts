/**
 * Health Check API Endpoint
 * GET /api/health - Check application and database health
 *
 * Used for:
 * - Monitoring (UptimeRobot, Pingdom, etc.)
 * - Load balancer health checks
 * - Kubernetes liveness/readiness probes
 * - Deployment verification
 */
import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { sql } from 'drizzle-orm';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
  };
}

export const GET: APIRoute = async () => {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: {
        status: 'down',
      },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - dbStart;

    healthStatus.checks.database = {
      status: 'up',
      latency: dbLatency,
    };
  } catch (error) {
    healthStatus.status = 'unhealthy';
    healthStatus.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Determine overall status
  const allChecksUp = Object.values(healthStatus.checks).every(
    (check) => check.status === 'up'
  );

  if (!allChecksUp) {
    healthStatus.status = 'unhealthy';
  }

  // Return appropriate status code
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

  return new Response(JSON.stringify(healthStatus, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
};

// Also support HEAD requests for lightweight health checks
export const HEAD: APIRoute = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
};
