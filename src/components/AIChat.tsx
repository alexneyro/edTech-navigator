import React, { useState, useEffect, useRef } from 'react';
import { chatWithAI } from '../services/aiService';
import { subscribeToAISettings, getActiveAIProfile } from '../services/dbService';
import { AISettings } from '../types';
import { Send, Bot, User as UserIcon, Loader, MessageCircle, X, Circle } from 'lucide-react';
import { parseMarkdown } from '../utils/markdown';

interface AIChatProps {
  lessonContext?: string;
  taskContext?: {
    title: string;
    checklist: string[];
  } | null;
}

export default function AIChat({ lessonContext, taskContext }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to AI settings for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToAISettings((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  // Open chat automatically if taskContext is provided
  useEffect(() => {
    if (taskContext) {
      setIsOpen(true);
    }
  }, [taskContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Cooldown timer logic
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const activeProfile = await getActiveAIProfile();
      
      if (!activeProfile || !activeProfile.apiKey) {
        setMessages(prev => [...prev, { role: 'assistant', content: "🤖 Связь с учителем не установлена (ИИ не настроен)" }]);
        return;
      }

      // Sliding window: last 3 messages from history + current message = 4 total (2 questions, 2 answers)
      const slidingWindowMessages = messages.slice(-3);
      
      // Build assembled system prompt
      let assembledSystemPrompt = activeProfile.systemPrompt || 'Ты - полезный помощник.';
      
      if (lessonContext) {
        assembledSystemPrompt += `\n\nКонтекст текущего урока:\n${lessonContext}`;
      }
      
      if (taskContext) {
        assembledSystemPrompt += `\n\nТы помогаешь ученику с конкретной задачей: "${taskContext.title}".`;
        if (taskContext.checklist.length > 0) {
          assembledSystemPrompt += `\nЧек-лист задачи:\n${taskContext.checklist.map(item => `- ${item}`).join('\n')}`;
        }
      }

      const response = await chatWithAI(
        activeProfile.apiKey,
        activeProfile.baseUrl,
        activeProfile.model,
        assembledSystemPrompt,
        [...slidingWindowMessages, { role: 'user', content: userMessage }]
      );

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setCooldown(10);
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMessage = error.message || "Извините, произошла ошибка. Попробуйте еще раз.";
      
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        errorMessage = "🤖 Извини, учитель сейчас очень занят (слишком много вопросов от класса). Подожди 10 секунд и попробуй снова!";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const isAIConfigured = settings && settings.activeProfileId;

  return (
    <div 
      className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-[100] ${
        isOpen ? 'w-80 md:w-96' : 'w-0'
      }`}
    >
      {/* Chat Header */}
      <div className="h-[61px] p-4 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-xs">ИИ-Помощник</h3>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-green-500">
              <Circle size={5} fill="currentColor" />
              {isAIConfigured ? "Онлайн" : "Не настроен"}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Context Indicator */}
      {taskContext && (
        <div className="px-4 py-1.5 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2 text-[9px] font-semibold text-blue-700">
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="truncate">Вижу задачу: {taskContext.title}</span>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 custom-scrollbar">
        {!isAIConfigured ? (
          <div className="text-center text-gray-500 mt-20 px-6">
            <Bot size={40} className="mx-auto mb-3 text-gray-300" />
            <h4 className="font-bold text-gray-700 mb-1 text-sm">ИИ не настроен</h4>
            <p className="text-[10px]">Пожалуйста, попросите учителя настроить параметры подключения к ИИ.</p>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-10 px-6">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Bot size={24} className="text-blue-600 opacity-50" />
                </div>
                <p className="text-xs font-medium text-gray-600">Привет! Я твой ИИ-помощник.</p>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">Спроси меня о чем угодно по текущему уроку или задаче.</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-blue-600'
                }`}>
                  {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[85%] p-2.5 rounded-xl text-[12px] markdown-content shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={14} />
                </div>
                <div className="bg-white border border-gray-100 p-2 rounded-xl rounded-tl-none shadow-sm">
                  <Loader size={14} className="animate-spin text-blue-400" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-3 pb-8 bg-white border-t-2 border-gray-100 flex-shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={!isAIConfigured ? "ИИ недоступен..." : (cooldown > 0 ? `Подождите ${cooldown} сек...` : "Задай вопрос...")}
            className="w-full p-3 pr-10 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[12px] font-medium transition-all disabled:opacity-50"
            disabled={loading || cooldown > 0 || !isAIConfigured}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || cooldown > 0 || !isAIConfigured}
            className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 flex items-center justify-center w-8 h-8"
          >
            {cooldown > 0 ? <span className="text-[10px] font-bold">{cooldown}</span> : <Send size={14} />}
          </button>
        </form>
        <p className="text-[9px] text-center text-gray-400 mt-2 font-medium">
          ИИ может ошибаться. Проверяйте информацию.
        </p>
      </div>

      {/* Floating toggle button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-8 right-8 w-14 h-14 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 ${
            isAIConfigured ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
          title="Открыть ИИ-Помощника"
        >
          <Bot size={28} />
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isAIConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
        </button>
      )}
    </div>
  );
}
