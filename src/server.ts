import fastify from 'fastify';
import cors from '@fastify/cors';
import type { FastifyCorsOptions } from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env';
import { successResponse, errorResponse } from './utils/response';
import { registerRoutes } from './routes/index';

// Create and configure Fastify server
async function createServer() {
  // Create Fastify instance
  const server = fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    }
  });

  const corsOptions: FastifyCorsOptions = {
    origin: env.NODE_ENV === 'development' ? true : [
      'https://broad.app',
      'https://www.broad.app',
      /\.broad\.app$/,
      'http://localhost:8081',
      /^http:\/\/localhost:\\d+$/,
      /^http:\/\/127\.0\.0\.1:\\d+$/,
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    strictPreflight: false,
  };

  // Register CORS early so preflight requests resolve before auth hooks
  await server.register(cors, corsOptions);

  // Register Swagger documentation
  await server.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Broad API',
        description: 'Backend API for Broad motorcycle ride sharing platform',
        version: '1.0.0',
      },
      servers: [
        {
          url: env.NODE_ENV === 'development' 
            ? `http://localhost:${env.PORT}` 
            : 'https://api.broad.app',
          description: env.NODE_ENV === 'development' ? 'Development server' : 'Production server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // Global error handler
  server.setErrorHandler((error: any, request: any, reply: any) => {
    const statusCode = error.statusCode || 500;
    
    server.log.error({
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method
    });

    if (statusCode >= 500) {
      return reply.code(statusCode).send(errorResponse(
        'INTERNAL_ERROR',
        'Internal Server Error',
        env.NODE_ENV === 'development' ? error.message : undefined
      ));
    }

    return reply.code(statusCode).send(errorResponse(
      'ERROR',
      error.message
    ));
  });

  // Health check endpoint
  server.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                uptime: { type: 'number' },
                environment: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    return {
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      data: {
        status: 'ok',
        uptime: process.uptime(),
        environment: env.NODE_ENV
      }
    };
  });

  // Register API routes
  await registerRoutes(server);

  return server;
}

// Start server
const start = async () => {
  try {
    const server = await createServer();
    
    await server.listen({ 
      port: env.PORT, 
      host: env.NODE_ENV === 'development' ? '127.0.0.1' : '0.0.0.0' 
    });
    
    server.log.info(`🚀 Server running at http://localhost:${env.PORT}`);
    server.log.info(`📚 API documentation available at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server if this file is run directly
if (require.main === module) {
  start();
}

export { createServer };
export default createServer;
