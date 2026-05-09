const swaggerJsDoc =
require('swagger-jsdoc');

const swaggerUi =
require('swagger-ui-express');


const options = {

  definition: {

    openapi: '3.0.0',

    info: {
      title:
        'RBAC JWT Auth API',

      version:
        '1.0.0',

      description:
        'Production-grade authentication and authorization API'
    },

    servers: [
      {
        url:
          process.env.RENDER_EXTERNAL_URL ||
          'http://localhost:3000'
      }
    ],

    components: {

      securitySchemes: {

        bearerAuth: {

          type:
            'http',

          scheme:
            'bearer',

          bearerFormat:
            'JWT'
        }
      }
    }
  },

  apis: []
};


const swaggerSpec =
  swaggerJsDoc(
    options
  );


module.exports = {
  swaggerUi,
  swaggerSpec
};