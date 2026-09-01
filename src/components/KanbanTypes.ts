export interface KanbanTask {
    id: string;
    text: string;
    column: 'todo' | 'in-progress' | 'done';
    createdAt: number;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: number;
    subtasks?: { id: string; text: string; completed: boolean }[];
}

export const LOCAL_STORAGE_KEY = 'kanban-tasks'; 