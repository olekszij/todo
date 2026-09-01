import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { KanbanTask } from './KanbanTypes';
import { LOCAL_STORAGE_KEY } from './KanbanTypes';

interface KanbanContextType {
    tasks: KanbanTask[];
    moveTask: (taskId: string, newColumn: 'todo' | 'in-progress' | 'done') => void;
    addTask: (task: KanbanTask) => void;
    updateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
    deleteTask: (taskId: string) => void;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export type { KanbanTask };

export const KanbanProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get([LOCAL_STORAGE_KEY], (result) => {
                if (result[LOCAL_STORAGE_KEY]) {
                    try {
                        setTasks(JSON.parse(result[LOCAL_STORAGE_KEY] as string));
                    } catch {/* ignore */}
                }
                setIsLoading(false);
            });
        } else {
            try {
                const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (stored) setTasks(JSON.parse(stored));
            } catch {/* ignore */}
            setIsLoading(false);
        }
    }, []);

    const prevTasksRef = useRef<KanbanTask[]>([]);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (isLoading) return;

        // Skip the first render to avoid overwriting storage with initial state
        if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            prevTasksRef.current = tasks;
            return;
        }

        // Check if tasks actually changed
        const tasksString = JSON.stringify(tasks);
        const prevTasksString = JSON.stringify(prevTasksRef.current);

        if (tasksString !== prevTasksString) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                chrome.storage.sync.set({ [LOCAL_STORAGE_KEY]: tasksString });
            } else {
                localStorage.setItem(LOCAL_STORAGE_KEY, tasksString);
            }
            prevTasksRef.current = tasks;
        }
    }, [tasks, isLoading]);

    const moveTask = useCallback((taskId: string, newColumn: 'todo' | 'in-progress' | 'done') => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, column: newColumn } : task
        ));
    }, []);

    const addTask = useCallback((task: KanbanTask) => {
        setTasks(prev => prev.some(t => t.id === task.id) ? prev : [...prev, task]);
    }, []);

    const updateTask = useCallback((taskId: string, updates: Partial<KanbanTask>) => {
        setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
        ));
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
    }, []);

    const contextValue = useMemo(() => ({
        tasks,
        moveTask,
        addTask,
        updateTask,
        deleteTask
    }), [tasks, moveTask, addTask, updateTask, deleteTask]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
            </div>
        );
    }

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