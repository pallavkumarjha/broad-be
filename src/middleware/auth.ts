import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseService } from '../config/supabase.js';
import { ApiResponse } from '../types/api.js';

// Extend FastifyRequest to include user context
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      };
      return reply.status(401).send(response);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const supabase = supabaseService;

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      };
      return reply.status(401).send(response);
    }

    // Get user profile to include role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found',
        },
      };
      return reply.status(404).send(response);
    }

    // Attach user context to request
    request.user = {
      id: user.id,
      email: user.email!,
      role: profile?.role || 'rider',
    };

  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
    return reply.status(500).send(response);
  }
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // No token provided, continue without user context
    }

    const token = authHeader.substring(7);
    const supabase = supabaseService;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return; // Invalid token, continue without user context
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      request.user = {
        id: user.id,
        email: user.email!,
        role: (profile as any).role || 'rider',
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    return;
  }
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return reply.status(401).send(response);
    }

    if (!allowedRoles.includes(request.user.role)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      };
      return reply.status(403).send(response);
    }
  };
}

// Admin-only middleware
export const requireAdmin = requireRole(['admin']);

// Moderator or admin middleware
export const requireModerator = requireRole(['moderator', 'admin']);