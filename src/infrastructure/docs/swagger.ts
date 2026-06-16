import swaggerJsdoc from 'swagger-jsdoc';

const options: Parameters<typeof swaggerJsdoc>[0] = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Starter Kit',
      version: '0.2.0',
      description: 'Reusable TypeScript API starter kit with Clean Architecture',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT ?? 3000}`, description: 'Development server' },
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
  apis: ['./src/presentation/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
