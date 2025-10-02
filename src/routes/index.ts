import { FastifyInstance } from 'fastify';
import { profileRoutes } from './profiles.js';
import { rideRoutes } from './rides.js';
import { garageRoutes } from './garages.js';
import { authRoutes } from './auth.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register API routes with specific prefixes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(profileRoutes, { prefix: '/api/profiles' });
  await fastify.register(rideRoutes, { prefix: '/api/rides' });
  await fastify.register(garageRoutes, { prefix: '/api/garages' });
}