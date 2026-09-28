'use strict';

/**
 * Swagger / OpenAPI 3.0 specification for VinaMec Dental Care API.
 * Served at GET /api/docs when NODE_ENV !== 'production'.
 *
 * To enable full interactive docs, install swagger-ui-express:
 *   npm install swagger-ui-express
 * Then uncomment the setup block in server.js.
 */

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'VinaMec Dental Care AI System – API',
    description: `
## 🦷 VinaMec Dental Care REST API

Full-featured dental clinic management API with RBAC, AI chatbot, image analysis, and more.

### Authentication
Use **Bearer token** in the Authorization header:
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

### Roles
| Role    | Permissions |
|---------|-------------|
| admin   | Full access to all resources |
| doctor  | Patients, appointments, records, images, chat |
| patient | Own data only |
    `,
    version: '1.0.0',
    contact: { name: 'VinaMec Support', email: 'support@vinamec.vn' },
  },
  servers: [
    { url: 'http://localhost:5000/api', description: 'Development' },
    { url: 'https://api.vinamec.vn/api', description: 'Production' },
  ],
  tags: [
    { name: 'Auth',         description: 'Authentication & registration' },
    { name: 'Users',        description: 'User management (admin)' },
    { name: 'Patients',     description: 'Patient profiles' },
    { name: 'Doctors',      description: 'Doctor profiles' },
    { name: 'Appointments', description: 'Appointment booking & management' },
    { name: 'Records',      description: 'Medical records' },
    { name: 'Services',     description: 'Dental services catalogue' },
    { name: 'Images',       description: 'Dental image upload & gallery' },
    { name: 'Scores',       description: 'Dental health scoring' },
    { name: 'Chat',         description: 'AI Chatbot (public & private)' },
    { name: 'Prediction',   description: 'AI image analysis' },
    { name: 'Voice',        description: 'Voice transcription (doctor only)' },
    { name: 'Admin',        description: 'Admin dashboard & analytics' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data:    { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data:    { type: 'array', items: { type: 'object' } },
          meta: {
            type: 'object',
            properties: {
              total:      { type: 'integer' },
              page:       { type: 'integer' },
              limit:      { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id:            { type: 'string' },
          name:           { type: 'string' },
          email:          { type: 'string', format: 'email' },
          role:           { type: 'string', enum: ['admin','doctor','patient'] },
          phone:          { type: 'string' },
          isActive:       { type: 'boolean' },
          createdAt:      { type: 'string', format: 'date-time' },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          _id:         { type: 'string' },
          patientName: { type: 'string' },
          doctorName:  { type: 'string' },
          serviceName: { type: 'string' },
          date:        { type: 'string', example: '2024-06-15' },
          time:        { type: 'string', example: '09:00' },
          status:      { type: 'string', enum: ['pending','confirmed','completed','cancelled','no-show'] },
          fee:         { type: 'number' },
        },
      },
      MedicalRecord: {
        type: 'object',
        properties: {
          _id:         { type: 'string' },
          patientName: { type: 'string' },
          doctorName:  { type: 'string' },
          diagnosis:   { type: 'string' },
          treatment:   { type: 'string' },
          prescription:{ type: 'string' },
          date:        { type: 'string' },
        },
      },
      DentalScore: {
        type: 'object',
        properties: {
          overall:     { type: 'integer', minimum: 0, maximum: 100 },
          gumHealth:   { type: 'integer', minimum: 0, maximum: 100 },
          toothDecay:  { type: 'integer', minimum: 0, maximum: 100 },
          alignment:   { type: 'integer', minimum: 0, maximum: 100 },
          cleanliness: { type: 'integer', minimum: 0, maximum: 100 },
          history:     { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, score: { type: 'integer' } } } },
        },
      },
    },
    responses: {
      Unauthorized:  { description: 'Missing or invalid JWT', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      Forbidden:     { description: 'Insufficient role permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      NotFound:      { description: 'Resource not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      ValidationError:{ description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new user', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name','email','password'], properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 6 }, role: { type: 'string', enum: ['patient','doctor'] } } } } } },
        responses: { 201: { description: 'Registered successfully' }, 409: { $ref: '#/components/responses/ValidationError' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email','password'], properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Login successful, returns JWT token' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Get current user', responses: { 200: { description: 'Current user profile' } } },
    },
    '/chat/public': {
      post: {
        tags: ['Chat'], summary: 'Public chatbot (no auth)', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['message'], properties: { message: { type: 'string' }, history: { type: 'array' }, sessionId: { type: 'string' } } } } } },
        responses: { 200: { description: 'AI reply' } },
      },
    },
    '/chat/private': {
      post: {
        tags: ['Chat'], summary: 'Private chatbot (patient, doctor)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['message'], properties: { message: { type: 'string' }, history: { type: 'array' }, sessionId: { type: 'string' } } } } } },
        responses: { 200: { description: 'AI reply with user context' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },
    '/appointments': {
      get:  { tags: ['Appointments'], summary: 'List all appointments (admin, doctor)', responses: { 200: { description: 'Paginated appointments' } } },
    },
    '/appointments/me': {
      get: { tags: ['Appointments'], summary: "Patient's own appointments", responses: { 200: { description: 'Paginated appointments' } } },
    },
    '/images/upload': {
      post: {
        tags: ['Images'], summary: 'Upload a dental image',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' }, type: { type: 'string', enum: ['xray','photo','scan','other'] }, description: { type: 'string' }, patientId: { type: 'string' } } } } } },
        responses: { 201: { description: 'Image uploaded' } },
      },
    },
    '/scores/me': {
      get: { tags: ['Scores'], summary: "Patient's own dental score", responses: { 200: { description: 'Dental score object' } } },
    },
    '/admin/dashboard': {
      get: { tags: ['Admin'], summary: 'Admin dashboard KPIs', responses: { 200: { description: 'Aggregated stats' } } },
    },
  },
};

module.exports = swaggerDocument;