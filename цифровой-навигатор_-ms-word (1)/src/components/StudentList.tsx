import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '../services/dbService';
import { UserProfile } from '../types';
import { Users, User, Trash2, Eye, ShieldCheck, ShieldAlert } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { auth } from '../lib/firebase';

interface StudentListProps {
  onSelectStudent?: (student: UserProfile) => void;
}

export default function StudentList({ onSelectStudent }: StudentListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: UserProfile | null }>({
    isOpen: false,
    user: null
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      // Filter out current user
      const currentUserUid = auth.currentUser?.uid;
      setUsers(data.filter(u => u.uid !== currentUserUid));
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;
    
    try {
      await deleteUser(deleteModal.user.uid);
      setUsers(users.filter(u => u.uid !== deleteModal.user?.uid));
      setDeleteModal({ isOpen: false, user: null });
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Ошибка при удалении пользователя");
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black flex items-center gap-2 text-gray-900 uppercase tracking-wider">
          <Users size={16} className="text-blue-600" /> 
          Управление пользователями
        </h3>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
          Всего: {users.length}
        </span>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div className="space-y-2">
            {users.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <Users size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">Пользователей пока нет.</p>
              </div>
            )}
            {users.map((user) => (
              <div 
                key={user.uid} 
                className="p-3 border border-gray-100 bg-white rounded-xl flex items-center justify-between gap-4 transition-all hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    user.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {user.role === 'admin' ? <ShieldCheck size={20} /> : <User size={20} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate text-sm">
                        {user.name || user.email?.split('@')[0]}
                      </p>
                      {user.role === 'admin' && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-tighter rounded flex items-center gap-0.5">
                          <ShieldAlert size={8} />
                          Админ
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-tighter">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {user.role === 'student' && (
                    <button
                      onClick={() => onSelectStudent?.(user)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                      title="Просмотр доски"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, user })}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Удаление пользователя"
        message={`Вы уверены, что хотите удалить пользователя ${deleteModal.user?.name || deleteModal.user?.email}?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, user: null })}
      />
    </div>
  );
}
