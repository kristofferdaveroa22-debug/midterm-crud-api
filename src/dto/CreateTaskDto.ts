
export interface CreateTaskDto {
    title: string;
    description?: string | null;
    status?: 'pending' | 'in-progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string | null;
    categoryId?: number | null;
}
