const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'THE OUTNET Wholesale API',
      version: '1.0.0',
      description: 'E-commerce wholesale backend API for THE OUTNET platform',
      contact: { name: 'Support', email: 'support@theoutnet.com' },
    },
    servers: [
      { url: 'https://lazada-backend-production-3b57.up.railway.app', description: 'Production' },
      { url: 'http://localhost:5000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token from login response',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [
    './routes/auth.js',
    './routes/authRefresh.js',
    './routes/admin.js',
    './routes/cms.js',
    './routes/review.js',
    './routes/notification.js',
    './routes/report.js',
    './routes/settings.js',
    './routes/session.js',
    './routes/order.js',
    './routes/product.js',
    './routes/shop.js',
    './routes/user.js',
    './routes/wallet.js',
    './routes/shipping.js',
    './routes/coupon.js',
  ],
};

module.exports = swaggerJsdoc(options);
