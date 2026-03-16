/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, isFirebaseInitialized } from './lib/firebase';
import Login from './components/Login';
import { doc, getDoc } from 'firebase/firestore';
import { UserRole } from './types';

import TeacherDashboard from './components/TeacherDashboard';
import StudentWorkspace from './components/StudentWorkspace';
import { Settings, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    if (!isFirebaseInitialized) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as UserRole);
          } else {
            // Default to student if not found (or handle registration logic)
            console.warn("User document not found, defaulting to student view for safety");
            setRole('student'); 
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (!isFirebaseInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Firebase Configuration Missing</h1>
          <p className="text-gray-700 mb-4">
            The application cannot start because the Firebase configuration is missing or invalid.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 overflow-x-auto mb-6">
            <h3 className="font-semibold text-sm text-gray-500 mb-2 uppercase">Required Environment Variables:</h3>
            <pre className="text-xs text-gray-800">
              VITE_FIREBASE_API_KEY=...<br/>
              VITE_FIREBASE_AUTH_DOMAIN=...<br/>
              VITE_FIREBASE_PROJECT_ID=...<br/>
              VITE_FIREBASE_STORAGE_BUCKET=...<br/>
              VITE_FIREBASE_MESSAGING_SENDER_ID=...<br/>
              VITE_FIREBASE_APP_ID=...
            </pre>
          </div>
          <p className="text-sm text-gray-600">
            Please add these variables to your environment secrets (or .env file for local development) and restart the application.
            You can find these values in your Firebase Console Project Settings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <header className="h-16 flex-shrink-0 bg-white shadow-sm z-50 border-b border-gray-200 sticky top-0">
        <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base">Ц</div>
            <h1 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 tracking-tight">
              Цифровой Навигатор
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-gray-800 leading-none">{user.email?.split('@')[0]}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{user.email}</span>
              </div>
              <span className="h-4 w-px bg-gray-200 mx-1"></span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                {role === 'admin' ? 'Учитель' : 'Ученик'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {role === 'admin' && (
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                    showAdminPanel 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <Settings size={14} />
                  <span className="hidden sm:inline">{showAdminPanel ? 'К доске' : 'Админка'}</span>
                </button>
              )}

              <button 
                onClick={() => auth.signOut()}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all active:scale-95"
                title="Выйти"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <div className="max-w-[1440px] mx-auto w-full flex-1 flex flex-col">
          {showAdminPanel && role === 'admin' ? (
            <div className="flex-1">
              <TeacherDashboard />
            </div>
          ) : (
            <StudentWorkspace />
          )}
        </div>
      </main>
    </div>
  );
}

