import React, { useState, useEffect } from 'react';
import { Plus, Sun, Moon, User } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { NewTaskModal } from '../components/NewTaskModal';
import { ProfilePopup } from '../components/ProfilePopup';
import { CreditDisplay } from '../components/CreditDisplay';
import { CookieConsent } from '../components/CookieConsent';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { getUserTasks, createTask, updateTask, deleteTask, updateSubtaskStatus } from '../services/taskService';
import { saveUserTheme, getUserTheme } from '../services/userService';
import { getUserCredits } from '../services/creditService';
import type { Task, SubTask } from '../types';

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [credits, setCredits] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadUserData();
      loadTheme();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      const [userTasks, userCredits] = await Promise.all([
        getUserTasks(currentUser!.uid),
        getUserCredits(currentUser!.uid)
      ]);

      // Sort tasks by creation date, newest first
      const sortedTasks = userTasks.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      setTasks(sortedTasks);
      setCredits(userCredits);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadTheme = async () => {
    if (currentUser) {
      const theme = await getUserTheme(currentUser.uid);
      const isDarkTheme = theme === 'dark' || 
        (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkTheme);
      document.documentElement.classList.toggle('dark', isDarkTheme);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    if (currentUser) {
      await saveUserTheme(currentUser.uid, newTheme ? 'dark' : 'light');
    }
  };

  const handleCreateTask = async (title: string, description: string, subTasks: SubTask[]) => {
    if (!currentUser) return;

    try {
      const newTask: Omit<Task, 'id'> = {
        userId: currentUser.uid,
        title,
        description,
        subTasks: subTasks.map(st => ({
          id: st.id,
          title: st.title,
          estimatedTime: st.estimatedTime,
          completed: false
        })),
        completed: false,
        createdAt: new Date()
      };

      const taskId = await createTask(currentUser.uid, newTask);

      setTasks(prevTasks => [{
        ...newTask,
        id: taskId
      }, ...prevTasks]);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
    }
  };

  const handleToggleSubTask = async (taskId: string, subTaskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const subTask = task.subTasks.find(st => st.id === subTaskId);
      if (!subTask) return;

      await updateSubtaskStatus(taskId, subTaskId, !subTask.completed);

      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === taskId) {
          const updatedSubTasks = t.subTasks.map(st =>
            st.id === subTaskId ? { ...st, completed: !st.completed } : st
          );
          return {
            ...t,
            subTasks: updatedSubTasks,
            completed: updatedSubTasks.every(st => st.completed)
          };
        }
        return t;
      }));
    } catch (err) {
      console.error('Error toggling subtask:', err);
      setError('Failed to update subtask');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const handleAddSubTask = async (taskId: string, subTask: SubTask) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = {
        ...task,
        subTasks: [...task.subTasks, subTask]
      };

      await updateTask(taskId, updatedTask);

      setTasks(prevTasks => prevTasks.map(t =>
        t.id === taskId ? updatedTask : t
      ));
    } catch (err) {
      console.error('Error adding subtask:', err);
      setError('Failed to add subtask');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size={40} className="text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Logo size="md" />
              <CreditDisplay credits={credits} />
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="User profile"
              >
                <User size={20} />
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 h-9 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
          {tasks.map(task => (
            <div key={task.id} className="h-fit">
              <TaskCard
                task={task}
                onToggleSubTask={handleToggleSubTask}
                onDeleteTask={handleDeleteTask}
                onAddSubTask={handleAddSubTask}
              />
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No tasks yet. Click "New Task" to get started!
            </p>
          </div>
        )}
      </main>

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        credits={credits}
        onCreditsUpdate={loadUserData}
      />

      <ProfilePopup
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <CookieConsent />
    </div>
  );
}