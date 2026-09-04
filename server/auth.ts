/**
 * Authentication & Session Management for EasyShip AI
 * Uses simple session-based approach with JWT tokens for API security
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// In production, move to environment variable
const JWT_SECRET = process.env.JWT_SECRET || "easyship-ai-secret-key-change-in-production";
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extended Express Request with user info
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
      isAuthenticated?: boolean;
    }
  }
}

/**
 * JWT Token Payload
 */
interface TokenPayload {
  userId: string;
  sessionId: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

/**
 * Session Store (in-memory for development, use Redis in production)
 */
class SessionStore {
  private sessions: Map<
    string,
    {
      userId: string;
      createdAt: number;
      lastActivity: number;
      userAgent?: string;
      ipAddress?: string;
    }
  > = new Map();

  private users: Map<
    string,
    {
      id: string;
      email?: string;
      createdAt: number;
      bookingCount: number;
    }
  > = new Map();

  /**
   * Create a new session
   */
  createSession(userId: string, userAgent?: string, ipAddress?: string): string {
    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, {
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userAgent,
      ipAddress,
    });

    return sessionId;
  }

  /**
   * Get session info
   */
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Invalidate session
   */
  invalidateSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  /**
   * Create or get user
   */
  getOrCreateUser(userId: string, email?: string) {
    let user = this.users.get(userId);

    if (!user) {
      user = {
        id: userId,
        email,
        createdAt: Date.now(),
        bookingCount: 0,
      };
      this.users.set(userId, user);
    }

    return user;
  }

  /**
   * Get user info
   */
  getUser(userId: string) {
    return this.users.get(userId);
  }

  /**
   * Increment user booking count
   */
  incrementBookingCount(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      user.bookingCount++;
    }
  }

  /**
   * Clean up expired sessions (run periodically)
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expired: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > SESSION_TIMEOUT) {
        expired.push(sessionId);
      }
    }

    expired.forEach((id) => this.sessions.delete(id));
    return expired.length;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global session store
export const sessionStore = new SessionStore();

// Clean up expired sessions every hour
setInterval(() => {
  const cleaned = sessionStore.cleanupExpiredSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired sessions`);
  }
}, 60 * 60 * 1000);

/**
 * Generate JWT token
 */
export function generateToken(
  userId: string,
  sessionId: string,
  type: "access" | "refresh" = "access"
): string {
  const expiresIn = type === "access" ? "1h" : "7d";

  return jwt.sign(
    {
      userId,
      sessionId,
      type,
    } as TokenPayload,
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Create a session for a user (for demo/testing)
 * In production, use proper OAuth2 or SSO
 */
export function createUserSession(email?: string): {
  userId: string;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
} {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create user in store
  sessionStore.getOrCreateUser(userId, email);

  // Create session
  const sessionId = sessionStore.createSession(userId);

  // Generate tokens
  const accessToken = generateToken(userId, sessionId, "access");
  const refreshToken = generateToken(userId, sessionId, "refresh");

  return {
    userId,
    sessionId,
    accessToken,
    refreshToken,
  };
}

/**
 * Middleware: Check if user has valid authentication token
 * Supports both session cookies and Authorization header tokens
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // For demo purposes, allow unauthenticated access but track users by session
  // In production, make this required for sensitive endpoints

  // Get token from header or create anonymous session
  const authHeader = req.headers.authorization;
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (token) {
    const payload = verifyToken(token);

    if (payload) {
      // Verify session exists
      const session = sessionStore.getSession(payload.sessionId);

      if (session) {
        // Update activity
        sessionStore.updateActivity(payload.sessionId);

        // Set user info on request
        req.userId = payload.userId;
        req.sessionId = payload.sessionId;
        req.isAuthenticated = true;

        return next();
      } else {
        // Session invalid or expired
        return res.status(401).json({
          error: "Session expired",
          code: "SESSION_EXPIRED",
        });
      }
    }
  }

  // For unauthenticated requests, create anonymous session
  // This allows tracking of guest users
  const guestSessionId = sessionStore.createSession("guest");
  req.sessionId = guestSessionId;
  req.isAuthenticated = false;

  next();
}

/**
 * Middleware: Require authentication
 * Use this for endpoints that require valid user session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.userId) {
    return next();
  }

  return res.status(401).json({
    error: "Authentication required",
    code: "AUTH_REQUIRED",
  });
}

/**
 * Middleware: Rate limiting per user/session
 * Track API call frequency to prevent abuse
 */
class RateLimitor {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowSize = 60000; // 1 minute
  private readonly maxRequests = 30; // 30 requests per minute

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const limit = this.limits.get(identifier);

    if (!limit || now > limit.resetTime) {
      // New window
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowSize,
      });
      return true;
    }

    // Within existing window
    if (limit.count < this.maxRequests) {
      limit.count++;
      return true;
    }

    return false;
  }

  getRemaining(identifier: string): number {
    const limit = this.limits.get(identifier);
    if (!limit) return this.maxRequests;
    return Math.max(0, this.maxRequests - limit.count);
  }

  getResetTime(identifier: string): number {
    const limit = this.limits.get(identifier);
    return limit?.resetTime || Date.now() + this.windowSize;
  }
}

export const rateLimitor = new RateLimitor();

/**
 * Middleware: Apply rate limiting
 */
export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const identifier = req.userId || req.sessionId || req.ip || "unknown";

  if (!rateLimitor.checkLimit(identifier)) {
    const resetTime = rateLimitor.getResetTime(identifier);
    return res.status(429).json({
      error: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    });
  }

  // Add rate limit info to response headers
  res.set({
    "X-RateLimit-Limit": "30",
    "X-RateLimit-Remaining": rateLimitor.getRemaining(identifier).toString(),
    "X-RateLimit-Reset": rateLimitor.getResetTime(identifier).toString(),
  });

  next();
}

/**
 * Middleware: Log API usage by session
 */
export function logApiUsage(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Capture original send function
  const originalSend = res.send;

  // Override send to log response
  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    // Log API call
    if (process.env.DEBUG_API) {
      console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}
