/**
 * Comments API - CRUD operations for comments on any entity
 * Supports threading (replies) and attachments
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { comments } from '../../lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { checkRBAC } from '../../lib/middleware/rbac';

// GET /api/comments?entityType=rfi&entityId=123&projectId=1
export const GET: APIRoute = async (context) => {
  try {
    const { request, url } = context;
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');
    const projectId = url.searchParams.get('projectId');

    if (!entityType || !entityId || !projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: entityType, entityId, projectId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult; // Return error response (401 or 403)
    }

    // Fetch all comments for this entity, ordered by creation date
    const allComments = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.entityType, entityType),
          eq(comments.entityId, parseInt(entityId)),
          eq(comments.projectId, parseInt(projectId)),
          eq(comments.isDeleted, false)
        )
      )
      .orderBy(desc(comments.createdAt));

    // Organize comments into a threaded structure
    const topLevelComments = allComments.filter(c => !c.parentCommentId);
    const commentMap = new Map(allComments.map(c => [c.id, { ...c, replies: [] }]));

    // Build the thread structure
    allComments.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      }
    });

    const threadedComments = topLevelComments.map(c => commentMap.get(c.id));

    return new Response(JSON.stringify({
      comments: threadedComments,
      total: allComments.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch comments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/comments - Create a new comment
export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const {
      projectId,
      entityType,
      entityId,
      content,
      parentCommentId,
      attachments
    } = body;

    // Validation
    if (!projectId || !entityType || !entityId || !content) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: projectId, entityType, entityId, content'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication and project write access
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const { user } = rbacResult;

    // Create the comment (use authenticated user's info)
    const [newComment] = await db
      .insert(comments)
      .values({
        projectId: parseInt(projectId),
        entityType,
        entityId: parseInt(entityId),
        content,
        authorId: user.id,
        authorName: user.name,
        parentCommentId: parentCommentId ? parseInt(parentCommentId) : null,
        attachments: attachments || [],
        isEdited: false,
        isDeleted: false,
      })
      .returning();

    return new Response(JSON.stringify({
      comment: newComment,
      message: 'Comment created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/comments - Update a comment
export const PUT: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const { id, content, projectId } = body;

    if (!id || !content || !projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: id, content, projectId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const { user } = rbacResult;

    // Verify the user is the author
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(id)))
      .limit(1);

    if (!existingComment.length) {
      return new Response(JSON.stringify({
        error: 'Comment not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (existingComment[0].authorId !== user.id) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: You can only edit your own comments'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the comment
    const [updatedComment] = await db
      .update(comments)
      .set({
        content,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, parseInt(id)))
      .returning();

    return new Response(JSON.stringify({
      comment: updatedComment,
      message: 'Comment updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/comments?id=123&projectId=1 - Soft delete a comment
export const DELETE: APIRoute = async (context) => {
  try {
    const { url } = context;
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');

    if (!id || !projectId) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters: id, projectId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // RBAC: Require authentication
    const rbacResult = await checkRBAC(context, parseInt(projectId), 'canWrite');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    const { user } = rbacResult;

    // Verify the user is the author
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(id)))
      .limit(1);

    if (!existingComment.length) {
      return new Response(JSON.stringify({
        error: 'Comment not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (existingComment[0].authorId !== user.id) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: You can only delete your own comments'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Soft delete the comment
    await db
      .update(comments)
      .set({
        isDeleted: true,
        content: '[Comment deleted]',
        updatedAt: new Date(),
      })
      .where(eq(comments.id, parseInt(id)));

    return new Response(JSON.stringify({
      message: 'Comment deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
