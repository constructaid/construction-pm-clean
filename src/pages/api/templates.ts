/**
 * Project Templates API Endpoint
 * Handles CRUD operations for project templates
 * GET /api/templates - List all templates (public + user's private)
 * POST /api/templates - Create new template
 */
import type { APIRoute } from 'astro';
import { db, projectTemplates } from '../../lib/db';
import { eq, or, and, isNull, sql } from 'drizzle-orm';
import {
  apiHandler,
  requireAuth,
  validateBody,
  validateQuery,
} from '../../lib/api/error-handler';
import { z } from 'zod';

export const prerender = false;

// Query schema for GET
const templatesQuerySchema = z.object({
  category: z.enum(['commercial', 'residential', 'industrial', 'infrastructure', 'renovation', 'custom', 'all']).default('all'),
  showPublic: z.coerce.boolean().default(true),
  showPrivate: z.coerce.boolean().default(true),
});

// Body schema for POST
const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['commercial', 'residential', 'industrial', 'infrastructure', 'renovation', 'custom']).default('custom'),
  isPublic: z.boolean().default(false),
  defaultStatus: z.string().optional(),
  defaultSettings: z.record(z.any()).optional(),
  milestones: z.array(z.object({
    name: z.string(),
    order: z.number(),
    estimatedDuration: z.number().optional(),
  })).optional(),
  taskTemplates: z.array(z.object({
    title: z.string(),
    type: z.string().optional(),
    priority: z.string().optional(),
    milestoneIndex: z.number().optional(),
  })).optional(),
  teamRoles: z.array(z.object({
    role: z.string(),
    required: z.boolean().optional(),
    count: z.number().optional(),
  })).optional(),
  defaultBudgetCategories: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().optional(),
});

// ========================================
// GET - Fetch templates
// ========================================

export const GET: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  const user = context.locals.user;
  const query = validateQuery(context, templatesQuerySchema);

  console.log('GET /api/templates - category:', query.category, 'user:', user?.id);

  // Build WHERE conditions
  const conditions: any[] = [isNull(projectTemplates.deletedAt)];

  // Visibility filter
  const visibilityConditions: any[] = [];
  if (query.showPublic) {
    visibilityConditions.push(eq(projectTemplates.isPublic, true));
  }
  if (query.showPrivate && user) {
    visibilityConditions.push(eq(projectTemplates.createdBy, user.id));
  }

  if (visibilityConditions.length > 0) {
    conditions.push(or(...visibilityConditions));
  }

  // Category filter
  if (query.category && query.category !== 'all') {
    conditions.push(eq(projectTemplates.category, query.category as any));
  }

  // Fetch templates
  const templates = await db
    .select()
    .from(projectTemplates)
    .where(and(...conditions))
    .orderBy(sql`${projectTemplates.isPublic} DESC, ${projectTemplates.useCount} DESC, ${projectTemplates.createdAt} DESC`);

  return {
    templates,
    count: templates.length,
  };
});

// ========================================
// POST - Create new template
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  const user = context.locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate request body
  const data = await validateBody(context, createTemplateSchema);

  console.log('POST /api/templates - Creating template:', data.name, 'by user:', user.id);

  // Only admins can create public templates
  const canCreatePublic = user.role === 'ADMIN' || user.role === 'GC';
  const isPublic = data.isPublic && canCreatePublic;

  // Create template
  const [newTemplate] = await db.insert(projectTemplates).values({
    name: data.name,
    description: data.description || null,
    category: data.category,
    isPublic,
    createdBy: user.id,
    defaultStatus: data.defaultStatus || 'planning',
    defaultSettings: data.defaultSettings || {},
    milestones: data.milestones || [],
    taskTemplates: data.taskTemplates || [],
    teamRoles: data.teamRoles || [],
    defaultBudgetCategories: data.defaultBudgetCategories || [],
    tags: data.tags || [],
    thumbnailUrl: data.thumbnailUrl || null,
  }).returning();

  console.log('Template created successfully:', newTemplate.id);

  return {
    message: 'Template created successfully',
    template: newTemplate,
  };
});
