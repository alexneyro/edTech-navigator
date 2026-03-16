import React, { useState, useEffect } from 'react';
import { getLessons, subscribeToAISettings } from '../services/dbService';
import { Lesson, AISettings } from '../types';
import KanbanBoard from './KanbanBoard';
import AIChat from './AIChat';
import { BookOpen, ExternalLink, ChevronDown, Lightbulb, CheckCircle2 } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function StudentWorkspace() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTaskContext, setActiveTaskContext] = useState<{ title: string; checklist: string[] } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);

  useEffect(() => {
    loadLessons();
    const unsubSettings = subscribeToAISettings(setSettings);
    return () => unsubSettings();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const data = await getLessons();
      setLessons(data);
      if (data.length > 0) {
        setSelectedLessonId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLesson = lessons.find(l => l.id === selectedLessonId);
  const userId = auth.currentUser?.uid;

  if (!userId) return <div>Пожалуйста, войдите в систему.</div>;

  return (
    <div className="flex min-h-full bg-gray-100 flex-col md:flex-row">
      {/* Left Panel: Lessons */}
      <aside className="w-full md:w-[280px] flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 bg-white shadow-sm z-10 md:sticky md:top-16 md:h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
        {/* Compact Header Module */}
        <div className="p-4 border-b border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-blue-600">
            <BookOpen size={18} />
            <h1 className="font-black text-sm uppercase tracking-tighter">Учебный план</h1>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-bold text-gray-800 cursor-pointer hover:bg-gray-100 transition-all active:scale-[0.99]"
              >
                <span className="truncate">
                  {selectedLesson?.title || (lessons.length === 0 ? 'Нет доступных уроков' : 'Выберите урок')}
                </span>
                <ChevronDown className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} size={14} />
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                      {lessons.length === 0 && (
                        <div className="p-3 text-center text-gray-400 text-[10px] font-bold uppercase">
                          Список пуст
                        </div>
                      )}
                      {lessons.map(lesson => (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setSelectedLessonId(lesson.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg text-xs font-bold transition-colors mb-0.5 last:mb-0 ${
                            selectedLessonId === lesson.id 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {lesson.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {selectedLesson && (
              <div className="space-y-3">
                <h2 className="text-sm font-black text-gray-900 leading-tight">{selectedLesson.title}</h2>
                
                <div className="flex gap-2">
                  {selectedLesson.assignmentUrl && (
                    <a
                      href={selectedLesson.assignmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-[10px] shadow-sm active:scale-[0.98]"
                    >
                      <ExternalLink size={12} />
                      Задание
                    </a>
                  )}
                  
                  {selectedLesson.instructionUrl && (
                    <a
                      href={selectedLesson.instructionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-bold text-[10px] border border-gray-200 shadow-sm active:scale-[0.98]"
                    >
                      <ExternalLink size={12} />
                      Инструкция
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Student Tips Section */}
          {settings?.studentTips && (
            <div className="mt-6 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="bg-blue-50/50 border-l-4 border-blue-500 rounded-r-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="text-blue-600" size={16} />
                  <h3 className="text-[11px] font-black text-blue-900 uppercase tracking-wider">Важно помнить</h3>
                </div>
                <ul className="space-y-2.5">
                  {settings.studentTips.split('\n').filter(tip => tip.trim()).map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 group">
                      <CheckCircle2 className="text-blue-400 mt-0.5 shrink-0 group-hover:text-blue-600 transition-colors" size={12} />
                      <span className="text-[11px] font-bold text-gray-700 leading-relaxed">{tip.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Description / Scrollable Area - Hidden for students but kept in state for AI */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Hidden block */}
        </div>
      </aside>

      {/* Center Panel: Kanban */}
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
        <KanbanBoard 
          userId={userId} 
          lessonId={selectedLessonId} 
          onAskAI={(title, checklist) => setActiveTaskContext({ title, checklist })}
        />
      </div>

      {/* Side Chat Panel */}
      <AIChat 
        lessonContext={selectedLesson?.description} 
        taskContext={activeTaskContext}
      />
    </div>
  );
}
