import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { serveSwagger } from './config/swagger.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // For Swagger UI
    crossOriginEmbedderPolicy: false,
  })
);

// Cookie Parser Middleware
app.use(cookieParser());

// CORS configuration with credentials support
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiter for general endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Swagger documentation
serveSwagger(app);

// Mount main API routes
app.use('/api/v1', routes);

// Base route redirect
app.get('/', (req, res) => {
  res.json({
    message: 'Project Management & Collaboration Tool API',
    docs: '/api/docs',
    health: '/api/v1/health',
    version: '1.0.0',
  });
});

// 404 & centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
