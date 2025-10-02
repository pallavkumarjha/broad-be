import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabaseService } from '../config/supabase.js';
import { successResponse, CommonErrors } from '../utils/response.js';
import {
  PhoneLoginSchema,
  VerifyOTPSchema,
  PhoneSignupSchema,
  PhoneLoginInput,
  VerifyOTPInput,
  PhoneSignupInput
} from '../schemas/index.js';

export async function authRoutes(fastify: FastifyInstance) {
  
  // Send OTP to phone number for login
  fastify.post('/login/phone', {
    schema: {
      tags: ['Authentication'],
      summary: 'Send OTP to phone number for login',
      body: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: { 
            type: 'string', 
            pattern: '^\\+[1-9]\\d{1,14}$',
            description: 'Phone number in E.164 format (e.g., +1234567890)'
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: PhoneLoginInput }>, reply: FastifyReply) => {
    try {
      const { phone } = PhoneLoginSchema.parse(request.body);

      const { error } = await supabaseService.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: false // Only allow existing users to login
        }
      });

      if (error) {
        if (error.message.includes('User not found')) {
          return reply.code(404).send(CommonErrors.NOT_FOUND('User with this phone number'));
        }
        fastify.log.error({ error }, 'Phone login error');
        return reply.code(400).send(CommonErrors.BAD_REQUEST(error.message));
      }

      return reply.send(successResponse({ message: 'OTP sent successfully' }));
    } catch (error) {
      fastify.log.error({ error }, 'Phone login exception');
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Verify OTP and get JWT token
  fastify.post('/verify-otp', {
    schema: {
      tags: ['Authentication'],
      summary: 'Verify OTP and get JWT token',
      body: {
        type: 'object',
        required: ['phone', 'token'],
        properties: {
          phone: { 
            type: 'string', 
            pattern: '^\\+[1-9]\\d{1,14}$',
            description: 'Phone number in E.164 format'
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
  }, async (request: FastifyRequest<{ Body: VerifyOTPInput }>, reply: FastifyReply) => {
    try {
      const { phone, token } = VerifyOTPSchema.parse(request.body);

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

      // Get user profile
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        fastify.log.error({ error: profileError }, 'Profile fetch error');
        return reply.code(404).send(CommonErrors.NOT_FOUND('User profile'));
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
        }
      }));
    } catch (error) {
      fastify.log.error({ error }, 'OTP verification exception');
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Sign up with phone number
  fastify.post('/signup/phone', {
    schema: {
      tags: ['Authentication'],
      summary: 'Sign up with phone number and send OTP',
      body: {
        type: 'object',
        required: ['phone', 'displayName'],
        properties: {
          phone: { 
            type: 'string', 
            pattern: '^\\+[1-9]\\d{1,14}$',
            description: 'Phone number in E.164 format'
          },
          displayName: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100 
          },
          handle: { 
            type: 'string', 
            minLength: 3, 
            maxLength: 30, 
            pattern: '^[a-zA-Z0-9_]+$' 
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: PhoneSignupInput }>, reply: FastifyReply) => {
    try {
      const { phone, displayName, handle } = PhoneSignupSchema.parse(request.body);

      // Check if user already exists with phone
      const { data: existingUsers } = await supabaseService
        .from('profiles')
        .select('phone_number')
        .eq('phone_number', phone);
      
      if (existingUsers && existingUsers.length > 0) {
        return reply.code(409).send(CommonErrors.CONFLICT('User with this phone number already exists'));
      }

      // Check if handle is taken (if provided)
      if (handle) {
        const { data: existingProfile } = await supabaseService
          .from('profiles')
          .select('id')
          .eq('handle', handle)
          .single();
        
        if (existingProfile) {
          return reply.code(409).send(CommonErrors.CONFLICT('Handle is already taken'));
        }
      }

      // Send OTP for signup
      const { error } = await supabaseService.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true,
          data: {
            display_name: displayName,
            handle: handle || null
          }
        }
      });

      if (error) {
        fastify.log.error({ error }, 'Phone signup error');
        return reply.code(400).send(CommonErrors.BAD_REQUEST(error.message));
      }

      return reply.send(successResponse({ message: 'OTP sent successfully' }));
    } catch (error) {
      fastify.log.error({ error }, 'Phone signup exception');
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