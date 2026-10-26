
 // ============================================
 // app.js - Express Application Setup
 // ============================================

import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js';

const app = express();

// Allow the frontend on either Vite port
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
