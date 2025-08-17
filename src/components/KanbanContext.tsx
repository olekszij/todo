import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { KanbanTask } from './KanbanTypes';
import { LOCAL_STORAGE_KEY } from './KanbanTypes';

interface KanbanContextType {
    tasks: KanbanTask[];
    moveTask: (taskId: string, newColumn: 'todo' | 'in-progress' | 'done') => void;
    addTask: (task: KanbanTask) => void;
    deleteTask: (taskId: string) => void;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export type { KanbanTask };

export const KanbanProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<KanbanTask[]>(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch {/* ignore */ }
        return [];
    });

    const prevTasksRef = useRef<KanbanTask[]>([]);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        // Skip the first render to avoid overwriting localStorage with initial state
        if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            prevTasksRef.current = tasks;
            return;
        }

        // Check if tasks actually changed
        const tasksString = JSON.stringify(tasks);
        const prevTasksString = JSON.stringify(prevTasksRef.current);

        if (tasksString !== prevTasksString) {
            localStorage.setItem(LOCAL_STORAGE_KEY, tasksString);
            prevTasksRef.current = tasks;
        }
    }, [tasks]);

    const moveTask = useCallback((taskId: string, newColumn: 'todo' | 'in-progress' | 'done') => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, column: newColumn } : task
        ));
    }, []);

    const addTask = useCallback((task: KanbanTask) => {
        setTasks(prev => prev.some(t => t.id === task.id) ? prev : [...prev, task]);
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
    }, []);

    const contextValue = useMemo(() => ({
        tasks,
        moveTask,
        addTask,
        deleteTask
    }), [tasks, moveTask, addTask, deleteTask]);

    return (
        <KanbanContext.Provider value={contextValue}>
            {children}
        </KanbanContext.Provider>
    );
};

export function useKanban() {
    const ctx = useContext(KanbanContext);
    if (!ctx) throw new Error('useKanban must be used within KanbanProvider');
    return ctx;
} 