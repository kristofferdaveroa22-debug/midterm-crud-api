
import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import { Category } from '../entities/Category';
import bcrypt from 'bcrypt';

async function seed() {
    try {
        await AppDataSource.initialize();

        console.log('Database connected. Starting seeder...');

        const userRepository = AppDataSource.getRepository(User);
        const taskRepository = AppDataSource.getRepository(Task);
        const categoryRepository = AppDataSource.getRepository(Category);

        // 5 dummy users
        const dummyUsers = [
            { name: 'John Doe', email: 'john.seed@example.com', phoneNumber: '09171234567' },
            { name: 'Jane Smith', email: 'jane.seed@example.com', phoneNumber: '09181234567' },
            { name: 'Mark Wilson', email: 'mark.seed@example.com', phoneNumber: '09191234567' },
            { name: 'Sarah Brown', email: 'sarah.seed@example.com', phoneNumber: '09201234567' },
            { name: 'Alex Garcia', email: 'alex.seed@example.com', phoneNumber: '09211234567' }
        ];

        const categories = await categoryRepository.find();

        const taskTemplates = [
            {
                title: 'Complete project documentation',
                description: 'Prepare the project documentation',
                status: 'pending' as const,
                priority: 'high' as const
            },
            {
                title: 'Review assignment',
                description: 'Review and finalize school assignment',
                status: 'in-progress' as const,
                priority: 'medium' as const
            },
            {
                title: 'Submit weekly report',
                description: 'Submit the weekly progress report',
                status: 'completed' as const,
                priority: 'low' as const
            }
        ];

        const hashedPassword = await bcrypt.hash('Password123!', 10);

        let usersCreated = 0;
        let tasksCreated = 0;

        for (const userData of dummyUsers) {
            let user = await userRepository.findOneBy({
                email: userData.email
            });

            if (!user) {
                user = userRepository.create({
                    ...userData,
                    password: hashedPassword
                });

                user = await userRepository.save(user);
                usersCreated++;
            }

            // Create 3 tasks for each user
            for (let i = 0; i < taskTemplates.length; i++) {
                const template = taskTemplates[i];

                const existingTask = await taskRepository.findOneBy({
                    userId: user.id,
                    title: template.title
                });

                if (!existingTask) {
                    const category = categories.length > 0
                        ? categories[i % categories.length]
                        : null;

                    const task = taskRepository.create({
                        ...template,
                        userId: user.id,
                        user,
                        categoryId: category?.id ?? null,
                        category,
                        dueDate: null,
                        isDeleted: false
                    });

                    await taskRepository.save(task);
                    tasksCreated++;
                }
            }
        }

        console.log('Seeding completed successfully!');
        console.log(`Users created: ${usersCreated}`);
        console.log(`Tasks created: ${tasksCreated}`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

seed();
