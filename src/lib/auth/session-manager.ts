/**
 * Session Management Service - Database-Backed
 *
 * Tracks active user sessions with persistent storage in PostgreSQL
 *
 * FEATURES:
 * - Persistent session storage (survives server restarts)
 * - Session tracking with unique session IDs
 * - Automatic session timeout after inactivity
 * - Session refresh on activity
 * - Session revocation (logout)
 * - Multi-device session support
 * - Session limits per user
 *
 * SECURITY:
 * - Cryptographically secure session IDs
 * - Automatic cleanup of expired sessions
 * - Session fingerprinting (IP, User-Agent)
 * - Max sessions per user limit
 *
 * MULTI-TENANCY:
 * - Sessions include companyId for tenant context
 */

import crypto from 'crypto';
import { db } from '../db';
import { sessions } from '../db/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { logger } from '../logger';

export interface Session {
  id: string;
  userId: number;
  email: string;
  role: string;
  companyId: number | null;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  refreshToken?: string;
}

export interface SessionConfig {
  // Session timeout after inactivity (default: 30 minutes)
  inactivityTimeout: number;

  // Maximum session lifetime regardless of activity (default: 24 hours)
  maxSessionLifetime: number;

  // Maximum sessions per user (default: 5)
  maxSessionsPerUser: number;

  // Cleanup interval for expired sessions (default: 5 minutes)
  cleanupInterval: number;
}

// Default configuration
const DEFAULT_CONFIG: SessionConfig = {
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  maxSessionLifetime: 24 * 60 * 60 * 1000, // 24 hours
  maxSessionsPerUser: 5, // Allow up to 5 devices
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
};

