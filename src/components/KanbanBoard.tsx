import React, { useState, useCallback, useEffect } from 'react';
import { useKanban, type KanbanTask } from './KanbanContext';
import { Plus, Sun, Moon, Lock, X, Download, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthGuard';
import { KanbanCard } from './KanbanCard';
import { TaskDetailsModal } from './TaskDetailsModal';
import { InstallPrompt } from './InstallPrompt';
import {
  DndContext,

  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Helper to generate a unique id
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Helper to render the column wrapper so it can be a drop target when empty
const DroppableColumn: React.FC<{
  id: string;
  title: string;
  color: string;
  taskCount: number;
  children: React.ReactNode;
}> = ({ id, title, color, taskCount, children }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: { type: 'Column', column: id }
  });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${color} rounded-xl p-3 sm:p-4 lg:p-5 min-h-[150px] sm:min-h-[180px] h-fit transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm`}
    >
      <h2 className="font-semibold text-lg sm:text-xl lg:text-2xl mb-3 text-center py-2 text-slate-800 dark:text-slate-200 transition-colors duration-300">
        {title}
        <span className="block text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 opacity-80">
          {`${taskCount} tasks`}
        </span>
      </h2>
      <div className="space-y-2 sm:space-y-3 min-h-[100px]">
        {children}
      </div>
    </motion.div>
  );
};

const KanbanBoard: React.FC = () => {
  const { tasks, moveTask, addTask, updateTask, deleteTask, importTasks, markBackupComplete } = useKanban();
  const { theme, toggleTheme } = useTheme();
  const { lockBoard } = useAuth();

  const [inputValue, setInputValue] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleAddTask = useCallback(() => {
    if (inputValue.trim() !== '') {
      const newTask: KanbanTask = {
        id: generateId(),
        text: inputValue,
        column: 'todo',
        createdAt: Date.now(),
      };
      addTask(newTask);
      setInputValue('');
      setIsAddingTask(false);
    }
  }, [inputValue, addTask]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddTask();
  }, [handleAddTask]);

  const getTasksByColumn = useCallback((column: 'todo' | 'in-progress' | 'done') => {
    return tasks.filter(task => task.column === column);
  }, [tasks]);

  const handleExport = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "kanban_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    markBackupComplete();
  }, [tasks, markBackupComplete]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedTasks)) {
            importTasks(importedTasks);
        } else {
            alert("Неверный формат файла бэкапа. Ожидался массив задач.");
        }
      } catch (err) {
        console.error("Failed to parse backup file", err);
        alert("Ошибка при импорте: файл не является валидным JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id as string;
    
    const isOverColumn = over.data.current?.type === 'Column';
    const isOverTask = over.data.current?.type === 'Task';

    let targetColumn: 'todo' | 'in-progress' | 'done' | undefined;

    if (isOverColumn) {
      targetColumn = over.id as 'todo' | 'in-progress' | 'done';
    } else if (isOverTask) {
      targetColumn = over.data.current?.task?.column;
    }

    if (targetColumn) {
      moveTask(activeId, targetColumn);
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gradient-to-br from-blue-100/90 via-indigo-100/80 to-purple-100/90 dark:from-blue-800/40 dark:via-indigo-800/30 dark:to-purple-800/40 border border-blue-300/60 dark:border-blue-600/50' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-gradient-to-br from-amber-100/90 via-orange-100/80 to-red-100/90 dark:from-blue-800/40 dark:via-indigo-800/30 dark:to-purple-800/40 border border-amber-300/60 dark:border-blue-600/50' },
    { id: 'done', title: 'Completed', color: 'bg-gradient-to-br from-emerald-100/90 via-green-100/80 to-teal-100/90 dark:from-blue-800/40 dark:via-indigo-800/30 dark:to-purple-800/40 border border-emerald-300/60 dark:border-blue-600/50' }
  ] as const;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 transition-all duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="py-4 sm:py-6 lg:py-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Header with theme toggle */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <motion.button
                onClick={toggleTheme}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/20 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                <motion.div initial={false} animate={{ rotate: theme === 'light' ? 0 : 180 }} transition={{ duration: 0.5 }}>
                  {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200 group-hover:text-amber-400" />}
                </motion.div>
              </motion.button>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex-1">
                <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent tracking-tight">
                  Taskflow
                </h1>
              </motion.div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  className="hidden" 
                />
                <motion.button
                  onClick={handleImportClick}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/20 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Import Backup"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                </motion.button>
                <motion.button
                  onClick={handleExport}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/20 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Export Backup"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                </motion.button>
                <motion.button
                  onClick={lockBoard}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/20 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Lock Board"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200" />
                </motion.button>
                <motion.button
                  onClick={() => setIsAddingTask(true)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/20 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Add New Task"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </motion.button>
              </div>
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto">
                Organize your personal workflow.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Add Task Form */}
        <AnimatePresence>
          {isAddingTask && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="max-w-md mx-auto mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-xl border border-white/30 dark:border-slate-700/50 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="What task do you want to add?"
                    className="w-full p-3 sm:p-4 bg-slate-50/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all duration-300 border border-slate-200/50 dark:border-slate-600/50 focus:border-blue-400 dark:focus:border-blue-500 shadow-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-medium text-sm sm:text-base"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 justify-center">
                  <motion.button onClick={handleAddTask} className="w-12 h-12 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm text-blue-600 dark:text-blue-400 rounded-full shadow-md border border-white/30 hover:bg-white/30 flex justify-center items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Plus className="w-6 h-6" />
                  </motion.button>
                  <motion.button onClick={() => { setIsAddingTask(false); setInputValue(''); }} className="w-12 h-12 bg-white/20 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400 rounded-full shadow-md border border-white/30 hover:bg-white/30 flex justify-center items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DND Kit Context */}
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 items-start">
            {columns.map((column) => {
              const columnTasks = getTasksByColumn(column.id as any);
              
              return (
                <DroppableColumn 
                  key={column.id} 
                  id={column.id} 
                  title={column.title} 
                  color={column.color} 
                  taskCount={columnTasks.length}
                >
                  <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {columnTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        columnId={column.id as any}
                        isMobile={isMobile}
                        pendingDeleteId={pendingDeleteId}
                        onMove={moveTask}
                        onDeleteRequest={setPendingDeleteId}
                        onConfirmDelete={() => { if(pendingDeleteId) { deleteTask(pendingDeleteId); setPendingDeleteId(null); } }}
                        onCancelDelete={() => setPendingDeleteId(null)}
                        onClick={setSelectedTask}
                      />
                    ))}
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 opacity-90 scale-105">
                <KanbanCard
                  task={activeTask}
                  columnId={activeTask.column}
                  isMobile={isMobile}
                  pendingDeleteId={null}
                  onMove={() => {}}
                  onDeleteRequest={() => {}}
                  onConfirmDelete={() => {}}
                  onCancelDelete={() => {}}
                  onClick={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            isOpen={true}
            onClose={() => setSelectedTask(null)}
            onSave={updateTask}
          />
        )}
      </AnimatePresence>

      <InstallPrompt />
    </div>
  );
};

export default KanbanBoard;