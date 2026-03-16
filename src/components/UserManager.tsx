import React, { useState, useEffect } from 'react';
import { adminGetAllUsers, adminUpdateUserRole, adminResetPassword, adminDeleteUser } from '../services/dbService';
import { UserProfile } from '../types';
import { User, Mail, Shield, Trash2, Key, Layout, RefreshCw, ChevronRight, Search } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

interface UserManagerProps {
  onViewBoard: (userId: string) => void;
}

export default function UserManager({ onViewBoard }: UserManagerProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Modal states
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminGetAllUsers();
      setUsers(data);
    } catch (error: any) {
      console.error("Error loading users:", error);
      setMessage({ text: "Ошибка при загрузке пользователей", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      await adminUpdateUserRole(user.uid, newRole);
      setUsers(users.map(u => u.uid === user.uid ? { ...u, role: newRole as any } : u));
      setMessage({ text: `Роль пользователя ${user.email} обновлена`, type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error updating role:", error);
      setMessage({ text: "Ошибка при обновлении роли", type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!userToResetPassword || !newPassword.trim()) return;
    try {
      await adminResetPassword(userToResetPassword.uid, newPassword.trim());
      setMessage({ text: `Пароль для ${userToResetPassword.email} успешно изменен`, type: 'success' });
      setUserToResetPassword(null);
      setNewPassword('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setMessage({ text: "Ошибка при сбросе пароля", type: 'error' });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await adminDeleteUser(userToDelete.uid);
      setUsers(users.filter(u => u.uid !== userToDelete.uid));
      setMessage({ text: `Пользователь ${userToDelete.email} удален`, type: 'success' });
      setUserToDelete(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setMessage({ text: "Ошибка при удалении пользователя", type: 'error' });
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Управление учениками</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Список всех пользователей системы</p>
        </div>
        <button
          onClick={loadUsers}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
          title="Обновить список"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Пользователь</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Роль</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="animate-spin text-blue-500" size={24} />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Загрузка...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <User size={40} />
                      <span className="text-xs font-bold uppercase tracking-widest">Пользователи не найдены</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-900 truncate">{user.name || 'Без имени'}</span>
                          <span className="text-[10px] font-bold text-gray-400 truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleRole(user)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                          user.role === 'admin' 
                            ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}
                      >
                        <Shield size={10} />
                        {user.role === 'admin' ? 'Учитель' : 'Ученик'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewBoard(user.uid)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                          title="Просмотр доски"
                        >
                          <Layout size={18} />
                        </button>
                        <button
                          onClick={() => setUserToResetPassword(user)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all active:scale-95"
                          title="Сбросить пароль"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                          title="Удалить ученика"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!userToResetPassword}
        onClose={() => {
          setUserToResetPassword(null);
          setNewPassword('');
        }}
        title="Сброс пароля"
        footer={
          <>
            <button
              onClick={() => {
                setUserToResetPassword(null);
                setNewPassword('');
              }}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              Отмена
            </button>
            <button
              onClick={handleResetPassword}
              disabled={!newPassword.trim() || newPassword.length < 6}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-xs font-bold transition-all shadow-lg shadow-amber-100 disabled:opacity-50 active:scale-95"
            >
              Сбросить
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <Key className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-800 leading-relaxed">
              Вы устанавливаете новый пароль для пользователя <strong>{userToResetPassword?.email}</strong>. 
              Пароль должен содержать не менее 6 символов.
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Новый пароль</label>
            <input
              autoFocus
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Введите новый пароль..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Удалить пользователя?"
        message={`Вы уверены, что хотите полностью удалить пользователя ${userToDelete?.email}? Это действие удалит его аккаунт и все связанные задачи. Отменить это действие невозможно.`}
        onConfirm={handleDeleteUser}
        onCancel={() => setUserToDelete(null)}
        confirmText="Удалить навсегда"
        isDanger={true}
      />
    </div>
  );
}
