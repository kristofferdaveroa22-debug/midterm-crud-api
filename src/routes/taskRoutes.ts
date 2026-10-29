
import { Router } from 'express';
import { TaskController } from '../controllers/taskController';

export const taskRoutes = Router();

// GET all tasks
taskRoutes.get('/tasks', TaskController.getAllTasks);

// GET and POST tasks for a specific user
taskRoutes.get('/users/:userId/tasks', TaskController.getUserTasks);
taskRoutes.post('/users/:userId/tasks', TaskController.createTask);

// DELETE a task
taskRoutes.delete('/tasks/:id', TaskController.deleteTask);
