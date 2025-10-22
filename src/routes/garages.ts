import { FastifyInstance, FastifyReply } from 'fastify';
import { garageService, motorcycleService } from '../services/garage.js';
import { CommonErrors, successResponse } from '../utils/response.js';
import { authenticateUser } from '../middleware/auth.js';

export async function garageRoutes(fastify: FastifyInstance) {
  // Get garage by ID
  fastify.get('/:id', async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const garage = await garageService.getGarageById(id);
      
      if (!garage) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Garage'));
      }

      return reply.send(successResponse({ garage }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Get user's garages
  fastify.get('/', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const garages = await garageService.getGaragesByOwner(request.user.id);
      return reply.send(successResponse({ garages }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Create garage
  fastify.post('/', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const garageData = {
        ...request.body,
        owner_id: request.user.id
      };

      const garage = await garageService.createGarage(garageData);
      return reply.code(201).send(successResponse({ garage }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Update garage
  fastify.put('/:id', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const garage = await garageService.updateGarage(id, request.body);
      return reply.send(successResponse({ garage }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Delete garage
  fastify.delete('/:id', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      await garageService.deleteGarage(id);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Get motorcycle by ID
  fastify.get('/motorcycles/:id', async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const motorcycle = await motorcycleService.getMotorcycleById(id);
      
      if (!motorcycle) {
        return reply.code(404).send(CommonErrors.NOT_FOUND('Motorcycle'));
      }

      return reply.send(successResponse({ motorcycle }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Get motorcycles by garage
  fastify.get('/:garageId/motorcycles', async (request: any, reply: FastifyReply) => {
    try {
      const { garageId } = request.params;
      const motorcycles = await motorcycleService.getMotorcyclesByGarage(garageId);
      return reply.send(successResponse({ motorcycles }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Create motorcycle
  fastify.post('/:garageId/motorcycles', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { garageId } = request.params;
      const motorcycleData = {
        ...request.body,
        garage_id: garageId
      };

      const motorcycle = await motorcycleService.createMotorcycle(motorcycleData);
      return reply.code(201).send(successResponse({ motorcycle }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Update motorcycle
  fastify.put('/motorcycles/:id', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const motorcycle = await motorcycleService.updateMotorcycle(id, request.body);
      return reply.send(successResponse({ motorcycle }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Update motorcycle odometer
  fastify.patch('/motorcycles/:id/odometer', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { odometer_km } = request.body;
      const motorcycle = await motorcycleService.updateOdometer(id, odometer_km);
      return reply.send(successResponse({ motorcycle }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Soft delete motorcycle
  fastify.delete('/motorcycles/:id', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const motorcycle = await motorcycleService.softDeleteMotorcycle(id);
      return reply.send(successResponse({ motorcycle }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Garage dashboard (aggregate)
  fastify.get('/:id/dashboard', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const dashboard = await garageService.getDashboard(id);
      return reply.send(successResponse(dashboard));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Workspace notes
  fastify.get('/:id/notes', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const notes = await garageService.getWorkspaceNotes(id);
      return reply.send(successResponse({ workspaceNotes: notes }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  fastify.put('/:id/notes', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { workspaceNotes } = request.body || {};
      const updated = await garageService.updateWorkspaceNotes(id, workspaceNotes ?? '');
      return reply.send(successResponse({ workspaceNotes: updated }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Tasks CRUD
  fastify.get('/:garageId/tasks', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { garageId } = request.params;
      const tasks = await garageService.getTasks(garageId);
      return reply.send(successResponse({ tasks }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  fastify.post('/:garageId/tasks', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { garageId } = request.params;
      const created = await garageService.createTask(garageId, request.body?.label ?? '');
      return reply.code(201).send(successResponse({ task: created }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  fastify.put('/tasks/:id', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updated = await garageService.updateTask(id, request.body?.label ?? '');
      return reply.send(successResponse({ task: updated }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  fastify.delete('/tasks/:id', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      await garageService.deleteTask(id);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Documents CRUD
  fastify.get('/:garageId/documents', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { garageId } = request.params;
      const documents = await garageService.getDocuments(garageId);
      return reply.send(successResponse({ documents }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  fastify.post('/:garageId/documents', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { garageId } = request.params;
      const created = await garageService.createDocument(garageId, request.body);
      return reply.code(201).send(successResponse({ document: created }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  fastify.put('/documents/:id', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updated = await garageService.updateDocument(id, request.body);
      return reply.send(successResponse({ document: updated }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  fastify.delete('/documents/:id', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      await garageService.deleteDocument(id);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  // Primary/backup bike assignment
  fastify.patch('/:id/primary-bike', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { motorcycleId } = request.body || {};
      const updated = await garageService.setPrimaryBike(id, motorcycleId);
      return reply.send(successResponse({ garage: updated }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });

  fastify.patch('/:id/backup-bike', { preHandler: authenticateUser }, async (request: any, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { motorcycleId } = request.body || {};
      const updated = await garageService.setBackupBike(id, motorcycleId);
      return reply.send(successResponse({ garage: updated }));
    } catch (error) {
      return reply.code(500).send(CommonErrors.INTERNAL_ERROR());
    }
  });
}