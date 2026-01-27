/**
 * Company Branding API
 * GET /api/branding/:companyId - Get company branding settings
 * PUT /api/branding/:companyId - Update company branding settings
 */
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import { companyBranding } from '../../../lib/db/schema';

const { Pool } = pg;

const pool = new Pool({
  connectionString: import.meta.env.DATABASE_URL,
});

const db = drizzle(pool);

export const prerender = false;

// GET - Fetch company branding
export const GET: APIRoute = async ({ params }) => {
  const { companyId } = params;

  if (!companyId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Company ID is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Query database for branding
    const result = await db
      .select()
      .from(companyBranding)
      .where(eq(companyBranding.companyId, parseInt(companyId)))
      .limit(1);

    if (result.length === 0) {
      // Return default branding if none exists
      return new Response(JSON.stringify({
        success: true,
        data: {
          companyId: parseInt(companyId),
          logoUrl: '/ConstructHub-logo.png',
          faviconUrl: '/favicon.ico',
          primaryColor: '#FF6600',
          secondaryColor: '#3D9991',
          accentColor: '#4BAAD8',
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching branding:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch branding settings'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT - Update company branding
export const PUT: APIRoute = async ({ params, request }) => {
  const { companyId } = params;

  if (!companyId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Company ID is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { primaryColor, secondaryColor, accentColor, logoUrl, logoLightUrl, logoDarkUrl, faviconUrl } = body;

    // Validate hex colors
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid primary color format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid secondary color format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (accentColor && !hexColorRegex.test(accentColor)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid accent color format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if branding exists
    const existing = await db
      .select()
      .from(companyBranding)
      .where(eq(companyBranding.companyId, parseInt(companyId)))
      .limit(1);

    let result;
    const brandingData = {
      ...(logoUrl && { logoUrl }),
      ...(logoLightUrl && { logoLightUrl }),
      ...(logoDarkUrl && { logoDarkUrl }),
      ...(faviconUrl && { faviconUrl }),
      ...(primaryColor && { primaryColor }),
      ...(secondaryColor && { secondaryColor }),
      ...(accentColor && { accentColor }),
      updatedAt: new Date(),
    };

    if (existing.length === 0) {
      // Insert new branding
      result = await db
        .insert(companyBranding)
        .values({
          companyId: parseInt(companyId),
          ...brandingData,
        })
        .returning();
    } else {
      // Update existing branding
      result = await db
        .update(companyBranding)
        .set(brandingData)
        .where(eq(companyBranding.companyId, parseInt(companyId)))
        .returning();
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Branding updated successfully',
      data: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating branding:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update branding settings'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
