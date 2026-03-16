import React, { useState } from 'react';
import { Reflection } from '../types';

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reflection: Reflection) => void;
}

export default function ReflectionModal({ isOpen, onClose, onSubmit }: ReflectionModalProps) {
  const [method, setMethod] = useState<'self' | 'ai' | 'teacher'>('self');
  const [difficulty, setDifficulty] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!difficulty.trim()) return;
    onSubmit({ method, difficulty });
    setDifficulty('');
    setMethod('self');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Рефлексия</h3>
        <p className="text-gray-600 mb-4">Отличная работа! Перед завершением расскажи, как это было.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Как ты справился?</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('self')}
                className={`p-2 rounded border text-sm ${method === 'self' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
              >
                Сам
              </button>
              <button
                type="button"
                onClick={() => setMethod('ai')}
                className={`p-2 rounded border text-sm ${method === 'ai' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
              >
                Помог ИИ
              </button>
              <button
                type="button"
                onClick={() => setMethod('teacher')}
                className={`p-2 rounded border text-sm ${method === 'teacher' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
              >
                Звал учителя
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Что было самым сложным?</label>
            <textarea
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Я запутался в..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Готово
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