class SessionManager {
  private config: SessionConfig;
  private cleanupTimer?: NodeJS.Timeout;
  // In-memory cache for frequent lookups (optional, reduces DB load)
  private sessionCache: Map<string, { session: Session; cachedAt: number }>;
  private readonly cacheMaxAge = 60000; // 1 minute cache

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionCache = new Map();
    this.startCleanupTimer();
  }

  /**
   * Create a new session (stored in database)
   */
  async createSession(
    userId: number,
    email: string,
    role: string,
    ipAddress: string,
    userAgent: string,
    refreshToken?: string,
    companyId?: number | null
  ): Promise<Session> {
    // Generate cryptographically secure session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.maxSessionLifetime);

    // Store session in database
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      refreshToken: refreshToken || '',
      expiresAt,
      lastActivity: now,
      ipAddress,
      userAgent,
      isRevoked: false,
    });

    const session: Session = {
      id: sessionId,
      userId,
      email,
      role,
      companyId: companyId ?? null,
      createdAt: now,
      lastActivityAt: now,
      expiresAt,
      ipAddress,
      userAgent,
      refreshToken,
    };

    // Cache the session
    this.sessionCache.set(sessionId, { session, cachedAt: Date.now() });

    // Enforce max sessions per user
    await this.enforceSessionLimit(userId);

    logger.info('Session created', {
      module: 'session-manager',
      sessionId: sessionId.substring(0, 8) + '...',
      userId,
      email,
    });

    return session;
  }

  /**
   * Get session by ID (from database with cache)
   */
  async getSession(sessionId: string): Promise<Session | null> {
    // Check cache first
    const cached = this.sessionCache.get(sessionId);
    if (cached && Date.now() - cached.cachedAt < this.cacheMaxAge) {
      const session = cached.session;
      if (!this.isSessionExpired(session)) {
        return session;
      }
      // Session expired, remove from cache
      this.sessionCache.delete(sessionId);
    }

    // Fetch from database
    const [dbSession] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.isRevoked, false)
      ))
      .limit(1);

    if (!dbSession) {
      return null;
    }

    // Convert DB record to Session interface
    // Note: We don't have email/role in the sessions table, so we'd need to fetch user
    // For now, return partial session - the caller should have user context
    const session: Session = {
      id: dbSession.id,
      userId: dbSession.userId,
      email: '', // Will be filled by caller
      role: '', // Will be filled by caller
      companyId: null, // Will be filled by caller
      createdAt: dbSession.createdAt,
      lastActivityAt: dbSession.lastActivity,
      expiresAt: dbSession.expiresAt,
      ipAddress: dbSession.ipAddress || '',
      userAgent: dbSession.userAgent || '',
      refreshToken: dbSession.refreshToken,
    };

    // Check if session expired
    if (this.isSessionExpired(session)) {
      await this.revokeSession(sessionId, 'expired');
      return null;
    }

    // Update cache
    this.sessionCache.set(sessionId, { session, cachedAt: Date.now() });

    return session;
  }

  /**
   * Update session activity (extends inactivity timeout)
   */
  async updateActivity(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    // Don't update if session is about to expire (within 1 minute of max lifetime)
    const maxLifetimeRemaining = session.expiresAt.getTime() - Date.now();
    if (maxLifetimeRemaining < 60000) {
      logger.debug('Session near max lifetime, not updating activity', {
        module: 'session-manager',
        sessionId: sessionId.substring(0, 8) + '...',
      });
      return false;
    }

    const now = new Date();

    // Update in database
    await db
      .update(sessions)
      .set({ lastActivity: now })
      .where(eq(sessions.id, sessionId));

    // Update cache
    const cached = this.sessionCache.get(sessionId);
    if (cached) {
      cached.session.lastActivityAt = now;
      cached.cachedAt = Date.now();
    }

    return true;
  }

  /**
   * Revoke session (logout)
   */
  async revokeSession(sessionId: string, reason: string = 'logout'): Promise<boolean> {
    // Update in database
    const result = await db
      .update(sessions)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(eq(sessions.id, sessionId));

    // Remove from cache
    this.sessionCache.delete(sessionId);

    logger.info('Session revoked', {
      module: 'session-manager',
      sessionId: sessionId.substring(0, 8) + '...',
      reason,
    });

    return true;
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: number, reason: string = 'logout_all'): Promise<number> {
    // Get all active sessions for user
    const userSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(
        eq(sessions.userId, userId),
        eq(sessions.isRevoked, false)
      ));

    const count = userSessions.length;

    // Revoke all sessions
    await db
      .update(sessions)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(and(
        eq(sessions.userId, userId),
        eq(sessions.isRevoked, false)
      ));

    // Clear from cache
    for (const session of userSessions) {
      this.sessionCache.delete(session.id);
    }

    logger.info('All user sessions revoked', {
      module: 'session-manager',
      userId,
      count,
      reason,
    });

    return count;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: number): Promise<Session[]> {
    const dbSessions = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.userId, userId),
        eq(sessions.isRevoked, false)
      ))
      .orderBy(desc(sessions.createdAt));

    return dbSessions
      .map(dbSession => ({
        id: dbSession.id,
        userId: dbSession.userId,
        email: '',
        role: '',
        companyId: null,
        createdAt: dbSession.createdAt,
        lastActivityAt: dbSession.lastActivity,
        expiresAt: dbSession.expiresAt,
        ipAddress: dbSession.ipAddress || '',
        userAgent: dbSession.userAgent || '',
        refreshToken: dbSession.refreshToken,
      }))
      .filter(session => !this.isSessionExpired(session));
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: Session): boolean {
    const now = Date.now();

    // Check max lifetime
    if (session.expiresAt.getTime() < now) {
      return true;
    }

    // Check inactivity timeout
    const inactiveFor = now - session.lastActivityAt.getTime();
    if (inactiveFor > this.config.inactivityTimeout) {
      return true;
    }

    return false;
  }

  /**
   * Enforce maximum sessions per user limit
   * Removes oldest sessions if limit exceeded
   */
  private async enforceSessionLimit(userId: number): Promise<void> {
    const userSessions = await this.getUserSessions(userId);

    if (userSessions.length <= this.config.maxSessionsPerUser) {
      return;
    }

    // Sort by creation time (oldest first) - already sorted by the query
    const sessionsToRemove = userSessions.length - this.config.maxSessionsPerUser;

    // Revoke oldest sessions
    for (let i = userSessions.length - 1; i >= userSessions.length - sessionsToRemove; i--) {
      await this.revokeSession(userSessions[i].id, 'max_sessions_exceeded');
    }

    logger.info('Enforced session limit', {
      module: 'session-manager',
      userId,
      removed: sessionsToRemove,
    });
  }

  /**
   * Cleanup expired sessions (from database)
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      const inactivityCutoff = new Date(now.getTime() - this.config.inactivityTimeout);

      // Mark expired sessions as revoked
      await db
        .update(sessions)
        .set({
          isRevoked: true,
          revokedAt: now,
          revokedReason: 'expired',
        })
        .where(and(
          eq(sessions.isRevoked, false),
          lt(sessions.expiresAt, now)
        ));

      // Also expire sessions that have been inactive too long
      await db
        .update(sessions)
        .set({
          isRevoked: true,
          revokedAt: now,
          revokedReason: 'inactivity',
        })
        .where(and(
          eq(sessions.isRevoked, false),
          lt(sessions.lastActivity, inactivityCutoff)
        ));

      // Clear old entries from cache
      for (const [sessionId, cached] of this.sessionCache.entries()) {
        if (this.isSessionExpired(cached.session)) {
          this.sessionCache.delete(sessionId);
        }
      }

      logger.debug('Session cleanup completed', {
        module: 'session-manager',
      });
    } catch (error) {
      logger.error('Session cleanup failed', { module: 'session-manager' }, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.config.cleanupInterval);

    logger.debug('Started session cleanup timer', {
      module: 'session-manager',
      interval: this.config.cleanupInterval,
    });
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      logger.debug('Stopped session cleanup timer', { module: 'session-manager' });
    }
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    revokedSessions: number;
  }> {
    const allSessions = await db.select().from(sessions);

    let activeSessions = 0;
    let expiredSessions = 0;
    let revokedSessions = 0;

    for (const dbSession of allSessions) {
      if (dbSession.isRevoked) {
        revokedSessions++;
      } else {
        const session: Session = {
          id: dbSession.id,
          userId: dbSession.userId,
          email: '',
          role: '',
          companyId: null,
          createdAt: dbSession.createdAt,
          lastActivityAt: dbSession.lastActivity,
          expiresAt: dbSession.expiresAt,
          ipAddress: dbSession.ipAddress || '',
          userAgent: dbSession.userAgent || '',
        };

        if (this.isSessionExpired(session)) {
          expiredSessions++;
        } else {
          activeSessions++;
        }
      }
    }

    return {
      totalSessions: allSessions.length,
      activeSessions,
      expiredSessions,
      revokedSessions,
    };
  }

  /**
   * Get time until session expires
   */
  async getSessionExpiryInfo(sessionId: string): Promise<{
    inactivityExpiresIn: number; // milliseconds
    maxLifetimeExpiresIn: number; // milliseconds
    expiresIn: number; // milliseconds (whichever comes first)
  } | null> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const now = Date.now();
    const inactivityExpiresIn =
      this.config.inactivityTimeout - (now - session.lastActivityAt.getTime());
    const maxLifetimeExpiresIn = session.expiresAt.getTime() - now;

    return {
      inactivityExpiresIn,
      maxLifetimeExpiresIn,
      expiresIn: Math.min(inactivityExpiresIn, maxLifetimeExpiresIn),
    };
  }
}

// Singleton instance
let sessionManager: SessionManager | null = null;

/**
 * Get or create the global session manager instance
 */
export function getSessionManager(config?: Partial<SessionConfig>): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager(config);
  }
  return sessionManager;
}

/**
 * Reset the session manager (for testing)
 */
export function resetSessionManager(): void {
  if (sessionManager) {
    sessionManager.stopCleanupTimer();
    sessionManager = null;
  }
}
