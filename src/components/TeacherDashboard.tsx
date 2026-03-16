import React, { useState, useEffect } from 'react';
import AISettingsPanel from './AISettingsPanel';
import LessonManager from './LessonManager';
import StudentList from './StudentList';
import KanbanBoard from './KanbanBoard';
import { Users, Settings, BookOpen, ArrowLeft } from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserProfile, Lesson } from '../types';
import { getLessons } from '../services/dbService';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'lessons' | 'ai'>('users');
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadLessons();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedStudent) {
      // Logic for selected student if needed
    }
  }, [selectedStudent]);

  const loadLessons = async () => {
    const data = await getLessons();
    setLessons(data);
  };

  const handleUserSelect = (student: UserProfile) => {
    setSelectedStudent(student);
  };

  const handleBackToUsers = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
        <nav className="p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('users'); setSelectedStudent(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={20} />
            Пользователи
          </button>

          <button
            onClick={() => { setActiveTab('lessons'); setSelectedStudent(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'lessons' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={20} />
            Уроки
          </button>

          <button
            onClick={() => { setActiveTab('ai'); setSelectedStudent(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'ai' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings size={20} />
            Настройки ИИ
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6">
        {activeTab === 'users' && (
          <div className="flex flex-col">
            {selectedStudent ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleBackToUsers}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedStudent.name || selectedStudent.email}
                      </h2>
                      <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  {/* Kanban Board */}
                  <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h3 className="text-sm font-black flex items-center gap-2 text-gray-900 uppercase tracking-wider">
                        <BookOpen size={16} className="text-blue-500" />
                        Прогресс обучения
                      </h3>
                    </div>
                    <div>
                      <KanbanBoard userId={selectedStudent.uid} readOnly={true} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <StudentList onSelectStudent={handleUserSelect} />
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'lessons' && <div><LessonManager /></div>}
        
        {activeTab === 'ai' && <div><AISettingsPanel /></div>}
      </main>
    </div>
  );
}
