const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3003;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Tracker API',
      version: '1.0.0',
      description: 'API documentation for the Expense Tracker application',
    },
    servers: [
      {
        url: `${BASE_URL}/api`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
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
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.js'], // Points to the route files for annotations (not used strictly here but standard)
};

const specs = swaggerJsdoc(options);
module.exports = specs;
