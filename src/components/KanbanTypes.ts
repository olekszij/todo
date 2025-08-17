export interface KanbanTask {
    id: string;
    text: string;
    column: 'todo' | 'in-progress' | 'done';
    createdAt: number;
    // Challenge specific fields
    description?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: string;
    time?: string;
    xp?: number;
    isChallenge?: boolean;
}

export const LOCAL_STORAGE_KEY = 'kanban-tasks'; 