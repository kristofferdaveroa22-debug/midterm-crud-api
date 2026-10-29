// src/routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../controllers/userController';

export const userRouter = Router();

// GET /api/users
userRouter.get('/', UserController.getAll);

// GET /api/users/:id
userRouter.get('/:id', UserController.getById);

// POST /api/users
userRouter.post('/', UserController.create);

// PUT /api/users/:id
userRouter.put('/:id', UserController.update);

// DELETE /api/users/:id
userRouter.delete('/:id', UserController.delete);