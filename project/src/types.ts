export interface SubTask {
  id: string;
  title: string;
  estimatedTime: number;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  subTasks: SubTask[];
  createdAt: Date;
  completed: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

export interface UserCredits {
  userId: string;
  credits: number;
  lastUpdated: Date;
}

export interface AdminUser {
  email: string;
  addedBy?: string;
  addedAt: Date;
}