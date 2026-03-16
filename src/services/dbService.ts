import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AISettings, AIProfile, Lesson, Task, UserProfile } from '../types';

// User
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const path = 'users';
  try {
    const q = query(collection(db, 'users'), orderBy('role', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const deleteUser = async (uid: string): Promise<void> => {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    return handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateUser = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), data);
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// AI Settings & Profiles
export const getAISettings = async (): Promise<AISettings | null> => {
  const path = 'settings/global_config';
  try {
    const docRef = doc(db, 'settings', 'global_config');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as AISettings) : null;
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
};

export const saveAISettings = async (settings: AISettings): Promise<void> => {
  const path = 'settings/global_config';
  try {
    await setDoc(doc(db, 'settings', 'global_config'), settings);
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeToAISettings = (callback: (settings: AISettings | null) => void): Unsubscribe => {
  const path = 'settings/global_config';
  const docRef = doc(db, 'settings', 'global_config');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as AISettings);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const getAIProfiles = async (): Promise<AIProfile[]> => {
  const path = 'ai_profiles';
  try {
    const q = query(collection(db, 'ai_profiles'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProfile));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const subscribeToAIProfiles = (callback: (profiles: AIProfile[]) => void): Unsubscribe => {
  const path = 'ai_profiles';
  const q = query(collection(db, 'ai_profiles'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProfile));
    callback(profiles);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addAIProfile = async (profile: Omit<AIProfile, 'id'>): Promise<string> => {
  const path = 'ai_profiles';
  try {
    const docRef = await addDoc(collection(db, 'ai_profiles'), profile);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateAIProfile = async (id: string, profile: Partial<AIProfile>): Promise<void> => {
  const path = `ai_profiles/${id}`;
  try {
    await updateDoc(doc(db, 'ai_profiles', id), profile);
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteAIProfile = async (id: string): Promise<void> => {
  const path = `ai_profiles/${id}`;
  try {
    await deleteDoc(doc(db, 'ai_profiles', id));
  } catch (error) {
    return handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getActiveAIProfile = async (): Promise<AIProfile | null> => {
  const settings = await getAISettings();
  if (!settings || !settings.activeProfileId) return null;
  
  const path = `ai_profiles/${settings.activeProfileId}`;
  try {
    const docRef = doc(db, 'ai_profiles', settings.activeProfileId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as AIProfile) : null;
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
};

// Lessons
export const getLessons = async (): Promise<Lesson[]> => {
  const path = 'lessons';
  try {
    const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const subscribeToLessons = (callback: (lessons: Lesson[]) => void): Unsubscribe => {
  const path = 'lessons';
  const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
    callback(lessons);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addLesson = async (lesson: Omit<Lesson, 'id'>): Promise<string> => {
  const path = 'lessons';
  try {
    const docRef = await addDoc(collection(db, 'lessons'), lesson);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateLesson = async (id: string, lesson: Partial<Lesson>): Promise<void> => {
  const path = `lessons/${id}`;
  try {
    await updateDoc(doc(db, 'lessons', id), lesson);
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteLesson = async (id: string): Promise<void> => {
  const path = `lessons/${id}`;
  try {
    await deleteDoc(doc(db, 'lessons', id));
  } catch (error) {
    return handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Tasks (Kanban)
export const subscribeToUserTasks = (userId: string, callback: (tasks: Task[]) => void): Unsubscribe => {
  const path = 'tasks';
  const q = query(collection(db, 'tasks'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    // Sort by createdAt desc in memory since we might not have a composite index
    tasks.sort((a, b) => b.createdAt - a.createdAt);
    callback(tasks);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  const path = 'tasks';
  try {
    const docRef = await addDoc(collection(db, 'tasks'), task);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateTask = async (id: string, task: Partial<Task>): Promise<void> => {
  const path = `tasks/${id}`;
  try {
    await updateDoc(doc(db, 'tasks', id), task);
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  const path = `tasks/${id}`;
  try {
    await deleteDoc(doc(db, 'tasks', id));
  } catch (error) {
    return handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Admin functions
export const adminGetAllUsers = getAllUsers;
export const adminUpdateUserRole = async (uid: string, role: string): Promise<void> => {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), { role });
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
export const adminDeleteUser = deleteUser;
export const adminResetPassword = async (uid: string, newPassword: string): Promise<void> => {
  const path = `users/${uid}`;
  try {
    console.warn("adminResetPassword called. This requires Admin SDK/Cloud Functions.");
    await updateDoc(doc(db, 'users', uid), { _pendingPasswordReset: true });
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
