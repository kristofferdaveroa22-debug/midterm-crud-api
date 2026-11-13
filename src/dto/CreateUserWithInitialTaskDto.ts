import { CreateUserDto } from './CreateUserDto';
import { CreateTaskDto } from './CreateTaskDto';

export interface CreateUserWithInitialTaskDto {
    user: CreateUserDto;
    initialTask: CreateTaskDto;
}