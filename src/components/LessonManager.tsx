import React, { useState, useEffect } from 'react';
import { getLessons, addLesson, updateLesson, deleteLesson } from '../services/dbService';
import { Lesson } from '../types';
import { Plus, Trash2, FileText, ExternalLink, Pencil, Save, AlertTriangle, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { db } from '../lib/firebase';
import { writeBatch, doc } from 'firebase/firestore';

export default function LessonManager() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignmentUrl: '',
    instructionUrl: '',
    order: 0
  });

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const data = await getLessons();
      setLessons(data);
      if (!editingLessonId) {
        setFormData(prev => ({ ...prev, order: data.length + 1 }));
      }
    } catch (error) {
      console.error("Error loading lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      if (editingLessonId) {
        await updateLesson(editingLessonId, formData);
        setEditingLessonId(null);
      } else {
        await addLesson(formData);
      }
      
      setFormData({ title: '', description: '', assignmentUrl: '', instructionUrl: '', order: lessons.length + 2 });
      setIsFormModalOpen(false);
      loadLessons();
    } catch (error) {
      console.error("Error saving lesson:", error);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      assignmentUrl: lesson.assignmentUrl || '',
      instructionUrl: lesson.instructionUrl || '',
      order: lesson.order
    });
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingLessonId(null);
    setFormData({ title: '', description: '', assignmentUrl: '', instructionUrl: '', order: lessons.length + 1 });
    setIsFormModalOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormModalOpen(false);
    setEditingLessonId(null);
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;
    try {
      await deleteLesson(lessonToDelete);
      setLessonToDelete(null);
      loadLessons();
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newLessons = [...lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    // Swap in array
    [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];
    
    // Update order values
    const updatedLessons = newLessons.map((lesson, idx) => ({
      ...lesson,
      order: idx + 1
    }));

    setLessons(updatedLessons);

    try {
      const batch = writeBatch(db);
      updatedLessons.forEach((lesson) => {
        const lessonRef = doc(db, 'lessons', lesson.id);
        batch.update(lessonRef, { order: lesson.order });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error reordering lessons:", error);
      loadLessons(); // Revert on error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Управление уроками</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 font-medium"
        >
          <Plus size={20} /> Добавить урок
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
          <FileText size={20} /> Список уроков
        </h3>
        
        {loading ? (
          <div className="flex justify-center p-10"><RefreshCw className="animate-spin text-blue-500" /></div>
        ) : (
          <div className="space-y-3">
            {lessons.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <FileText size={40} className="mx-auto mb-2 opacity-20" />
                <p>Уроков пока нет. Нажмите "Добавить урок", чтобы начать.</p>
              </div>
            )}
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{lesson.title}</h4>
                  <p className="text-sm text-gray-500 truncate max-w-md">{lesson.description}</p>
                  <div className="flex gap-3 mt-1">
                    {lesson.assignmentUrl && (
                      <a 
                        href={lesson.assignmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                      >
                        <ExternalLink size={12} /> Задание
                      </a>
                    )}
                    {lesson.instructionUrl && (
                      <a 
                        href={lesson.instructionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
                      >
                        <ExternalLink size={12} /> Инструкция
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                      title="Переместить вверх"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === lessons.length - 1}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                      title="Переместить вниз"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  <div className="w-px h-8 bg-gray-100 self-center mx-1"></div>
                  <button
                    onClick={() => handleEdit(lesson)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Редактировать урок"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => setLessonToDelete(lesson.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить урок"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Lesson Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCancelForm}
        title={editingLessonId ? 'Редактировать урок' : 'Добавить новый урок'}
        footer={
          <>
            <button
              onClick={handleCancelForm}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title}
              className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-all ${editingLessonId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
            >
              {editingLessonId ? <Save size={18} /> : <Plus size={18} />}
              {editingLessonId ? 'Сохранить изменения' : 'Добавить урок'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                autoFocus
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Урок 1: Введение"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на файл задания (docx/etc)</label>
              <input
                type="url"
                value={formData.assignmentUrl}
                onChange={(e) => setFormData({ ...formData, assignmentUrl: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на инструкцию (PDF)</label>
              <input
                type="url"
                value={formData.instructionUrl}
                onChange={(e) => setFormData({ ...formData, instructionUrl: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Скрытый контекст для ИИ (Текст заданий)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={4}
                placeholder="Что нужно сделать..."
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Lesson Confirmation Modal */}
      <ConfirmModal
        isOpen={!!lessonToDelete}
        title="Удалить урок?"
        message="Это действие нельзя отменить! Все задачи, привязанные к этому уроку, останутся в базе, но могут перестать корректно отображаться."
        onConfirm={confirmDelete}
        onCancel={() => setLessonToDelete(null)}
      />
    </div>
  );
}
