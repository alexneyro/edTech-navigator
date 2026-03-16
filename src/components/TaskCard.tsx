import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Task, Subtask } from '../types';
import { Trash2, Edit2, CheckSquare, Plus, X, Bot, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface TaskCardProps {
  task: Task;
  index: number;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onAskAI?: (title: string, checklist: string[]) => void;
  readOnly?: boolean;
  onMove?: (taskId: string, newStatus: Task['status']) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onUpdate, onDelete, onAskAI, readOnly = false, onMove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskText, setEditSubtaskText] = useState('');

  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState<number | null>(null);

  const handleSaveTitle = () => {
    if (editTitle.trim() !== task.title) {
      onUpdate(task.id, { title: editTitle });
    }
    setIsEditing(false);
  };

  const toggleSubtask = (subtaskId: string) => {
    if (readOnly) return;
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate(task.id, { subtasks: updatedSubtasks });
  };

  const addSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const newSt: Subtask = {
      id: Date.now().toString(),
      text: newSubtask,
      completed: false
    };
    onUpdate(task.id, { subtasks: [...task.subtasks, newSt] });
    setNewSubtask('');
    setShowAddSubtask(false);
  };

  const handleDeleteSubtask = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (readOnly) return;
    setSubtaskToDelete(index);
  };

  const confirmDeleteSubtask = async () => {
    if (subtaskToDelete === null) return;

    const newSubtasks = task.subtasks.filter((_, i) => i !== subtaskToDelete);

    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { subtasks: newSubtasks });
      setSubtaskToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const startEditingSubtask = (st: Subtask) => {
    if (readOnly) return;
    setEditingSubtaskId(st.id);
    setEditSubtaskText(st.text);
  };

  const saveSubtaskEdit = () => {
    if (!editingSubtaskId) return;
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === editingSubtaskId ? { ...st, text: editSubtaskText.trim() } : st
    );
    onUpdate(task.id, { subtasks: updatedSubtasks });
    setEditingSubtaskId(null);
  };

  const moveSubtask = (idx: number, direction: 'up' | 'down') => {
    if (readOnly) return;
    const newSubtasks = [...task.subtasks];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSubtasks.length) return;
    
    [newSubtasks[idx], newSubtasks[targetIdx]] = [newSubtasks[targetIdx], newSubtasks[idx]];
    onUpdate(task.id, { subtasks: newSubtasks });
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={readOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white p-2 rounded-xl shadow-sm border border-gray-200 mb-2 group transition-all hover:shadow-md ${snapshot.isDragging ? 'shadow-lg rotate-1 z-50' : ''}`}
          style={provided.draggableProps.style}
        >
          <div className="flex justify-between items-start mb-1">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="flex-1 p-1 border rounded text-[10px] sm:text-[11px] font-bold"
                autoFocus
              />
            ) : (
              <h4 className="font-bold text-gray-800 text-[11px] sm:text-[12px] leading-tight break-words flex-1 pr-2">{task.title}</h4>
            )}
            
            {!readOnly && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {onAskAI && (
                  <button 
                    onClick={() => onAskAI(task.title, task.subtasks.map(s => s.text))} 
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Помощь ИИ"
                  >
                    <Bot size={11} />
                  </button>
                )}
                <button 
                  onClick={() => setIsEditing(!isEditing)} 
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 size={11} />
                </button>
                <button 
                  onClick={() => onDelete(task.id)} 
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>

          {task.subtasks.length > 0 && (
            <div className="max-h-[150px] overflow-y-auto custom-scrollbar mb-1.5 space-y-1 pr-1">
              {task.subtasks.map((st, idx) => (
                <div 
                  key={st.id} 
                  className={`flex items-start gap-2 py-1.5 px-1 rounded transition-all group/sub ${
                    st.completed ? 'bg-gray-50/50 opacity-60' : 'hover:bg-blue-50/50'
                  }`}
                >
                  {!readOnly && (
                    <div className="flex flex-col opacity-60 group-hover/sub:opacity-100 transition-opacity">
                      <button 
                        onClick={() => moveSubtask(idx, 'up')} 
                        disabled={idx === 0}
                        className="p-0.5 text-blue-500 hover:bg-blue-100 rounded-full disabled:opacity-0 transition-colors"
                      >
                        <ChevronUp size={10} />
                      </button>
                      <button 
                        onClick={() => moveSubtask(idx, 'down')} 
                        disabled={idx === task.subtasks.length - 1}
                        className="p-0.5 text-blue-500 hover:bg-blue-100 rounded-full disabled:opacity-0 transition-colors"
                      >
                        <ChevronDown size={10} />
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => toggleSubtask(st.id)}
                    className={`flex-shrink-0 transition-transform active:scale-90 ${
                      readOnly ? 'cursor-default' : 'cursor-pointer text-gray-400 hover:text-blue-500'
                    }`}
                  >
                    {st.completed ? (
                      <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center text-white">
                        <CheckSquare size={10} />
                      </div>
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded hover:border-blue-400 transition-colors"></div>
                    )}
                  </button>

                  {editingSubtaskId === st.id ? (
                    <textarea
                      autoFocus
                      value={editSubtaskText}
                      onChange={(e) => setEditSubtaskText(e.target.value)}
                      onBlur={saveSubtaskEdit}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), saveSubtaskEdit())}
                      className="flex-1 text-[10px] sm:text-[11px] py-1 px-1 border-2 border-blue-200 rounded bg-white outline-none font-medium resize-none min-h-[40px]"
                    />
                  ) : (
                    <span 
                      onClick={() => startEditingSubtask(st)}
                      className={`flex-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-text break-words whitespace-normal leading-normal ${
                        st.completed ? 'line-through text-gray-400' : 'text-gray-900 hover:text-blue-700'
                      }`}
                    >
                      {st.text}
                    </span>
                  )}

                  {!readOnly && (
                    <div className="flex items-center gap-1 opacity-60 group-hover/sub:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditingSubtask(st)}
                        className="p-1 text-blue-500 hover:bg-blue-100 rounded-full transition-colors"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteSubtask(e, idx)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors z-10 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readOnly && (
            <div className="mt-1">
              {showAddSubtask ? (
                <form onSubmit={addSubtask} className="flex gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    autoFocus
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onBlur={() => !newSubtask.trim() && setShowAddSubtask(false)}
                    placeholder="Что сделать?"
                    className="flex-1 text-[10px] sm:text-[11px] py-1.5 px-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                  />
                  <button type="submit" className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-95">
                    <Plus size={14} />
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setShowAddSubtask(true)}
                  className="w-full py-1.5 border-2 border-dashed border-blue-200 rounded-lg text-[10px] sm:text-[11px] text-blue-600 font-bold hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={12} className="text-blue-600" />
                  <span>Добавить подзадачу</span>
                </button>
              )}
            </div>
          )}
          
          {task.reflection && (
            <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className={`px-1 py-0.5 rounded-[4px] text-[8px] uppercase font-bold
                  ${task.reflection.method === 'ai' ? 'bg-purple-100 text-purple-700' : 
                    task.reflection.method === 'teacher' ? 'bg-orange-100 text-orange-700' : 
                    'bg-blue-100 text-blue-700'}`}>
                  {task.reflection.method === 'ai' ? 'ИИ' : task.reflection.method === 'teacher' ? 'Учитель' : 'Сам'}
                </span>
              </div>
              {task.reflection.difficulty && (
                <span className="text-[9px] text-gray-400 italic truncate max-w-[100px]" title={task.reflection.difficulty}>
                  {task.reflection.difficulty}
                </span>
              )}
            </div>
          )}

          {/* Mobile Move Buttons */}
          {onMove && !readOnly && (
            <div className="mt-3 pt-2 border-t border-gray-100 flex gap-2">
              {task.status !== 'todo' && (
                <button
                  onClick={() => onMove(task.id, 'todo')}
                  className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 transition-all"
                >
                  В план
                </button>
              )}
              {task.status !== 'in-progress' && (
                <button
                  onClick={() => onMove(task.id, 'in-progress')}
                  className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all"
                >
                  В работу
                </button>
              )}
              {task.status !== 'done' && (
                <button
                  onClick={() => onMove(task.id, 'done')}
                  className="flex-1 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-green-100 transition-all"
                >
                  Готово
                </button>
              )}
            </div>
          )}

          {/* Custom Subtask Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={subtaskToDelete !== null}
            title="Удалить этот пункт плана?"
            message="Это действие нельзя будет отменить."
            onConfirm={confirmDeleteSubtask}
            onCancel={() => setSubtaskToDelete(null)}
          />
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;
