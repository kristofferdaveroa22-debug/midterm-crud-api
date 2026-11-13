
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';

const userRepository = AppDataSource.getRepository(User);

export class AuthController {

    // POST /api/auth/login - Login user
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body || {};

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'Email and password are required'
                    }
                });
            }

            // Find user and explicitly retrieve hashed password
            const user = await userRepository
                .createQueryBuilder('user')
                .addSelect('user.password')
                .where('user.email = :email', { email })
                .getOne();

            // Check if user exists
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password'
                    }
                });
            }

            // Compare entered password with hashed password
            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Invalid email or password'
                    }
                });
            }

            // Remove password before returning user data
            const { password: _, ...userWithoutPassword } = user;

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: userWithoutPassword
            });

        } catch (error) {
            console.error('Error logging in:', error);

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to login'
                }
            });
        }
    }
}
