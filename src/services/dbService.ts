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
import { db } from '../lib/firebase';
import { AISettings, AIProfile, Lesson, Task, UserProfile } from '../types';

// User
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const q = query(collection(db, 'users'), orderBy('role', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid));
};

export const updateUser = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), data);
};

// AI Settings & Profiles
export const getAISettings = async (): Promise<AISettings | null> => {
  const docRef = doc(db, 'settings', 'global_config');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as AISettings) : null;
};

export const saveAISettings = async (settings: AISettings): Promise<void> => {
  await setDoc(doc(db, 'settings', 'global_config'), settings);
};

export const subscribeToAISettings = (callback: (settings: AISettings | null) => void): Unsubscribe => {
  const docRef = doc(db, 'settings', 'global_config');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as AISettings);
    } else {
      callback(null);
    }
  });
};

export const getAIProfiles = async (): Promise<AIProfile[]> => {
  const q = query(collection(db, 'ai_profiles'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProfile));
};

export const subscribeToAIProfiles = (callback: (profiles: AIProfile[]) => void): Unsubscribe => {
  const q = query(collection(db, 'ai_profiles'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProfile));
    callback(profiles);
  });
};

export const addAIProfile = async (profile: Omit<AIProfile, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'ai_profiles'), profile);
  return docRef.id;
};

export const updateAIProfile = async (id: string, profile: Partial<AIProfile>): Promise<void> => {
  await updateDoc(doc(db, 'ai_profiles', id), profile);
};

export const deleteAIProfile = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'ai_profiles', id));
};

export const getActiveAIProfile = async (): Promise<AIProfile | null> => {
  const settings = await getAISettings();
  if (!settings || !settings.activeProfileId) return null;
  
  const docRef = doc(db, 'ai_profiles', settings.activeProfileId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as AIProfile) : null;
};

// Lessons
export const getLessons = async (): Promise<Lesson[]> => {
  const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
};

export const subscribeToLessons = (callback: (lessons: Lesson[]) => void): Unsubscribe => {
  const q = query(collection(db, 'lessons'), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
    callback(lessons);
  });
};

export const addLesson = async (lesson: Omit<Lesson, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'lessons'), lesson);
  return docRef.id;
};

export const updateLesson = async (id: string, lesson: Partial<Lesson>): Promise<void> => {
  await updateDoc(doc(db, 'lessons', id), lesson);
};

export const deleteLesson = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'lessons', id));
};

// Tasks (Kanban)
export const subscribeToUserTasks = (userId: string, callback: (tasks: Task[]) => void): Unsubscribe => {
  const q = query(collection(db, 'tasks'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    // Sort by createdAt desc in memory since we might not have a composite index
    tasks.sort((a, b) => b.createdAt - a.createdAt);
    callback(tasks);
  });
};

export const addTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'tasks'), task);
  return docRef.id;
};

export const updateTask = async (id: string, task: Partial<Task>): Promise<void> => {
  await updateDoc(doc(db, 'tasks', id), task);
};

export const deleteTask = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'tasks', id));
};

// Admin functions
export const adminGetAllUsers = getAllUsers;
export const adminUpdateUserRole = async (uid: string, role: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { role });
};
export const adminDeleteUser = deleteUser;
export const adminResetPassword = async (uid: string, newPassword: string): Promise<void> => {
  // Note: Client-side Firebase SDK does not allow resetting other users' passwords.
  // This would typically be handled by a Firebase Cloud Function or Admin SDK.
  // For now, we'll just update a field in the user document as a placeholder
  // or throw an error explaining the limitation.
  console.warn("adminResetPassword called. This requires Admin SDK/Cloud Functions.");
  await updateDoc(doc(db, 'users', uid), { _pendingPasswordReset: true });
};
