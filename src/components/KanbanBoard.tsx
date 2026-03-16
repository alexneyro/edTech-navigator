import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Task, Reflection } from '../types';
import { subscribeToUserTasks, addTask, updateTask, deleteTask } from '../services/dbService';
import TaskCard from './TaskCard';
import ReflectionModal from './ReflectionModal';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { Plus, Loader, AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  userId: string;
  lessonId?: string;
  readOnly?: boolean;
  onAskAI?: (taskId: string) => void;
  onTasksUpdate?: (tasks: Task[]) => void;
}

export default function KanbanBoard({ userId, lessonId, readOnly = false, onAskAI, onTasksUpdate }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingReflectionTask, setPendingReflectionTask] = useState<Task | null>(null);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLessonAlertOpen, setIsLessonAlertOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Task['status']>('todo');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      const unsubscribe = subscribeToUserTasks(userId, (data) => {
        setTasks(data);
        if (onTasksUpdate) onTasksUpdate(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userId]);

  const handleMoveTask = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || readOnly) return;

    if (newStatus === 'done' && task.status !== 'done') {
      setPendingReflectionTask(task);
      return;
    }

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || readOnly) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as Task['status'];

    // Check for reflection trigger BEFORE optimistic update
    if (newStatus === 'done' && source.droppableId !== 'done') {
      setPendingReflectionTask(task);
      return;
    }

    // If reordering in the same column
    if (source.droppableId === destination.droppableId) {
      const columnTasks = tasks.filter(t => t.status === source.droppableId);
      const otherTasks = tasks.filter(t => t.status !== source.droppableId);
      
      const reorderedColumn = Array.from(columnTasks);
      const [removed] = reorderedColumn.splice(source.index, 1);
      reorderedColumn.splice(destination.index, 0, removed);
      
      setTasks([...otherTasks, ...reorderedColumn]);
      // Note: In a real app, we'd save the order/index to DB. 
      // For now, we just update local state for immediate feedback.
      return;
    }

    // Optimistic update for status change (only for non-done moves)
    const updatedTasks = tasks.map(t => 
      t.id === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    // Save to DB
    try {
      await updateTask(draggableId, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleReflectionSubmit = async (reflection: Reflection) => {
    if (!pendingReflectionTask) return;

    try {
      await updateTask(pendingReflectionTask.id, { 
        status: 'done',
        reflection 
      });
      setPendingReflectionTask(null);
    } catch (error) {
      console.error("Error saving reflection:", error);
    }
  };

  const handleReflectionCancel = () => {
    setPendingReflectionTask(null);
  };

  const handleCreateTaskClick = () => {
    if (!lessonId) {
      setIsLessonAlertOpen(true);
      return;
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim() || !lessonId) return;

    const newTask: Omit<Task, 'id'> = {
      userId,
      lessonId,
      title: newTaskTitle.trim(),
      status: 'todo',
      subtasks: [],
      createdAt: Date.now()
    };

    try {
      await addTask(newTask);
      setIsTaskModalOpen(false);
      setNewTaskTitle('');
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const columns: { id: Task['status']; title: string; shortTitle: string; bg: string; accent: string }[] = [
    { id: 'todo', title: 'Нужно сделать', shortTitle: 'План', bg: 'bg-gray-50/50', accent: 'border-gray-200' },
    { id: 'in-progress', title: 'В работе', shortTitle: 'Работа', bg: 'bg-blue-50/30', accent: 'border-blue-100' },
    { id: 'done', title: 'Готово', shortTitle: 'Готово', bg: 'bg-green-50/30', accent: 'border-green-100' }
  ];

  if (loading) {
    return <div className="flex justify-center p-10"><Loader className="animate-spin text-blue-500" /></div>;
  }

  return (
    <>
      <div className="flex flex-col">
        {!readOnly && (
          <div className="h-[50px] sm:h-[61px] flex-shrink-0 px-4 sm:px-6 border-b border-gray-200 bg-white flex justify-between items-center z-20 sticky top-16">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <h2 className="text-xs sm:text-base font-black text-gray-900 tracking-tight">Моя доска</h2>
              <p className="hidden xs:block text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-widest">Управляй обучением</p>
            </div>
            <button
              onClick={handleCreateTaskClick}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[10px] sm:text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus size={12} className="sm:w-[14px] sm:h-[14px]" /> <span className="hidden xs:inline">Новая задача</span><span className="xs:hidden">Задача</span>
            </button>
          </div>
        )}

        {/* Mobile Tab Bar */}
        {isMobile && (
          <div className="flex-shrink-0 flex border-b border-gray-200 bg-white z-20 sticky top-[66px] sm:top-[77px]">
            {columns.map(col => (
              <button
                key={col.id}
                onClick={() => setActiveTab(col.id)}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider transition-all relative ${
                  activeTab === col.id ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{col.shortTitle}</span>
                  <span className={`px-1 py-0.5 rounded-full text-[7px] ${
                    activeTab === col.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
                {activeTab === col.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 animate-in fade-in slide-in-from-bottom-1 duration-300" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col overflow-x-auto custom-scrollbar">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className={`p-2 sm:p-4 ${
              isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-3 gap-2 lg:gap-4 min-w-[800px] lg:min-w-0'
            }`}>
              {columns
                .filter(col => !isMobile || col.id === activeTab)
                .map(col => (
                  <Droppable key={col.id} droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col rounded-2xl p-2 sm:p-3 border ${col.accent} ${col.bg} ${
                          snapshot.isDraggingOver ? 'ring-2 ring-blue-500/10 border-blue-200' : ''
                        } transition-all min-h-[200px]`}
                      >
                        {!isMobile && (
                          <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                            <h3 className="font-bold text-gray-700 text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                col.id === 'todo' ? 'bg-gray-400' : col.id === 'in-progress' ? 'bg-blue-500' : 'bg-green-500'
                              }`}></div>
                              {col.title}
                            </h3>
                            <span className="bg-white border border-gray-100 px-1 sm:px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold text-gray-500 shadow-sm">
                              {tasks.filter(t => t.status === col.id).length}
                            </span>
                          </div>
                        )}
                        
                        <div className="space-y-2 sm:space-y-3">
                          {tasks
                            .filter(t => t.status === col.id)
                            .map((task, index) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onUpdate={handleUpdateTask}
                                onDelete={(id) => setTaskToDelete(id)}
                                onAskAI={onAskAI}
                                readOnly={readOnly}
                                onMove={isMobile ? handleMoveTask : undefined}
                              />
                            ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
            </div>
          </DragDropContext>
        </div>
      </div>

      <ReflectionModal
        isOpen={!!pendingReflectionTask}
        onClose={handleReflectionCancel}
        onSubmit={handleReflectionSubmit}
      />

      {/* New Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Новая задача"
        footer={
          <>
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSaveTask}
              disabled={!newTaskTitle.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Сохранить
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Название задачи</label>
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Например: Оформить заголовок..."
          />
        </div>
      </Modal>

      {/* Lesson Alert Modal */}
      <Modal
        isOpen={isLessonAlertOpen}
        onClose={() => setIsLessonAlertOpen(false)}
        title="Внимание"
        footer={
          <button
            onClick={() => setIsLessonAlertOpen(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Понятно
          </button>
        }
      >
        <div className="flex items-center gap-3 text-amber-600">
          <AlertCircle size={24} />
          <p className="font-medium">Сначала выберите урок из списка слева!</p>
        </div>
      </Modal>

      {/* Delete Task Confirmation Modal */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Удалить задачу?"
        message="Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить."
        onConfirm={confirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </>
  );
}
