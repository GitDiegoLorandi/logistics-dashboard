const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Logistics Dashboard API',
      version: '1.0.0',
      description: 'A comprehensive logistics management system API',
      contact: {
        name: 'API Support',
        email: 'support@logistics-dashboard.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.logistics-dashboard.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password (min 6 characters)',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user',
              description: 'User role',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'User active status',
            },
          },
        },
        Delivery: {
          type: 'object',
          required: ['orderId', 'customer'],
          properties: {
            id: {
              type: 'string',
              description: 'Delivery unique identifier',
            },
            orderId: {
              type: 'string',
              description: 'Unique order identifier',
            },
            status: {
              type: 'string',
              enum: ['Pending', 'In Transit', 'Delivered', 'Cancelled'],
              default: 'Pending',
              description: 'Delivery status',
            },
            customer: {
              type: 'string',
              description: 'Customer name',
            },
            deliverer: {
              type: 'string',
              description: 'Assigned deliverer ID',
            },
            priority: {
              type: 'string',
              enum: ['Low', 'Medium', 'High', 'Urgent'],
              default: 'Medium',
              description: 'Delivery priority',
            },
            deliveryAddress: {
              type: 'string',
              description: 'Delivery address',
            },
            estimatedDeliveryDate: {
              type: 'string',
              format: 'date-time',
              description: 'Estimated delivery date',
            },
            actualDeliveryDate: {
              type: 'string',
              format: 'date-time',
              description: 'Actual delivery date',
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Deliverer: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'string',
              description: 'Deliverer unique identifier',
            },
            name: {
              type: 'string',
              description: 'Deliverer full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Deliverer email address',
            },
            phone: {
              type: 'string',
              description: 'Deliverer phone number',
            },
            status: {
              type: 'string',
              enum: ['Available', 'Busy', 'Offline'],
              default: 'Available',
              description: 'Deliverer current status',
            },
            vehicleType: {
              type: 'string',
              enum: ['Car', 'Motorcycle', 'Van', 'Truck', 'Bicycle'],
              description: 'Vehicle type',
            },
            deliveries: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of assigned delivery IDs',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Deliverer active status',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field with error',
                  },
                  message: {
                    type: 'string',
                    description: 'Error description',
                  },
                },
              },
              description: 'Validation errors',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful',
            },
            token: {
              type: 'string',
              description: 'JWT authentication token',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        AssignmentResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Deliverer assigned successfully',
            },
            delivery: {
              $ref: '#/components/schemas/Delivery',
            },
            statusChanges: {
              type: 'object',
              properties: {
                delivery: {
                  type: 'object',
                  properties: {
                    from: {
                      type: 'string',
                      example: 'Pending',
                    },
                    to: {
                      type: 'string',
                      example: 'In Transit',
                    },
                  },
                },
                deliverer: {
                  type: 'object',
                  properties: {
                    from: {
                      type: 'string',
                      example: 'Available',
                    },
                    to: {
                      type: 'string',
                      example: 'Busy',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js', // Path to route files for documentation
    './src/models/*.js', // Path to model files for schema documentation
  ],
};

const specs = swaggerJsdoc(swaggerOptions);

/**
 * Configure Swagger documentation
 * @param {Object} app - Express app instance
 * @param {Object} config - Environment configuration
 */
const setupSwagger = (app, config) => {
  if (config.API_DOCS_ENABLED) {
    const swaggerUiOptions = {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
      customSiteTitle: 'Logistics Dashboard API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 50px 0 }
        .swagger-ui .info .title { color: #3b82f6 }
      `,
    };

    app.use(
      config.API_DOCS_PATH,
      swaggerUi.serve,
      swaggerUi.setup(specs, swaggerUiOptions)
    );

    console.log(
      `📚 API Documentation available at: http://localhost:${config.PORT}${config.API_DOCS_PATH}`
    );
  } else {
    console.log('📚 API Documentation disabled in production');
  }
};

module.exports = {
  setupSwagger,
  swaggerSpecs: specs,
};
