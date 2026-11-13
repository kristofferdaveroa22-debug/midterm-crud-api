
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Task } from '../entities/Task';
import { User } from '../entities/User';
import { Category } from '../entities/Category';
import { CreateTaskDto } from '../dto/CreateTaskDto';

const taskRepository = AppDataSource.getRepository(Task);
const userRepository = AppDataSource.getRepository(User);
const categoryRepository = AppDataSource.getRepository(Category);

// Sanitize title and description by removing basic HTML tags
const sanitizeHtml = (value: string): string => {
    return value
        .replace(/<\s*(script|style)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
};

export class TaskController {

    // GET /api/users/:userId/tasks - Get active tasks with filters, pagination and sorting
    static async getUserTasks(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId as string);

            if (isNaN(userId) || userId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ID',
                        message: 'User ID must be a positive number'
                    }
                });
            }

            const user = await userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }

            // Filters
            const status = req.query.status;
            const priority = req.query.priority;

            if (
                status !== undefined &&
                (typeof status !== 'string' ||
                !['pending', 'in-progress', 'completed'].includes(status))
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_STATUS',
                        message: 'Invalid status value'
                    }
                });
            }

            if (
                priority !== undefined &&
                (typeof priority !== 'string' ||
                !['low', 'medium', 'high'].includes(priority))
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PRIORITY',
                        message: 'Invalid priority value'
                    }
                });
            }

            // Pagination
            const page = req.query.page === undefined
                ? 1
                : Number(req.query.page);

            const limit = req.query.limit === undefined
                ? 10
                : Number(req.query.limit);

            if (
                !Number.isInteger(page) ||
                page <= 0 ||
                !Number.isInteger(limit) ||
                limit <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PAGINATION',
                        message: 'Page and limit must be positive integers'
                    }
                });
            }

            // Sorting
            const sortBy = req.query.sortBy === undefined
                ? 'createdAt'
                : req.query.sortBy;

            const order = req.query.order === undefined
                ? 'DESC'
                : req.query.order;

            const allowedSortFields = [
                'createdAt',
                'updatedAt',
                'title',
                'dueDate',
                'status',
                'priority'
            ];

            if (
                typeof sortBy !== 'string' ||
                !allowedSortFields.includes(sortBy)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_SORT_FIELD',
                        message: 'Invalid sortBy value'
                    }
                });
            }

            if (
                typeof order !== 'string' ||
                !['ASC', 'DESC'].includes(order.toUpperCase())
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_SORT_ORDER',
                        message: 'Order must be ASC or DESC'
                    }
                });
            }

            const sortOrder = order.toUpperCase() as 'ASC' | 'DESC';

            // Build task query
            const query = taskRepository
                .createQueryBuilder('task')
                .where('task.userId = :userId', { userId })
                .andWhere('task.isDeleted = :isDeleted', {
                    isDeleted: false
                });

            if (status) {
                query.andWhere('task.status = :status', { status });
            }

            if (priority) {
                query.andWhere('task.priority = :priority', { priority });
            }

            // Apply sorting and pagination
            const [tasks, total] = await query
                .orderBy(`task.${sortBy}`, sortOrder)
                .skip((page - 1) * limit)
                .take(limit)
                .getManyAndCount();

            const totalPages = Math.ceil(total / limit);

            return res.status(200).json({
                success: true,
                count: tasks.length,
                filters: {
                    status: status || null,
                    priority: priority || null
                },
                sorting: {
                    sortBy,
                    order: sortOrder
                },
                data: tasks,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            });

        } catch (error) {
            console.error('Error fetching tasks:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch tasks'
                }
            });
        }
    }

    // POST /api/users/:userId/tasks - Create a task for a user
    static async createTask(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId as string);

            const body: CreateTaskDto = req.body || {};

            const {
                title,
                description,
                status,
                priority,
                dueDate,
                categoryId
            } = body;

            if (isNaN(userId) || userId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ID',
                        message: 'User ID must be a positive number'
                    }
                });
            }

            // Sanitize title and description
            const sanitizedTitle = typeof title === 'string'
                ? sanitizeHtml(title)
                : '';

            const sanitizedDescription = typeof description === 'string'
                ? sanitizeHtml(description)
                : null;

            // Validate required fields after sanitization
            if (!sanitizedTitle) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_TITLE',
                        message: 'Task title is required'
                    }
                });
            }

            const user = await userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }

            // Validate status
            if (
                status &&
                !['pending', 'in-progress', 'completed'].includes(status)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_STATUS',
                        message: 'Invalid status value'
                    }
                });
            }

            // Validate priority
            if (
                priority &&
                !['low', 'medium', 'high'].includes(priority)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PRIORITY',
                        message: 'Invalid priority value'
                    }
                });
            }

            // Validate category
            let category: Category | null = null;

            if (categoryId !== undefined && categoryId !== null) {

                if (!Number.isInteger(categoryId) || categoryId <= 0) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_CATEGORY_ID',
                            message: 'Category ID must be a positive number'
                        }
                    });
                }

                category = await categoryRepository.findOne({
                    where: { id: categoryId }
                });

                if (!category) {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'CATEGORY_NOT_FOUND',
                            message: 'Category not found'
                        }
                    });
                }
            }

            // Create task using sanitized values
            const task = taskRepository.create({
                userId,
                user,
                title: sanitizedTitle,
                description: sanitizedDescription,
                status: status || 'pending',
                priority: priority || 'medium',
                dueDate: dueDate ? new Date(dueDate) : null,
                category,
                categoryId: category?.id ?? null,
                isDeleted: false
            });

            const savedTask = await taskRepository.save(task);

            return res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: savedTask
            });

        } catch (error) {
            console.error('Error creating task:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to create task'
                }
            });
        }
    }

    // DELETE /api/tasks/:id - Soft delete a task
    static async deleteTask(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);

            if (isNaN(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ID',
                        message: 'Task ID must be a positive number'
                    }
                });
            }

            const task = await taskRepository.findOne({
                where: {
                    id,
                    isDeleted: false
                }
            });

            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'TASK_NOT_FOUND',
                        message: 'Task not found'
                    }
                });
            }

            task.isDeleted = true;
            await taskRepository.save(task);

            return res.json({
                success: true,
                message: 'Task deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting task:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to delete task'
                }
            });
        }
    }

    // GET /api/users/:userId/stats - Get user task statistics
    static async getUserStats(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId as string);

            if (isNaN(userId) || userId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ID',
                        message: 'User ID must be a positive number'
                    }
                });
            }

            const user = await userRepository.findOne({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }

            const stats = await taskRepository
                .createQueryBuilder('task')
                .select('COUNT(task.id)', 'totalTasks')
                .addSelect(
                    "SUM(CASE WHEN task.status = 'completed' THEN 1 ELSE 0 END)",
                    'completedTasks'
                )
                .addSelect(
                    "SUM(CASE WHEN task.status = 'pending' THEN 1 ELSE 0 END)",
                    'pendingTasks'
                )
                .where('task.userId = :userId', { userId })
                .andWhere('task.isDeleted = :isDeleted', {
                    isDeleted: false
                })
                .getRawOne();

            return res.status(200).json({
                success: true,
                data: {
                    totalTasks: Number(stats.totalTasks),
                    completedTasks: Number(stats.completedTasks),
                    pendingTasks: Number(stats.pendingTasks)
                }
            });

        } catch (error) {
            console.error('Error fetching user statistics:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch user statistics'
                }
            });
        }
    }
}
