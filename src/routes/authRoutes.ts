
import { Router } from 'express';
import { AuthController } from '../controllers/authController';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', AuthController.login);
