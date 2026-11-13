
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import { Category } from '../entities/Category';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/CreateUserDto';
import { UpdateUserDto } from '../dto/UpdateUserDto';
import { CreateUserWithInitialTaskDto } from '../dto/CreateUserWithInitialTaskDto';

const userRepository = AppDataSource.getRepository(User);

export class UserController {

    // GET /api/users - Get all users
    static async getAll(req: Request, res: Response) {
        try {
            const users = await userRepository.find({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            return res.json({
                success: true,
                count: users.length,
                data: users
            });

        } catch (error) {
            console.error('Error fetching users:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch users'
                }
            });
        }
    }

    // GET /api/users/:id - Get user by ID
    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ID',
                        message: 'User ID must be a number'
                    }
                });
            }

            const user = await userRepository.findOne({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true
                },
                relations: { tasks: true }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: `User with ID ${id} does not exist`
                    }
                });
            }

            return res.json({
                success: true,
                data: user
            });

        } catch (error) {
            console.error('Error fetching user:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch user'
                }
            });
        }
    }

    // POST /api/users - Create a new user
    static async create(req: Request, res: Response) {
        try {
            const body: CreateUserDto = req.body || {};

            const {
                name,
                email,
                password,
                phoneNumber
            } = body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'Name, email, and password are required'
                    }
                });
            }

            const existingUser = await userRepository.findOne({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'EMAIL_EXISTS',
                        message: 'A user with this email already exists'
                    }
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = userRepository.create({
                name,
                email,
                password: hashedPassword,
                phoneNumber: phoneNumber ?? null
            });

            const savedUser = await userRepository.save(user);

            const { password: _, ...userWithoutPassword } = savedUser;

            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: userWithoutPassword
            });

        } catch (error) {
            console.error('Error creating user:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to create user'
                }
            });
        }
    }

    // POST /api/users/with-initial-task - Create User and Task using Transaction
    static async createUserWithInitialTask(req: Request, res: Response) {
        try {
            const body: CreateUserWithInitialTaskDto = req.body || {};
            const { user: userData, initialTask } = body;

            // Validate user fields
            if (
                !userData?.name ||
                !userData?.email ||
                !userData?.password
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_USER_FIELDS',
                        message: 'Name, email, and password are required'
                    }
                });
            }

            // Validate initial task
            if (!initialTask?.title) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_TASK_FIELDS',
                        message: 'Initial task title is required'
                    }
                });
            }

            if (
                initialTask.status &&
                !['pending', 'in-progress', 'completed'].includes(initialTask.status)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_STATUS',
                        message: 'Invalid task status'
                    }
                });
            }

            if (
                initialTask.priority &&
                !['low', 'medium', 'high'].includes(initialTask.priority)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PRIORITY',
                        message: 'Invalid task priority'
                    }
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Execute both database operations in one transaction
            const result = await AppDataSource.transaction(async (manager) => {

                const userRepo = manager.getRepository(User);
                const taskRepo = manager.getRepository(Task);
                const categoryRepo = manager.getRepository(Category);

                // Check duplicate email
                const existingUser = await userRepo.findOne({
                    where: { email: userData.email }
                });

                if (existingUser) {
                    throw new Error('EMAIL_ALREADY_EXISTS');
                }

                // Find category if categoryId was provided
                let category: Category | null = null;

                if (
                    initialTask.categoryId !== undefined &&
                    initialTask.categoryId !== null
                ) {
                    if (
                        !Number.isInteger(initialTask.categoryId) ||
                        initialTask.categoryId <= 0
                    ) {
                        throw new Error('INVALID_CATEGORY_ID');
                    }

                    category = await categoryRepo.findOne({
                        where: { id: initialTask.categoryId }
                    });

                    if (!category) {
                        throw new Error('CATEGORY_NOT_FOUND');
                    }
                }

                // Create User
                const newUser = userRepo.create({
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    phoneNumber: userData.phoneNumber ?? null
                });

                const savedUser = await userRepo.save(newUser);

                // Create initial Task connected to the new User
                const newTask = taskRepo.create({
                    title: initialTask.title,
                    description: initialTask.description ?? null,
                    status: initialTask.status || 'pending',
                    priority: initialTask.priority || 'medium',
                    dueDate: initialTask.dueDate
                        ? new Date(initialTask.dueDate)
                        : null,
                    user: savedUser,
                    userId: savedUser.id,
                    category,
                    categoryId: category?.id ?? null,
                    isDeleted: false
                });

                const savedTask = await taskRepo.save(newTask);

                return {
                    user: savedUser,
                    task: savedTask
                };
            });

            // Remove password from response
            const { password: _, ...userWithoutPassword } = result.user;

            return res.status(201).json({
                success: true,
                message: 'User and initial task created successfully',
                data: {
                    user: userWithoutPassword,
                    task: result.task
                }
            });

        } catch (error: any) {
            console.error('Error creating user with initial task:', error);

            if (error.message === 'EMAIL_ALREADY_EXISTS') {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'EMAIL_ALREADY_EXISTS',
                        message: 'Email already exists'
                    }
                });
            }

            if (error.message === 'CATEGORY_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'CATEGORY_NOT_FOUND',
                        message: 'Category not found'
                    }
                });
            }

            if (error.message === 'INVALID_CATEGORY_ID') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_CATEGORY_ID',
                        message: 'Category ID must be a positive integer'
                    }
                });
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to create user and initial task'
                }
            });
        }
    }

    // PUT /api/users/:id - Update a user
    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ID',
                        message: 'User ID must be a number'
                    }
                });
            }

            const user = await userRepository.findOne({
                where: { id }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: `User with ID ${id} does not exist`
                    }
                });
            }

            const body: UpdateUserDto = req.body || {};

            const {
                name,
                email,
                password,
                phoneNumber,
                isActive
            } = body;

            if (email && email !== user.email) {
                const existingUser = await userRepository.findOne({
                    where: { email }
                });

                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        error: {
                            code: 'EMAIL_EXISTS',
                            message: 'A user with this email already exists'
                        }
                    });
                }
            }

            if (name !== undefined) user.name = name;
            if (email !== undefined) user.email = email;
            if (phoneNumber !== undefined) {
                user.phoneNumber = phoneNumber;
            }
            if (isActive !== undefined) user.isActive = isActive;

            if (password !== undefined && password !== '') {
                user.password = await bcrypt.hash(password, 10);
            }

            const updatedUser = await userRepository.save(user);

            const { password: _, ...userWithoutPassword } = updatedUser;

            return res.json({
                success: true,
                message: 'User updated successfully',
                data: userWithoutPassword
            });

        } catch (error) {
            console.error('Error updating user:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to update user'
                }
            });
        }
    }

    // DELETE /api/users/:id - Delete a user
    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string, 10);

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_ID',
                        message: 'User ID must be a number'
                    }
                });
            }

            const user = await userRepository.findOne({
                where: { id }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: `User with ID ${id} does not exist`
                    }
                });
            }

            await userRepository.remove(user);

            return res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting user:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to delete user'
                }
            });
        }
    }
}
