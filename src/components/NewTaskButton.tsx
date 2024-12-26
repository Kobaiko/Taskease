import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../hooks/useCredits';

interface NewTaskButtonProps {
  onClick: () => void;
}

export function NewTaskButton({ onClick }: NewTaskButtonProps) {
  const { currentUser } = useAuth();
  const { hasAvailableCredits } = useCredits(currentUser?.uid);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 h-9 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
    >
      <Plus className="h-5 w-5" />
      <span className="hidden sm:inline">New Task</span>
    </button>
  );
}