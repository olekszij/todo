import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type KanbanTask } from './KanbanTypes';
import { Trash2, ChevronUp, ChevronDown, AlignLeft, Calendar, CheckSquare } from 'lucide-react';
import DeleteConfirmation from './DeleteConfirmation';

interface KanbanCardProps {
  task: KanbanTask;
  columnId: 'todo' | 'in-progress' | 'done';
  isMobile: boolean;
  pendingDeleteId: string | null;
  onMove: (taskId: string, newColumn: 'todo' | 'in-progress' | 'done') => void;
  onDeleteRequest: (taskId: string) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onClick: (task: KanbanTask) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  columnId,
  isMobile,
  pendingDeleteId,
  onMove,
  onDeleteRequest,
  onConfirmDelete,
  onCancelDelete,
  onClick
}) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-3 sm:p-4 rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-600 h-24"
      />
    );
  }

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const isOverdue = task.dueDate && task.dueDate < Date.now() && columnId !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group border border-slate-200/50 dark:border-slate-700/50 cursor-grab active:cursor-grabbing relative"
    >
      <div className="flex flex-col gap-2 pointer-events-none">
        
        {/* Priority Badge */}
        {task.priority && (
          <div className="flex justify-between items-start">
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
              task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300'
            }`}>
              {task.priority} Priority
            </span>
          </div>
        )}

        <p className={`text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 break-words leading-tight ${columnId === 'done' ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
          {task.text}
        </p>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {task.description && (
            <span className="text-slate-400 dark:text-slate-500" title="Has description">
              <AlignLeft className="w-3.5 h-3.5" />
            </span>
          )}
          
          {totalSubtasks > 0 && (
            <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md ${
              completedSubtasks === totalSubtasks 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            }`}>
              <CheckSquare className="w-3 h-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md ${
              isOverdue
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons Container - Allows clicking without dragging */}
      <div 
        className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50"
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag when interacting with buttons
      >
        <div className="flex items-center gap-1">
          {/* Mobile Navigation Arrows */}
          {isMobile && (
            <div className="flex gap-1">
              {columnId === 'todo' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMove(task.id, 'in-progress'); }}
                  className="text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                >
                  <ChevronDown className="w-3.5 h-3.5 stroke-2" />
                </button>
              )}
              {columnId === 'in-progress' && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMove(task.id, 'todo'); }}
                    className="text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  >
                    <ChevronUp className="w-3.5 h-3.5 stroke-2" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMove(task.id, 'done'); }}
                    className="text-slate-400 hover:text-emerald-500 p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
                  >
                    <ChevronDown className="w-3.5 h-3.5 stroke-2" />
                  </button>
                </>
              )}
              {columnId === 'done' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMove(task.id, 'in-progress'); }}
                  className="text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                >
                  <ChevronUp className="w-3.5 h-3.5 stroke-2" />
                </button>
              )}
            </div>
          )}
        </div>

        {pendingDeleteId === task.id ? (
          <div onClick={(e) => e.stopPropagation()}>
            <DeleteConfirmation
              isVisible={true}
              onConfirm={onConfirmDelete}
              onCancel={onCancelDelete}
            />
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(task.id);
            }}
            className="text-slate-400 hover:text-red-500 p-1.5 transition-colors opacity-0 group-hover:opacity-100 group-focus:opacity-100 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
