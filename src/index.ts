import 'reflect-metadata'; // MUST be first import!
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';
import { userRouter } from './routes/userRoutes';
import { taskRoutes } from './routes/taskRoutes';
import { authRouter } from './routes/authRoutes';
import * as dotenv from 'dotenv';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API Version 1 Routes
app.use('/api/v1', taskRoutes);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);

// Old API routes - return 410 Gone
app.use('/api', (req, res, next) => {
    // Allow /api/v1 routes to continue to the 404 handler if unmatched
    if (req.path === '/v1' || req.path.startsWith('/v1/')) {
        return next();
    }

    return res.status(410).json({
        success: false,
        error: {
            code: 'ENDPOINT_MOVED',
            message: 'This endpoint has moved. Please use the /api/v1/ prefix instead.',
            movedTo: `/api/v1${req.path === '/' ? '' : req.path}`
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.url} not found`
        }
    });
});

// Express server reference
let server: ReturnType<typeof app.listen>;

// Graceful Shutdown
const gracefulShutdown = (signal: string) => {
    console.log(`\n⚠️ ${signal} received. Starting graceful shutdown...`);

    if (!server) {
        process.exit(0);
        return;
    }

    server.close(async (error) => {
        if (error) {
            console.error('❌ Error closing Express server:', error);
            process.exitCode = 1;
        }

        console.log('✅ Express server closed.');

        try {
            if (AppDataSource.isInitialized) {
                await AppDataSource.destroy();
                console.log('✅ Database connection closed.');
            }

            console.log('👋 Graceful shutdown completed.');
            process.exit();
        } catch (dbError) {
            console.error('❌ Error closing database connection:', dbError);
            process.exit(1);
        }
    });
};

// Listen for shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log('✅ Database connected successfully!');

        server = app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    });
