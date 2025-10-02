import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { garageService, motorcycleService } from '../services/garage.js';
import { CommonErrors } from '../utils/response.js';

export async function garageRoutes(fastify: FastifyInstance) {
  // Get garage by ID
  fastify.get('/garages/:id', async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const garage = await garageService.getGarageById(id);
      
      if (!garage) {
        return reply.code(404).send(CommonErrors.NOT_FOUND);
      }

      return { garage };
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Get user's garages
  fastify.get('/garages', async (request: any, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED);
      }

      const garages = await garageService.getGaragesByOwner(request.user.id);
      return { garages };
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Create garage
  fastify.post('/garages', async (request: any, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED);
      }

      const garageData = {
        ...request.body,
        owner_id: request.user.id
      };

      const garage = await garageService.createGarage(garageData);
      return reply.code(201).send({ garage });
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Update garage
  fastify.put('/garages/:id', async (request: any, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED);
      }

      const { id } = request.params;
      const garage = await garageService.updateGarage(id, request.body);
      return { garage };
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Delete garage
  fastify.delete('/garages/:id', async (request: any, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED);
      }

      const { id } = request.params;
      await garageService.deleteGarage(id);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Get motorcycle by ID
  fastify.get('/motorcycles/:id', async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const motorcycle = await motorcycleService.getMotorcycleById(id);
      
      if (!motorcycle) {
        return reply.code(404).send(CommonErrors.NOT_FOUND);
      }

      return { motorcycle };
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Get motorcycles by garage
  fastify.get('/garages/:garageId/motorcycles', async (request: any, reply: FastifyReply) => {
    try {
      const { garageId } = request.params;
      const motorcycles = await motorcycleService.getMotorcyclesByGarage(garageId);
      return { motorcycles };
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Create motorcycle
  fastify.post('/garages/:garageId/motorcycles', async (request: any, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED);
      }

      const { garageId } = request.params;
      const motorcycleData = {
        ...request.body,
        garage_id: garageId
      };

      const motorcycle = await motorcycleService.createMotorcycle(motorcycleData);
      return reply.code(201).send({ motorcycle });
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Update motorcycle
  fastify.put('/motorcycles/:id', async (request: any, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED);
      }

      const { id } = request.params;
      const motorcycle = await motorcycleService.updateMotorcycle(id, request.body);
      return { motorcycle };
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Update motorcycle odometer
  fastify.patch('/motorcycles/:id/odometer', async (request: any, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED);
      }

      const { id } = request.params;
      const { odometer_km } = request.body;
      const motorcycle = await motorcycleService.updateOdometer(id, odometer_km);
      return { motorcycle };
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });

  // Soft delete motorcycle
  fastify.delete('/motorcycles/:id', async (request: any, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.code(401).send(CommonErrors.UNAUTHORIZED);
      }

      const { id } = request.params;
      const motorcycle = await motorcycleService.softDeleteMotorcycle(id);
      return { motorcycle };
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR);
    }
  });
}