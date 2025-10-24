/**
 * Project Folders API
 * GET: Retrieve folder structure for a project
 * POST: Create new folder or initialize standard structure
 */

import type { APIRoute } from 'astro';
import { STANDARD_PROJECT_FOLDERS } from '../../../../lib/db/project-folders-schema';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { projectId } = params;
    const url = new URL(request.url);
    const parentId = url.searchParams.get('parentId');

    // Mock data - replace with actual database queries
    const mockFolders = generateMockFolderStructure(parseInt(projectId!), parentId);

    return new Response(
      JSON.stringify({
        success: true,
        folders: mockFolders,
        projectId: parseInt(projectId!),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching project folders:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch project folders',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { action, folderName, parentFolderId } = body;

    if (action === 'initialize') {
      // Initialize standard folder structure
      const standardFolders = STANDARD_PROJECT_FOLDERS.map((folder, index) => ({
        id: index + 1,
        projectId: parseInt(projectId!),
        parentFolderId: null,
        folderNumber: folder.number,
        folderName: folder.name,
        folderPath: `/${folder.number} ${folder.name}`,
        sortOrder: index,
        level: 0,
        isSystemFolder: true,
        fileCount: 0,
        subfolderCount: folder.subfolders.length,
        createdAt: new Date().toISOString(),
      }));

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Standard folder structure initialized',
          folders: standardFolders,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create custom folder
    const newFolder = {
      id: Date.now(), // Mock ID
      projectId: parseInt(projectId!),
      parentFolderId: parentFolderId || null,
      folderNumber: null,
      folderName,
      folderPath: `/${folderName}`,
      sortOrder: 999,
      level: parentFolderId ? 1 : 0,
      isSystemFolder: false,
      fileCount: 0,
      subfolderCount: 0,
      createdAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        folder: newFolder,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating folder:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create folder',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Generate mock folder structure based on standard template
 */
function generateMockFolderStructure(projectId: number, parentId: string | null) {
  if (parentId) {
    // Return subfolders for a specific parent
    const parentIndex = parseInt(parentId);
    const parentFolder = STANDARD_PROJECT_FOLDERS[parentIndex - 1];

    if (!parentFolder) return [];

    return parentFolder.subfolders.map((subfolder, index) => ({
      id: parentIndex * 1000 + index + 1,
      projectId,
      parentFolderId: parentIndex,
      folderNumber: `${parentFolder.number}.${index + 1}`,
      folderName: subfolder,
      folderPath: `/${parentFolder.number} ${parentFolder.name}/${subfolder}`,
      sortOrder: index,
      level: 1,
      isSystemFolder: true,
      fileCount: Math.floor(Math.random() * 10),
      subfolderCount: 0,
      createdAt: new Date().toISOString(),
    }));
  }

  // Return top-level folders
  return STANDARD_PROJECT_FOLDERS.map((folder, index) => ({
    id: index + 1,
    projectId,
    parentFolderId: null,
    folderNumber: folder.number,
    folderName: folder.name,
    folderPath: `/${folder.number} ${folder.name}`,
    sortOrder: index,
    level: 0,
    isSystemFolder: true,
    fileCount: Math.floor(Math.random() * 5),
    subfolderCount: folder.subfolders.length,
    createdAt: new Date().toISOString(),
  }));
}
