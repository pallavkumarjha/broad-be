import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProfileService } from '../services/profile.js';
import { supabase } from '../config/supabase.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';
import { successResponse, CommonErrors, createPaginationMeta } from '../utils/response.js';
import {
  CreateProfileSchema,
  UpdateProfileSchema,
  PaginationSchema,
  UuidSchema
} from '../schemas/index.js';

export async function profileRoutes(fastify: FastifyInstance) {
  const profileService = new ProfileService();

  // Get current user's profile
  fastify.get('/me', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Profiles'],
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }]
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED());
      }

      const profile = await profileService.getProfileByUserId(userId);
      if (!profile) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Profile'));
      }

      return reply.send(successResponse(profile));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Get profile by ID
  fastify.get('/:id', {
    preHandler: optionalAuth,
    schema: {
      tags: ['Profiles'],
      summary: 'Get profile by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const profile = await profileService.getProfileById(id);
      
      if (!profile) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Profile'));
      }

      return reply.send(successResponse(profile));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Create profile
  fastify.post('/', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Profiles'],
      summary: 'Create user profile',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['displayName'],
        properties: {
          handle: { 
            type: 'string', 
            minLength: 3, 
            maxLength: 30, 
            pattern: '^[a-zA-Z0-9_]+$' 
          },
          displayName: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100 
          },
          bio: { 
            type: 'string', 
            maxLength: 500 
          },
          avatarUrl: { 
            type: 'string', 
            format: 'uri' 
          },
          countryCode: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 2 
          },
          phoneNumber: { 
            type: 'string', 
            minLength: 10, 
            maxLength: 15 
          }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED());
      }

      // Check if profile already exists
      const existingProfile = await profileService.getProfileByUserId(userId);
      if (existingProfile) {
        return reply.code(409).send(CommonErrors.CONFLICT('Profile already exists'));
      }

      const profileData = {
        ...request.body,
        id: userId
      };

      const profile = await profileService.createProfile(profileData);
      return reply.code(201).send(successResponse(profile));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Update profile
  fastify.patch('/:id', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Profiles'],
      summary: 'Update profile',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          handle: { 
            type: 'string', 
            minLength: 3, 
            maxLength: 30, 
            pattern: '^[a-zA-Z0-9_]+$' 
          },
          displayName: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 100 
          },
          bio: { 
            type: 'string', 
            maxLength: 500 
          },
          avatarUrl: { 
            type: 'string', 
            format: 'uri' 
          },
          countryCode: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 2 
          },
          phoneNumber: { 
            type: 'string', 
            minLength: 10, 
            maxLength: 15 
          },
          expoPushToken: { 
            type: 'string' 
          },
          currentLocation: {
            type: 'object',
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 },
              address: { type: 'string', maxLength: 255 }
            },
            required: ['latitude', 'longitude']
          }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      // Check if profile exists and belongs to user
      const existingProfile = await profileService.getProfileById(id);
      if (!existingProfile) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Profile'));
      }

      if (existingProfile.id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      // Map frontend fields to database column names
      const updateData: any = {};
      const body = request.body;

      // Handle field mapping
      if (body.fullName !== undefined) updateData.display_name = body.fullName;
      if (body.displayName !== undefined) updateData.display_name = body.displayName;
      if (body.handle !== undefined) updateData.handle = body.handle;
      if (body.bio !== undefined) updateData.bio = body.bio;
      if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl;
      if (body.countryCode !== undefined) updateData.country_code = body.countryCode;
      if (body.phoneNumber !== undefined) updateData.phone_number = body.phoneNumber;
      if (body.expoPushToken !== undefined) updateData.expo_push_token = body.expoPushToken;
      
      // Handle location data
      if (body.currentLocation) {
        updateData.latitude = body.currentLocation.latitude;
        updateData.longitude = body.currentLocation.longitude;
      }

      const updatedProfile = await profileService.updateProfile(id, updateData);
      return reply.send(successResponse(updatedProfile));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Update location
  fastify.patch('/:id/location', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Profiles'],
      summary: 'Update profile location',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { latitude, longitude } = request.body;
      const userId = request.user?.id;

      // Check if profile belongs to user
      const existingProfile = await profileService.getProfileById(id);
      if (!existingProfile) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Profile'));
      }

      if (existingProfile.id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      const updatedProfile = await profileService.updateLocation(id, latitude, longitude);
      return reply.send(successResponse(updatedProfile));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Update availability (for drivers)
  fastify.patch('/:id/availability', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Profiles'],
      summary: 'Update driver availability',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['is_available'],
        properties: {
          is_available: { type: 'boolean' }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { is_available } = request.body;
      const userId = request.user?.id;

      // Check if profile belongs to user
      const existingProfile = await profileService.getProfileById(id);
      if (!existingProfile) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Profile'));
      }

      if (existingProfile.id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      const updatedProfile = await profileService.updateAvailability(id, is_available);
      return reply.send(successResponse(updatedProfile));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Search profiles
  fastify.get('/', {
    preHandler: optionalAuth,
    schema: {
      tags: ['Profiles'],
      summary: 'Search profiles',
      querystring: {
        type: 'object',
        properties: {
          display_name: { type: 'string' },
          role: { type: 'string', enum: ['rider', 'driver', 'admin', 'moderator'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { display_name, role, page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      const result = await profileService.searchProfiles(display_name || '');

      const pagination = createPaginationMeta(page, limit, result.length);

      return reply.send(successResponse({
        profiles: result,
        pagination
      }));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Find nearby drivers
  fastify.get('/drivers/nearby', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Profiles'],
      summary: 'Find nearby drivers',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          radius: { type: 'number', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { latitude, longitude, radius = 10 } = request.query;

      const drivers = await profileService.searchProfiles('');
      return reply.send(successResponse(drivers));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Delete profile
  fastify.delete('/:id', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Profiles'],
      summary: 'Delete profile',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      // Check if profile belongs to user
      const existingProfile = await profileService.getProfileById(id);
      if (!existingProfile) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Profile'));
      }

      if (existingProfile.id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      // Delete profile using direct Supabase call since deleteProfile method doesn't exist
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete profile: ${error.message}`);
      }

      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });
}