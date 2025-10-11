import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseService } from '../config/supabase.js';
import { successResponse, CommonErrors } from '../utils/response.js';
import {
  UnifiedPhoneAuthSchema,
  UnifiedVerifyOTPSchema,
  UnifiedPhoneAuthInput,
  UnifiedVerifyOTPInput
} from '../schemas/index.js';

export async function authRoutes(fastify: FastifyInstance) {
  
  // Unified phone auth - automatically handles login/signup
  fastify.post('/phone', {
    schema: {
      tags: ['Authentication'],
      summary: 'Send OTP to phone number (unified login/signup)',
      body: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: { 
            type: 'string', 
            description: 'Phone number'
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: UnifiedPhoneAuthInput }>, reply: FastifyReply) => {
    try {
      const { phone } = UnifiedPhoneAuthSchema.parse(request.body);

      // Check if user already exists
      const { data: existingUsers } = await supabaseService
        .from('profiles')
        .select('phone_number, display_name')
        .eq('phone_number', phone);
      
      const userExists = existingUsers && existingUsers.length > 0;

      // Send OTP
      const { error } = await supabaseService.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: !userExists, // Create user only if they don't exist
          data: !userExists ? {
            display_name: `User ${phone.slice(-4)}`, // Generate a simple display name
            handle: null
          } : undefined
        }
      });

      if (error) {
        fastify.log.error({ 
          error, 
          errorMessage: error.message, 
          errorCode: error.code,
          errorStatus: error.status,
          fullError: JSON.stringify(error, null, 2)
        }, 'Unified phone auth error');
        
        // Handle Supabase validation errors more gracefully
        if (error.code === 'validation_failed') {
          return reply.code(400).send(CommonErrors.BAD_REQUEST('Invalid phone number provided'));
        }
        
        return reply.code(400).send(CommonErrors.BAD_REQUEST(error.message));
      }

      return reply.send(successResponse({ 
        message: 'OTP sent successfully',
        isNewUser: !userExists
      }));
    } catch (error) {
      fastify.log.error({ error }, 'Unified phone auth exception');
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Unified OTP verification
  fastify.post('/verify', {
    schema: {
      tags: ['Authentication'],
      summary: 'Verify OTP (unified for login/signup)',
      body: {
        type: 'object',
        required: ['phone', 'token'],
        properties: {
          phone: { 
            type: 'string', 
            description: 'Phone number'
          },
          token: { 
            type: 'string', 
            minLength: 6,
            maxLength: 6,
            description: '6-digit OTP code'
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: UnifiedVerifyOTPInput }>, reply: FastifyReply) => {
    try {
      const { phone, token } = UnifiedVerifyOTPSchema.parse(request.body);

      const { data, error } = await supabaseService.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });

      if (error) {
        fastify.log.error({ error }, 'OTP verification error');
        return reply.code(400).send(CommonErrors.BAD_REQUEST('Invalid or expired OTP'));
      }

      if (!data.user || !data.session) {
        return reply.code(400).send(CommonErrors.BAD_REQUEST('Verification failed'));
      }

      // Check if this is a new user (profile doesn't exist yet)
      let { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      let isNewUser = false;

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') { // No rows returned
        // Create new profile with auto-generated display name
        const { data: newProfile, error: createError } = await supabaseService
          .from('profiles')
          .insert({
            id: data.user.id,
            phone_number: phone,
            display_name: `User ${phone.slice(-4)}`, // Generate a simple display name
            handle: null,
            role: 'rider'
          })
          .select()
          .single();

        if (createError) {
          fastify.log.error({ error: createError }, 'Profile creation error');
          return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
        }

        profile = newProfile;
        isNewUser = true;
      } else if (profileError) {
        fastify.log.error({ error: profileError }, 'Profile fetch error');
        return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
      }

      return reply.send(successResponse({
        user: {
          id: data.user.id,
          phone: data.user.phone,
          email: data.user.email
        },
        profile,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        },
        isNewUser
      }));
    } catch (error) {
      fastify.log.error({ error }, 'Unified OTP verification exception');
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: {
      tags: ['Authentication'],
      summary: 'Refresh JWT token',
      body: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { refresh_token: string } }>, reply: FastifyReply) => {
    try {
      const { refresh_token } = request.body;

      const { data, error } = await supabaseService.auth.refreshSession({
        refresh_token
      });

      if (error) {
        fastify.log.error({ error }, 'Token refresh error');
        return reply.code(401).send(CommonErrors.UNAUTHORIZED());
      }

      return reply.send(successResponse({
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        }
      }));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Logout endpoint
  fastify.post('/logout', {
    schema: {
      tags: ['Authentication'],
      summary: 'Logout user',
      security: [{ bearerAuth: [] }]
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await supabaseService.auth.admin.signOut(token);
      }

      return reply.send(successResponse({ message: 'Logged out successfully' }));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });
}