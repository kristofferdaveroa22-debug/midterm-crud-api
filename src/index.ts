
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import { AppDataSource } from './config/data-source';
import { userRoutes } from './routes/userRoutes';
import { taskRoutes } from './routes/taskRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// User routes
app.use('/api/users', userRoutes);

// Task routes
app.use('/api', taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// Connect to database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully!');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });
