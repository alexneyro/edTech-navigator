import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../lib/firebase';
import type { OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Convert username to email format for Firebase
    const email = `${username.toLowerCase().replace(/\s+/g, '')}@school.local`;
    
    try {
      if (isRegistering) {
        // Registration Logic
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        const userProfile: UserProfile = {
          uid: user.uid,
          email: email,
          role: 'student', // Default role for new registrations
          name: name
        };

        try {
          await setDoc(doc(db, 'users', user.uid), userProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      } else {
        // Login Logic
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Ошибка авторизации. Проверьте данные.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Этот логин уже занят.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Пароль должен быть не менее 6 символов.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Неверный логин или пароль.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setUsername('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isRegistering ? 'Регистрация ученика' : 'Вход в Цифровой Навигатор'}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Имя и Фамилия
              </label>
              <input
                id="name"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Иванов"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Логин (Фамилия)
            </label>
            <input
              id="username"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ivanov"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Используйте вашу фамилию латиницей (например, ivanov)
            </p>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Загрузка...' : (isRegistering ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <button 
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
          >
            {isRegistering ? 'Уже есть аккаунт? Войти' : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </div>
      </div>
    </div>
  );
}
