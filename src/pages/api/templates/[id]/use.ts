/**
 * Use Template API Endpoint
 * POST /api/templates/[id]/use - Create a new project from this template
 */
import type { APIRoute } from 'astro';
import { db, projectTemplates, projects, templateUsageLog } from '../../../../lib/db';
import { eq, and, sql } from 'drizzle-orm';
import {
  apiHandler,
  requireAuth,
  validateParams,
  validateBody,
} from '../../../../lib/api/error-handler';
import { z } from 'zod';
import { excludeDeleted } from '../../../../lib/db/soft-delete';

export const prerender = false;

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const useTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  projectNumber: z.string().min(1).max(100),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  totalBudget: z.number().optional(),
  startDate: z.string().optional(),
  estimatedCompletion: z.string().optional(),
  ownerId: z.number().optional(),
  generalContractorId: z.number().optional(),
});

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

  // Only GC and ADMIN can create projects
  if (user.role !== 'GC' && user.role !== 'ADMIN') {
    return new Response(
      JSON.stringify({ error: 'Only General Contractors and Admins can create projects' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate params and body
  const params = validateParams(context.params, idParamSchema);
  const data = await validateBody(context, useTemplateSchema);

  console.log(`POST /api/templates/${params.id}/use - Creating project from template:`, data.name);

  // Fetch template
  const [template] = await db
    .select()
    .from(projectTemplates)
    .where(and(
      eq(projectTemplates.id, params.id),
      excludeDeleted()
    ))
    .limit(1);

  if (!template) {
    return new Response(
      JSON.stringify({ error: 'Template not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check access
  if (!template.isPublic && template.createdBy !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Access denied to this template' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if project number already exists
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.projectNumber, data.projectNumber),
      excludeDeleted()
    ))
    .limit(1);

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Project number already exists' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Merge template settings with user data
  const templateSettings = typeof template.defaultSettings === 'object' ? template.defaultSettings : {};

  // Create new project with template data
  const [newProject] = await db.insert(projects).values({
    name: data.name,
    description: data.description || template.description || null,
    status: (template.defaultStatus as any) || 'planning',
    projectNumber: data.projectNumber,

    // Location
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zipCode: data.zipCode || null,

    // Budget
    totalBudget: data.totalBudget || 0,
    spentBudget: 0,
    allocatedBudget: 0,
    committedBudget: 0,
    remainingBudget: data.totalBudget || 0,

    // Dates
    startDate: data.startDate ? new Date(data.startDate) : null,
    estimatedCompletion: data.estimatedCompletion ? new Date(data.estimatedCompletion) : null,
    actualCompletion: null,

    // Team
    ownerId: data.ownerId || null,
    generalContractorId: data.generalContractorId || user.id,
    teamMembers: [],

    // Progress
    progressPercentage: 0,
    completedMilestones: 0,
    totalMilestones: Array.isArray(template.milestones) ? template.milestones.length : 0,

    // Metadata - include template data
    tags: Array.isArray(template.tags) ? template.tags : [],
    settings: {
      ...templateSettings,
      templateId: template.id,
      templateName: template.name,
      milestones: template.milestones,
      taskTemplates: template.taskTemplates,
      teamRoles: template.teamRoles,
      budgetCategories: template.defaultBudgetCategories,
    },
    createdBy: user.id,
  }).returning();

  // Log template usage
  await db.insert(templateUsageLog).values({
    templateId: template.id,
    projectId: newProject.id,
    usedBy: user.id,
  });

  // Increment use count
  await db
    .update(projectTemplates)
    .set({
      useCount: sql`${projectTemplates.useCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(projectTemplates.id, template.id));

  console.log('Project created from template successfully:', newProject.id);

  return {
    message: 'Project created from template successfully',
    projectId: newProject.id,
    project: newProject,
  };
});
