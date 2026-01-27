/**
 * Frontend Authentication Service
 * Manages JWT tokens in localStorage and provides auth utilities
 *
 * Token Storage Strategy:
 * - accessToken: Stored in localStorage for API requests
 * - refreshToken: Stored in localStorage for token renewal
 * - user: Cached user info from token payload
 *
 * Security Notes:
 * - Tokens are also stored in HTTP-only cookies by the server
 * - localStorage is used for convenience in API requests
 * - In production, consider using sessionStorage for higher security
 */

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  company?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

const AUTH_KEYS = {
  ACCESS_TOKEN: 'constructaid_access_token',
  REFRESH_TOKEN: 'constructaid_refresh_token',
  USER: 'constructaid_user',
} as const;

/**
 * Authentication Service Class
 */
class AuthService {
  /**
   * Store authentication tokens and user info
   */
  setAuth(tokens: AuthTokens, user: User): void {
    try {
      localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, tokens.accessToken);
      localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('[AuthService] Failed to store auth data:', error);
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('[AuthService] Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('[AuthService] Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Get stored user info
   */
  getUser(): User | null {
    try {
      const userJson = localStorage.getItem(AUTH_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('[AuthService] Failed to get user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    try {
      localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(AUTH_KEYS.USER);
    } catch (error) {
      console.error('[AuthService] Failed to clear auth data:', error);
    }
  }

  /**
   * Get role-based redirect path
   */
  getRoleBasedRedirect(role: string): string {
    switch (role) {
      case 'OWNER':
        return '/projects'; // Owner sees all their projects
      case 'GC':
        return '/projects'; // GC sees projects they manage
      case 'ARCHITECT':
        return '/projects'; // Architect sees design projects
      case 'SUB':
        return '/projects'; // Subcontractor sees assigned projects
      case 'ADMIN':
        return '/admin'; // Admin dashboard
      default:
        return '/projects'; // Default fallback
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store tokens and user info
    this.setAuth(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
      data.user
    );

    return data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Optional: Call logout API endpoint to invalidate tokens server-side
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      }).catch(() => {
        // Ignore errors - clear local state anyway
      });
    } finally {
      this.clearAuth();
      // Redirect to login page
      window.location.href = '/';
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      console.error('[AuthService] No refresh token available');
      return null;
    }

    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Update access token
      localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, data.accessToken);

      return data.accessToken;
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      // Clear auth and redirect to login
      this.clearAuth();
      window.location.href = '/';
      return null;
    }
  }

  /**
   * Make an authenticated API request
   * Automatically includes Authorization header and handles token refresh
   */
  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    // Add Authorization header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, try refreshing token
    if (response.status === 401) {
      const newAccessToken = await this.refreshAccessToken();

      if (newAccessToken) {
        // Retry request with new token
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        return fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
  }
}

// Export singleton instance
export const authService = new AuthService();
