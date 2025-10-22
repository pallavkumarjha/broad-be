import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RideService } from '../services/ride.js';
import { supabase } from '../config/supabase.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';
import { successResponse, CommonErrors, createPaginationMeta } from '../utils/response.js';
import {
  CreateRideSchema,
  UpdateRideSchema,
  PaginationSchema,
  UuidSchema
} from '../schemas/index.js';

export async function rideRoutes(fastify: FastifyInstance) {
  const rideService = new RideService();

  // Get ride by ID
  fastify.get('/:id', {
    preHandler: optionalAuth,
    schema: {
      tags: ['Rides'],
      summary: 'Get ride by ID',
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
      const ride = await rideService.getRideById(id);
      
      if (!ride) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Ride'));
      }

      return reply.send(successResponse(ride));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Create ride
  fastify.post('/', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Create new ride',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'startsAt'],
        properties: {
          title: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 200 
          },
          tagline: { 
            type: 'string', 
            maxLength: 100 
          },
          routeSummary: { 
            type: 'string', 
            maxLength: 1000 
          },
          startsAt: { 
            type: 'string', 
            format: 'date-time' 
          },
          meetupLocation: {
            type: 'object',
            properties: {
              latitude: { 
                type: 'number', 
                minimum: -90, 
                maximum: 90 
              },
              longitude: { 
                type: 'number', 
                minimum: -180, 
                maximum: 180 
              },
              address: { 
                type: 'string' 
              }
            }
          },
          pace: { 
            type: 'string', 
            enum: ['cruise', 'group', 'spirited'] 
          },
          experienceLevel: { 
            type: 'string', 
            enum: ['novice', 'intermediate', 'advanced'] 
          },
          maxRiders: { 
            type: 'integer', 
            minimum: 2, 
            maximum: 50, 
            default: 10 
          },
          // New trip fields
          name: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 200 
          },
          dateISO: { 
            type: 'string', 
            format: 'date' 
          },
          meetupISO: { 
            type: 'string', 
            format: 'date-time' 
          },
          meetLocation: { 
            type: 'string', 
            maxLength: 500 
          },
          distance: { 
            type: 'string', 
            enum: ['short', 'medium', 'long'] 
          },
          gearCallout: { 
            type: 'string', 
            maxLength: 1000 
          },
          commSignals: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          safetyChecks: { 
            type: 'array', 
            items: { type: 'string' } 
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

      const rideData = {
        ...request.body,
        creator_id: userId
      };

      const ride = await rideService.createRide(rideData);
      return reply.code(201).send(successResponse(ride));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Update ride
  fastify.patch('/:id', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Update ride',
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
          title: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 200 
          },
          tagline: { 
            type: 'string', 
            maxLength: 100 
          },
          routeSummary: { 
            type: 'string', 
            maxLength: 1000 
          },
          startsAt: { 
            type: 'string', 
            format: 'date-time' 
          },
          meetupLocation: {
            type: 'object',
            properties: {
              latitude: { 
                type: 'number', 
                minimum: -90, 
                maximum: 90 
              },
              longitude: { 
                type: 'number', 
                minimum: -180, 
                maximum: 180 
              },
              address: { 
                type: 'string' 
              }
            }
          },
          pace: { 
            type: 'string', 
            enum: ['cruise', 'group', 'spirited'] 
          },
          experienceLevel: { 
            type: 'string', 
            enum: ['novice', 'intermediate', 'advanced'] 
          },
          maxRiders: { 
            type: 'integer', 
            minimum: 2, 
            maximum: 50 
          },
          status: { 
            type: 'string', 
            enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] 
          },
          // New trip fields
          name: { 
            type: 'string', 
            minLength: 1, 
            maxLength: 200 
          },
          dateISO: { 
            type: 'string', 
            format: 'date' 
          },
          meetupISO: { 
            type: 'string', 
            format: 'date-time' 
          },
          meetLocation: { 
            type: 'string', 
            maxLength: 500 
          },
          distance: { 
            type: 'string', 
            enum: ['short', 'medium', 'long'] 
          },
          gearCallout: { 
            type: 'string', 
            maxLength: 1000 
          },
          commSignals: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          safetyChecks: { 
            type: 'array', 
            items: { type: 'string' } 
          }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      // Check if ride exists and belongs to user
      const existingRide = await rideService.getRideById(id);
      if (!existingRide) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Ride'));
      }

      if (existingRide.creator_id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      const updatedRide = await rideService.updateRide(id, request.body);
      return reply.send(successResponse(updatedRide));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Update ride status
  fastify.patch('/:id/status', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Update ride status',
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
        required: ['status'],
        properties: {
          status: { 
            type: 'string', 
            enum: ['planned', 'active', 'completed', 'cancelled'] 
          }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;
      const userId = request.user?.id;

      // Check if ride exists and belongs to user
      const existingRide = await rideService.getRideById(id);
      if (!existingRide) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Ride'));
      }

      if (existingRide.creator_id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      const updatedRide = await rideService.updateRideStatus(id, status);
      return reply.send(successResponse(updatedRide));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Search rides
  fastify.get('/', {
    preHandler: optionalAuth,
    schema: {
      tags: ['Rides'],
      summary: 'Search rides',
      querystring: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          status: { 
            type: 'string', 
            enum: ['planned', 'active', 'completed', 'cancelled'] 
          },
          start_location: { type: 'string' },
          end_location: { type: 'string' },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { 
        title, 
        status, 
        start_location, 
        end_location, 
        start_date, 
        end_date, 
        page = 1, 
        limit = 20 
      } = request.query;
      const offset = (page - 1) * limit;

      const result = await rideService.searchRides({
        pace: request.query.pace,
        experience_level: request.query.experience_level,
        starts_after: start_date,
        starts_before: end_date
      });

      const pagination = createPaginationMeta(page, limit, result.length);

      return reply.send(successResponse({
        rides: result,
        pagination
      }));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Get user's rides
  fastify.get('/my-rides', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Get current user rides',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: ['planned', 'active', 'completed', 'cancelled'] 
          },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED());
      }

      const { status, page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      const result = await rideService.getRidesByCreator(userId);

      const pagination = createPaginationMeta(page, limit, result.length);

      return reply.send(successResponse({
        rides: result,
        pagination
      }));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Get upcoming rides
  fastify.get('/upcoming', {
    preHandler: optionalAuth,
    schema: {
      tags: ['Rides'],
      summary: 'Get upcoming rides',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      const result = await rideService.getUpcomingRides();

      const pagination = createPaginationMeta(page, limit, result.length);

      return reply.send(successResponse({
        rides: result,
        pagination
      }));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Get ride with bookings
  fastify.get('/:id/bookings', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Get ride with bookings',
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

      // Check if ride exists
      const existingRide = await rideService.getRideById(id);
      if (!existingRide) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Ride'));
      }

      // Only ride creator can see bookings
      if (existingRide.creator_id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      const rideWithBookings = await rideService.getRideById(id);
      return reply.send(successResponse(rideWithBookings));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Book a ride
  fastify.post('/:id/book', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Book a ride',
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

      // Check if ride exists and belongs to user
      const existingRide = await rideService.getRideById(id);
      if (!existingRide) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Ride'));
      }

      if (existingRide.creator_id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      // Check if ride can be cancelled
      if (existingRide.status === 'completed' || existingRide.status === 'cancelled') {
        return reply.code(400).send(CommonErrors.BAD_REQUEST('Cannot cancel completed or already cancelled ride'));
      }

      const cancelledRide = await rideService.cancelRide(id);
      return reply.send(successResponse(cancelledRide));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Cancel ride
  fastify.patch('/:id/cancel', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Cancel ride',
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

      // Check if ride exists and belongs to user
      const existingRide = await rideService.getRideById(id);
      if (!existingRide) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Ride'));
      }

      if (existingRide.creator_id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      // Check if ride can be cancelled
      if (existingRide.status === 'completed' || existingRide.status === 'cancelled') {
        return reply.code(400).send(CommonErrors.BAD_REQUEST('Cannot cancel completed or already cancelled ride'));
      }

      const cancelledRide = await rideService.cancelRide(id);
      return reply.send(successResponse(cancelledRide));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Complete ride
  fastify.patch('/:id/complete', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Complete ride',
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

      // Check if ride exists and belongs to user
      const existingRide = await rideService.getRideById(id);
      if (!existingRide) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Ride'));
      }

      if (existingRide.creator_id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      // Check if ride can be cancelled
      if (existingRide.status === 'completed' || existingRide.status === 'cancelled') {
        return reply.code(400).send(CommonErrors.BAD_REQUEST('Cannot cancel completed or already cancelled ride'));
      }

      const cancelledRide = await rideService.cancelRide(id);
      return reply.send(successResponse(cancelledRide));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Delete ride
  fastify.delete('/:id', {
    preHandler: authenticateUser,
    schema: {
      tags: ['Rides'],
      summary: 'Delete ride',
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

      // Check if ride exists and belongs to user
      const existingRide = await rideService.getRideById(id);
      if (!existingRide) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Ride'));
      }

      if (existingRide.creator_id !== userId) {
        return reply.code(403).send(CommonErrors.FORBIDDEN());
      }

      await rideService.deleteRide(id);
      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });
}