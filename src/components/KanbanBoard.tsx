import React, { useState, useCallback } from 'react';
import { useKanban, type KanbanTask } from './KanbanContext';
import { Trash2, Plus, ChevronUp, ChevronDown, Sparkles, Gem, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DeleteConfirmation from './DeleteConfirmation';
import { getRandomChallenge } from '../lib/challenges';
import { useTheme } from './ThemeContext';


// Helper to generate a unique id
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const KanbanBoard: React.FC = () => {
  const { tasks, moveTask, addTask, deleteTask } = useKanban();
  const { theme, toggleTheme } = useTheme();

  const [inputValue, setInputValue] = useState('');
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(() => {
    const saved = localStorage.getItem('userGems');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  // Function to update gems and save to localStorage
  const updateUserGems = useCallback((newAmount: number) => {
    setUserCoins(newAmount);
    localStorage.setItem('userGems', newAmount.toString());
  }, []);


  
  // Swipe gesture state
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);
  const [swipeTask, setSwipeTask] = useState<KanbanTask | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

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

  const handleGenerateChallenge = useCallback(() => {
    const randomChallenge = getRandomChallenge();
    const newTask: KanbanTask = {
      id: generateId(),
      text: randomChallenge.title,
      column: 'todo',
      createdAt: Date.now(),
      description: randomChallenge.description,
      difficulty: randomChallenge.difficulty,
      category: randomChallenge.category,
      time: randomChallenge.time,
      xp: randomChallenge.xp,
      isChallenge: true,
    };

    addTask(newTask);
  }, [addTask]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  }, [handleAddTask]);

  const handleDeleteTask = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteTask(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, deleteTask]);

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const handleMoveTask = useCallback((taskId: string, newColumn: 'todo' | 'in-progress' | 'done') => {
    const task = tasks.find(t => t.id === taskId);
    
    // Add gems when moving challenge to "In Progress"
    if (task && task.isChallenge && newColumn === 'in-progress' && task.column === 'todo') {
      const gemsToAdd = task.xp || 10; // Use XP value as gems, default to 10
      const newTotal = userCoins + gemsToAdd;
      updateUserGems(newTotal);
      
      // Show coin animation
      setShowCoinAnimation(true);
      setTimeout(() => setShowCoinAnimation(false), 1000);
    }
    
    moveTask(taskId, newColumn);
  }, [moveTask, tasks, userCoins, updateUserGems]);

  const getTasksByColumn = useCallback((column: 'todo' | 'in-progress' | 'done') => {
    return tasks.filter(task => task.column === column);
  }, [tasks]);

  // Swipe gesture handlers
  const handleSwipeStart = useCallback((e: React.TouchEvent, task: KanbanTask) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipeStartY(e.touches[0].clientY);
    setSwipeTask(task);
  }, []);

  const handleSwipeMove = useCallback((e: React.TouchEvent) => {
    if (!swipeStartX || !swipeStartY || !swipeTask) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const deltaX = currentX - swipeStartX;
    const deltaY = currentY - swipeStartY;
    
    // Only process horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;
    
    // Prevent default scrolling during horizontal swipe
    e.preventDefault();
    
    // Show swipe direction indicator
    if (deltaX > 20) {
      setSwipeDirection('right');
    } else if (deltaX < -20) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  }, [swipeStartX, swipeStartY, swipeTask]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStartX || !swipeStartY || !swipeTask) return;
    
    const currentX = e.changedTouches[0].clientX;
    const deltaX = currentX - swipeStartX;
    const minSwipeDistance = 80; // Minimum distance for swipe to be recognized
    
    if (Math.abs(deltaX) >= minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right
        if (swipeTask.column === 'todo') {
          // Move to In Progress
          handleMoveTask(swipeTask.id, 'in-progress');
        } else if (swipeTask.column === 'in-progress') {
          // Move to Done
          handleMoveTask(swipeTask.id, 'done');
        } else if (swipeTask.column === 'done') {
          // Delete completed task
          handleDeleteTask(swipeTask.id);
        }
      } else {
        // Swipe left
        if (swipeTask.column === 'todo') {
          // Show delete confirmation
          handleDeleteTask(swipeTask.id);
        } else if (swipeTask.column === 'in-progress') {
          // Move to Todo
          handleMoveTask(swipeTask.id, 'todo');
        } else if (swipeTask.column === 'done') {
          // Move back to In Progress
          handleMoveTask(swipeTask.id, 'in-progress');
        }
      }
    }
    
    // Reset swipe state
    setSwipeStartX(null);
    setSwipeStartY(null);
    setSwipeTask(null);
    setSwipeDirection(null);
  }, [swipeStartX, swipeStartY, swipeTask, handleMoveTask, handleDeleteTask]);

  // Fixed Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, task: KanbanTask) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
    }

    setDraggedTask(task);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  }, [dragOverColumn]);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();

    let taskId = '';
    if (e.dataTransfer) {
      taskId = e.dataTransfer.getData('text/plain');
    }

    if (taskId && columnId) {
      handleMoveTask(taskId, columnId as 'todo' | 'in-progress' | 'done');
    }

    setDraggedTask(null);
    setDragOverColumn(null);
  }, [handleMoveTask]);





  const columns = [
    { id: 'todo', title: 'Challenges', color: 'bg-gradient-to-br from-blue-100/90 via-indigo-100/80 to-purple-100/90 dark:from-blue-800/40 dark:via-indigo-800/30 dark:to-purple-800/40 border border-blue-300/60 dark:border-blue-600/50' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-gradient-to-br from-amber-100/90 via-orange-100/80 to-red-100/90 dark:from-blue-800/40 dark:via-indigo-800/30 dark:to-purple-800/40 border border-amber-300/60 dark:border-blue-600/50' },
    { id: 'done', title: 'Completed', color: 'bg-gradient-to-br from-emerald-100/90 via-green-100/80 to-teal-100/90 dark:from-blue-800/40 dark:via-indigo-800/30 dark:to-purple-800/40 border border-emerald-300/60 dark:border-blue-600/50' }
  ] as const;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 transition-all duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="py-4 sm:py-6 lg:py-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Header with gems counter and theme toggle */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              {/* Left side - theme toggle */}
              <motion.button
                onClick={toggleTheme}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/20 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === 'light' ? 0 : 180 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {theme === 'light' ? (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors duration-300" />
                  ) : (
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200 group-hover:text-amber-400 transition-colors duration-300" />
                  )}
                </motion.div>
              </motion.button>
              
              {/* Center - title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent tracking-tight">
                  ChallengeBoard
                </h1>
              </motion.div>
              
              {/* Right side - gems counter and add button */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Add challenge button */}
                <motion.button
                  onClick={() => setIsAddingTask(true)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/20 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Add New Challenge"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </motion.button>
                
                {/* Gems counter */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-center gap-1.5 sm:gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-full shadow-md border border-white/20 dark:border-slate-700/30"
                >
                  <motion.div
                    animate={showCoinAnimation ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <Gem className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  </motion.div>
                  <motion.span 
                    className="font-bold text-sm sm:text-lg text-slate-800 dark:text-slate-200"
                    animate={showCoinAnimation ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    {userCoins}
                  </motion.span>
                </motion.div>
              </div>
            </div>
            
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto">
                Every challenge is a step forward.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Add Task Form - Global */}
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
                    placeholder="What challenge do you want to take on?"
                    className="w-full p-3 sm:p-4 bg-slate-50/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all duration-300 border border-slate-200/50 dark:border-slate-600/50 focus:border-blue-400 dark:focus:border-blue-500 shadow-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-medium text-sm sm:text-base"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={handleAddTask}
                    className="w-12 h-12 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm text-blue-600 dark:text-blue-400 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/30 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-800/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Add Task"
                  >
                    <Plus className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    onClick={handleGenerateChallenge}
                    className="w-12 h-12 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm text-purple-600 dark:text-purple-400 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/30 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-800/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Generate Random Challenge"
                  >
                    <Sparkles className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setIsAddingTask(false);
                      setInputValue('');
                    }}
                    className="w-12 h-12 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm text-slate-600 dark:text-slate-400 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-white/30 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-800/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Cancel"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban Columns with Drag & Drop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 items-start">
          {columns.map((column, index) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${column.color} rounded-xl p-3 sm:p-4 lg:p-5 min-h-[150px] sm:min-h-[180px] h-fit transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm`}
              data-column-id={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              whileHover={{ scale: dragOverColumn === column.id ? 1.02 : 1 }}
            >
              <h2 className="font-semibold text-lg sm:text-xl lg:text-2xl mb-3 text-center py-2 text-slate-800 dark:text-slate-200 transition-colors duration-300">
                {column.title}
                <span className="block text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 opacity-80">
                  {column.id === 'todo' ? 
                    `${getTasksByColumn(column.id).filter(task => task.isChallenge).length} challenges, ${getTasksByColumn(column.id).length} total` :
                    `${getTasksByColumn(column.id).length} tasks`
                  }
                </span>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-normal md:hidden transition-colors duration-300">
                  {column.id === 'todo' ? 'Swipe → to progress, ← to delete' :
                   column.id === 'in-progress' ? 'Swipe → to complete, ← to return' :
                   'Swipe → to delete, ← to return'}
                </div>
              </h2>

              <div className="space-y-2 sm:space-y-3">
                <AnimatePresence>
                  {getTasksByColumn(column.id).map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 group border border-white/20 dark:border-slate-700/50 ${draggedTask?.id === task.id ? 'opacity-50 scale-95' : ''}`}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.98 }}

                      onTouchStart={(e) => handleSwipeStart(e, task)}
                      onTouchMove={handleSwipeMove}
                      onTouchEnd={handleSwipeEnd}
                    >
                      {/* Swipe direction indicator */}
                      {swipeTask?.id === task.id && swipeDirection && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 backdrop-blur-sm rounded-lg ${
                            swipeDirection === 'right' ? 'bg-green-500/30' : 'bg-red-500/30'
                          }`}
                        >
                          <div className={`text-4xl sm:text-5xl font-black drop-shadow-lg ${
                            swipeDirection === 'right' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                          }`}>
                            {swipeDirection === 'right' ? '→' : '←'}
                          </div>
                        </motion.div>
                      )}
                      
                      <div
                        draggable
                        onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className="w-full h-full relative"
                      >
                        <div className="flex flex-col gap-2">
                          <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 break-words transition-colors duration-300 leading-tight">
                            {task.text}
                          </p>

                          {/* Challenge details */}
                          {task.isChallenge && (
                            <div className="space-y-1">
                              {task.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-1">
                                {task.difficulty && (
                                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                    task.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                    task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  }`}>
                                    {task.difficulty}
                                  </span>
                                )}
                                
                                {task.category && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                    {task.category}
                                  </span>
                                )}
                                
                                {task.time && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-sky-800 dark:bg-purple-900/30 dark:text-yellow-300 rounded-full">
                                    {task.time}
                                  </span>
                                )}
                                
                                {task.xp && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full flex items-center gap-1">
                                    <Gem className="w-3 h-3" />
                                    {task.xp} gems
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1">
                              {/* Empty space for balance */}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {/* Mobile Navigation Arrows */}
                              <div className="flex gap-1 md:hidden">
                                {column.id === 'todo' && (
                                                                  <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveTask(task.id, 'in-progress');
                                  }}
                                  className="text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                                >
                                  <ChevronDown className="w-3 h-3 stroke-2" />
                                </motion.button>
                                )}
                                {column.id === 'in-progress' && (
                                  <>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveTask(task.id, 'todo');
                                      }}
                                      className="text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                                    >
                                      <ChevronUp className="w-3 h-3 stroke-2" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveTask(task.id, 'done');
                                      }}
                                      className="text-slate-400 hover:text-green-500 p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                                    >
                                      <ChevronDown className="w-3 h-3 stroke-2" />
                                    </motion.button>
                                  </>
                                )}
                                {column.id === 'done' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveTask(task.id, 'in-progress');
                                    }}
                                    className="text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                                  >
                                    <ChevronUp className="w-3 h-3 stroke-2" />
                                  </motion.button>
                                )}
                              </div>

                              {pendingDeleteId === task.id ? (
                                <DeleteConfirmation
                                  isVisible={true}
                                  onConfirm={confirmDelete}
                                  onCancel={cancelDelete}
                                />
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.05, backgroundColor: '#ef4444', color: '#fff' }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {/* Remove modal window, now using inline confirmation */}
      </AnimatePresence>
    </div>
  );
};

export default KanbanBoard; 