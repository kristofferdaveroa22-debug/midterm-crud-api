
import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { TaskController } from '../controllers/taskController';

export const userRouter = Router();

// GET /api/users
userRouter.get('/', UserController.getAll);

// GET /api/users/:userId/stats
userRouter.get('/:userId/stats', TaskController.getUserStats);

// GET /api/users/:id
userRouter.get('/:id', UserController.getById);

// POST /api/users
userRouter.post('/', UserController.create);

// PUT /api/users/:id
userRouter.put('/:id', UserController.update);

// DELETE /api/users/:id
userRouter.delete('/:id', UserController.delete);

userRouter.post(
    '/with-initial-task',
    UserController.createUserWithInitialTask
);