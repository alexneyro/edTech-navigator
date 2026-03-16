import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfgqKn0v9xwyMkRBYR7snatyWJtTnl6Qg",
  authDomain: "diplom-kanban.firebaseapp.com",
  projectId: "diplom-kanban",
  storageBucket: "diplom-kanban.firebasestorage.app",
  messagingSenderId: "61279007429",
  appId: "1:61279007429:web:9c3c05d7218cd56eaaf6ac"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Экспортируем функцию как обычную константу
export const handleFirestoreError = (error: any, operation: string = 'get', path: string | null = null) => {
  console.error(`Firestore Error: ${operation}`, error);
  return "Ошибка базы данных. Проверьте соединение.";
};

// Экспортируем тип отдельно
export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export default app;