
import { DataSource, Repository } from 'typeorm';
import { Task } from '../entities/Task';

export class TaskRepository extends Repository<Task> {

    constructor(dataSource: DataSource) {
        super(Task, dataSource.createEntityManager());
    }

    // Find tasks that are overdue and not completed
    async findOverdueTasks(): Promise<Task[]> {
        return this.createQueryBuilder('task')
            .where('task.dueDate < CURDATE()')
            .andWhere('task.status != :status', {
                status: 'completed'
            })
            .andWhere('task.isDeleted = :isDeleted', {
                isDeleted: false
            })
            .orderBy('task.dueDate', 'ASC')
            .getMany();
    }
}
