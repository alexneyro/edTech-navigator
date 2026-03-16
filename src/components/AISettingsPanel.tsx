import React, { useState, useEffect } from 'react';
import { 
  getAISettings, 
  saveAISettings, 
  addAIProfile, 
  updateAIProfile, 
  deleteAIProfile,
  subscribeToAIProfiles,
  subscribeToAISettings
} from '../services/dbService';
import { AISettings, AIProfile } from '../types';
import { fetchAIModels, AIModel } from '../services/aiService';
import { 
  Save, Zap, Globe, Cpu, RefreshCw, Search, Check, 
  Plus, Trash2, Edit2, Star, StarOff, Settings2, X
} from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

const PRESETS = {
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.0-flash-exp:free'
  },
  groq: {
    name: 'Groq (через Прокси)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile'
  }
};

export default function AISettingsPanel() {
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [settings, setSettings] = useState<AISettings>({ activeProfileId: null, studentTips: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [tipsText, setTipsText] = useState('');
  const [savingTips, setSavingTips] = useState(false);
  
  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<AIProfile> | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Model fetching state
  const [models, setModels] = useState<AIModel[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  useEffect(() => {
    const unsubProfiles = subscribeToAIProfiles(setProfiles);
    const unsubSettings = subscribeToAISettings((s) => {
      if (s) {
        setSettings(s);
        setTipsText(s.studentTips || '');
      }
      setLoading(false);
    });

    return () => {
      unsubProfiles();
      unsubSettings();
    };
  }, []);

  const handleOpenModal = (profile?: AIProfile) => {
    setEditingProfile(profile || {
      name: '',
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'google/gemini-2.0-flash-exp:free',
      systemPrompt: 'Ты - полезный ИИ-репетитор.'
    });
    setModels([]);
    setFetchError('');
    setIsModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editingProfile?.name || !editingProfile?.apiKey) return;
    setSaving(true);
    try {
      if (editingProfile.id) {
        await updateAIProfile(editingProfile.id, editingProfile);
      } else {
        const newId = await addAIProfile({
          ...editingProfile as Omit<AIProfile, 'id'>,
          createdAt: Date.now()
        });
        // If it's the first profile, make it active
        if (profiles.length === 0) {
          await saveAISettings({ activeProfileId: newId });
        }
      }
      setIsModalOpen(false);
      setMessage('Профиль сохранен');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = (id: string) => {
    setProfileToDelete(id);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    try {
      await deleteAIProfile(profileToDelete);
      if (settings.activeProfileId === profileToDelete) {
        await saveAISettings({ activeProfileId: null });
      }
      setProfileToDelete(null);
      setMessage('Профиль удален');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await saveAISettings({ activeProfileId: id });
      setMessage('Активный профиль изменен');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error setting active profile:", error);
    }
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setEditingProfile(prev => ({
      ...prev,
      baseUrl: preset.baseUrl,
      model: preset.model
    }));
    setModels([]);
    setFetchError('');
  };

  const handleFetchModels = async () => {
    if (!editingProfile?.baseUrl) return;
    if (!editingProfile?.apiKey) {
      setFetchError('Сначала введите API Key');
      return;
    }
    setFetchingModels(true);
    setFetchError('');
    try {
      const fetchedModels = await fetchAIModels(editingProfile.baseUrl, editingProfile.apiKey);
      setModels(fetchedModels);
    } catch (error: any) {
      setFetchError(error.message || 'Ошибка');
    } finally {
      setFetchingModels(false);
    }
  };

  const filteredModels = models.filter(m => 
    m.id.toLowerCase().includes(modelSearch.toLowerCase()) || 
    (m.name && m.name.toLowerCase().includes(modelSearch.toLowerCase()))
  );

  const handleSaveTips = async () => {
    setSavingTips(true);
    try {
      await saveAISettings({ 
        ...settings, 
        studentTips: tipsText 
      });
      setMessage('Памятка сохранена');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error saving tips:", error);
    } finally {
      setSavingTips(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Загрузка...</div>;

  return (
    <div className="space-y-6">
      {/* Global Student Memo Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Star className="text-amber-500" size={20} />
              Глобальная памятка для учеников
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Советы и важная информация</p>
          </div>
          <button
            onClick={handleSaveTips}
            disabled={savingTips}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-xs font-bold transition-all shadow-lg shadow-amber-100 active:scale-95 disabled:opacity-50"
          >
            <Save size={16} /> {savingTips ? 'Сохранение...' : 'Сохранить памятку'}
          </button>
        </div>
        <textarea
          value={tipsText}
          onChange={(e) => setTipsText(e.target.value)}
          placeholder="Введите советы, каждый с новой строки..."
          rows={5}
          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-medium resize-none custom-scrollbar"
        />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Settings2 className="text-blue-600" size={20} />
            Профили ИИ
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Управление провайдерами</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={16} /> Новый профиль
        </button>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(profile => {
          const isActive = settings.activeProfileId === profile.id;
          return (
            <div 
              key={profile.id} 
              className={`bg-white p-4 rounded-2xl border transition-all ${
                isActive ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{profile.name}</h4>
                  <p className="text-[10px] text-gray-400 truncate font-medium">{profile.model}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenModal(profile)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                  <Globe size={12} />
                  <span className="truncate">{profile.baseUrl}</span>
                </div>
              </div>

              <button
                onClick={() => handleSetActive(profile.id)}
                disabled={isActive}
                className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 cursor-default' 
                    : 'bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white'
                }`}
              >
                {isActive ? <Check size={14} /> : <Star size={14} />}
                {isActive ? 'Активен' : 'Сделать активным'}
              </button>
            </div>
          );
        })}
        {profiles.length === 0 && (
          <div className="col-span-full py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <Cpu size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-bold">Нет созданных профилей</p>
            <p className="text-xs mt-1">Создайте первый профиль, чтобы ИИ заработал</p>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProfile?.id ? 'Редактировать профиль' : 'Новый профиль'}
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-gray-600 font-bold text-xs hover:bg-gray-100 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving || !editingProfile?.name || !editingProfile?.apiKey}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Название профиля</label>
            <input
              type="text"
              value={editingProfile?.name || ''}
              onChange={(e) => setEditingProfile(p => ({ ...p!, name: e.target.value }))}
              placeholder="Например: Основной (OpenRouter)"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold"
            />
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Быстрые шаблоны</label>
            <div className="flex gap-2">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key as keyof typeof PRESETS)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">API Key</label>
            <input
              type="password"
              value={editingProfile?.apiKey || ''}
              onChange={(e) => setEditingProfile(p => ({ ...p!, apiKey: e.target.value.trim() }))}
              placeholder="sk-..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Base URL</label>
              <input
                type="text"
                value={editingProfile?.baseUrl || ''}
                onChange={(e) => setEditingProfile(p => ({ ...p!, baseUrl: e.target.value.trim() }))}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs font-medium"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Model ID</label>
                  {fetchError && (
                    <span className="text-[9px] text-red-500 font-bold animate-pulse truncate max-w-[100px]" title={fetchError}>
                      {fetchError}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels || !editingProfile?.baseUrl}
                  className="text-[9px] font-bold text-blue-600 hover:underline disabled:opacity-50"
                >
                  {fetchingModels ? 'Загрузка...' : 'Список'}
                </button>
              </div>
              <input
                type="text"
                value={editingProfile?.model || ''}
                onChange={(e) => setEditingProfile(p => ({ ...p!, model: e.target.value.trim() }))}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs font-medium"
              />
            </div>
          </div>

          {models.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="p-2 border-b bg-gray-50 flex items-center gap-2">
                <Search size={12} className="text-gray-400" />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Поиск..."
                  className="flex-1 bg-transparent text-[10px] outline-none font-bold"
                />
              </div>
              <div className="max-h-32 overflow-y-auto">
                {filteredModels.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setEditingProfile(p => ({ ...p!, model: m.id }));
                      setModels([]);
                    }}
                    className="w-full px-3 py-2 text-left text-[10px] font-bold text-gray-600 hover:bg-blue-50 border-b border-gray-50 last:border-0"
                  >
                    {m.name || m.id}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Системный промпт</label>
            <textarea
              value={editingProfile?.systemPrompt || ''}
              onChange={(e) => setEditingProfile(p => ({ ...p!, systemPrompt: e.target.value }))}
              rows={4}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xs font-medium resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!profileToDelete}
        title="Удалить профиль ИИ?"
        message="Вы уверены, что хотите удалить этот профиль провайдера? Это действие нельзя отменить."
        onConfirm={confirmDeleteProfile}
        onCancel={() => setProfileToDelete(null)}
      />
    </div>
  );
}
