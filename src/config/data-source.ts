
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Task } from '../entities/Task';
import * as dotenv from 'dotenv';
import path from 'path';
import { Category } from '../entities/Category';
import { Tag } from '../entities/Tag';

dotenv.config();


export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    entities: [User, Task, Category, Tag],

    // Always disabled in every environment
    synchronize: false,

    // Disabled in production, enabled in development
    logging: process.env.NODE_ENV === 'production' ? false : true,

    migrations: [
        path.join(__dirname, '../*-*.{ts,js}'),
        path.join(__dirname, '../migrations/*.{ts,js}')
    ],
});
