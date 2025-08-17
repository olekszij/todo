import React, { useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationProps {
    isVisible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    taskText?: string;
    isModal?: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
    isVisible,
    onConfirm,
    onCancel,
    taskText,
    isModal = false
}) => {
    const handleConfirm = useCallback(() => {
        onConfirm();
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    if (!isVisible) return null;

    // Inline version (like in TodoList)
    if (!isModal) {
        return (
            <>
                <button
                    onClick={handleConfirm}
                    className="px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
                    title="Delete"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
                <button
                    onClick={handleCancel}
                    className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-all duration-200 font-medium"
                    title="Cancel"
                >
                    <X className="w-3 h-3" />
                </button>
            </>
        );
    }

    // Modal version (like in KanbanBoard)
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={handleCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-white/20 dark:border-slate-700/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Delete Task
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
                            This action cannot be undone
                        </p>
                    </div>
                    
                    {taskText && (
                        <div className="mb-6 p-4 bg-slate-50/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-600/50">
                            <p className="text-slate-700 dark:text-slate-200 font-medium text-center italic">
                                "{taskText}"
                            </p>
                        </div>
                    )}
                    
                    <div className="flex gap-3 sm:gap-4">
                        <motion.button
                            onClick={handleConfirm}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-base flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            onClick={handleCancel}
                            className="flex-1 bg-slate-100/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 py-3 px-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-base border border-slate-200/50 dark:border-slate-600/50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DeleteConfirmation; 