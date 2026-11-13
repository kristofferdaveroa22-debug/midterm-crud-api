
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany,
    JoinColumn,
    JoinTable,
    Index
} from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { Tag } from './Tag';

@Entity('tasks')
@Index(['userId'])
export class Task {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 200 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({
        type: 'enum',
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    })
    status!: 'pending' | 'in-progress' | 'completed';

    @Column({
        type: 'enum',
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    })
    priority!: 'low' | 'medium' | 'high';

    @Column({ type: 'date', nullable: true })
    dueDate!: Date | null;

    @Column({ type: 'boolean', default: false })
    isDeleted!: boolean;

    @ManyToOne(() => User, user => user.tasks, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'userId' })
    user!: User | null;

    @Column({ type: 'int', nullable: true })
    userId!: number | null;

    @ManyToOne(() => Category, category => category.tasks, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'categoryId' })
    category!: Category | null;

    @Column({ type: 'int', nullable: true })
    categoryId!: number | null;

    // Many-to-Many relationship with Tag
    @ManyToMany(() => Tag, tag => tag.tasks)
    @JoinTable({
        name: 'task_tags'
    })
    tags!: Tag[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Virtual / Computed Property
    get isOverdue(): boolean {
        if (!this.dueDate || this.status === 'completed') {
            return false;
        }

        const dueDate = new Date(this.dueDate);
        const today = new Date();

        const dueDateString = dueDate.toISOString().slice(0, 10);
        const todayString = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0')
        ].join('-');

        return dueDateString < todayString;
    }

    // Include virtual property in JSON response
    toJSON() {
        return {
            ...this,
            isOverdue: this.isOverdue
        };
    }
}
