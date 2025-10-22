/**
 * Mock Authentication Helper
 *
 * This bypasses real authentication for development purposes.
 * Remove this file and replace with actual auth when ready.
 */

export interface MockUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ARCHITECT' | 'GC' | 'SUB' | 'ADMIN';
  company?: string;
  avatar?: string;
}

/**
 * Mock users for different roles
 */
export const MOCK_USERS: Record<string, MockUser> = {
  gc: {
    _id: '1', // PostgreSQL integer ID
    email: 'gc@constructaid.com',
    firstName: 'John',
    lastName: 'Builder',
    role: 'GC',
    company: 'BuildRight Construction',
    avatar: undefined
  },
  owner: {
    _id: '2', // PostgreSQL integer ID
    email: 'owner@constructaid.com',
    firstName: 'Sarah',
    lastName: 'Owner',
    role: 'OWNER',
    company: 'Property Development Co',
    avatar: undefined
  },
  architect: {
    _id: '3', // PostgreSQL integer ID
    email: 'architect@constructaid.com',
    firstName: 'Michael',
    lastName: 'Design',
    role: 'ARCHITECT',
    company: 'Design Studio Inc',
    avatar: undefined
  },
  sub: {
    _id: '4', // PostgreSQL integer ID
    email: 'sub@constructaid.com',
    firstName: 'David',
    lastName: 'Subcontractor',
    role: 'SUB',
    company: 'Electrical Services LLC',
    avatar: undefined
  }
};

/**
 * Get mock user by role
 * Default to GC if no role specified
 */
export function getMockUser(role: 'gc' | 'owner' | 'architect' | 'sub' = 'gc'): MockUser {
  return MOCK_USERS[role];
}

/**
 * Check if we're in development mode with auth bypass
 */
export function isAuthBypassed(): boolean {
  // Can be controlled by environment variable
  return import.meta.env.DEV || import.meta.env.PUBLIC_BYPASS_AUTH === 'true';
}

/**
 * Get current mock session
 * In a real app, this would check cookies/JWT
 */
export function getMockSession(): MockUser | null {
  if (!isAuthBypassed()) {
    return null;
  }

  // Default to GC user for development
  return getMockUser('gc');
}
