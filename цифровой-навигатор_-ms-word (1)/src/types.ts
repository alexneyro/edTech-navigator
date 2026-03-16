export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Reflection {
  method: 'self' | 'ai' | 'teacher';
  difficulty: string;
}

export interface Task {
  id: string;
  userId: string;
  lessonId?: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  subtasks: Subtask[];
  reflection?: Reflection;
  createdAt: number; // Timestamp
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  assignmentUrl: string;
  instructionUrl: string;
  order: number;
}

export interface AIProfile {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  createdAt: number;
}

export interface AISettings {
  activeProfileId: string | null;
  studentTips?: string;
}
