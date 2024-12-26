import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { generateSubtasks } from '../lib/api';
import { deductCredit } from '../services/creditService';
import { ConfirmDialog } from './ConfirmDialog';
import { CreditsExhaustedModal } from './CreditsExhaustedModal';
import { NumberInput } from './NumberInput';
import type { SubTask } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, subTasks: SubTask[]) => void;
  onCreditsUpdate: () => void;
}

export function NewTaskModal({ isOpen, onClose, onSubmit, onCreditsUpdate }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState({ title: '', estimatedTime: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [showCreditsExhausted, setShowCreditsExhausted] = useState(false);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();
  const { credits, hasAvailableCredits } = useCredits(currentUser?.uid);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && credits === 0 && !showAddManual) {
      setShowCreditsExhausted(true);
    }
  }, [isOpen, credits, showAddManual]);

  const handleGenerateSubtasks = async () => {
    if (!title || !description || !currentUser) return;
    
    if (credits === 0) {
      setShowCreditsExhausted(true);
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      await deductCredit(currentUser.uid);
      const generatedSubtasks = await generateSubtasks(title, description);
      setSubTasks(generatedSubtasks.map(st => ({
        ...st,
        id: crypto.randomUUID()
      })));
      setShowAddManual(true);
      onCreditsUpdate();
    } catch (error) {
      console.error('Error generating subtasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate subtasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSubTask = () => {
    if (newSubTask.title && newSubTask.estimatedTime) {
      const subTask: SubTask = {
        id: crypto.randomUUID(),
        title: newSubTask.title,
        estimatedTime: parseInt(newSubTask.estimatedTime),
        completed: false,
      };
      setSubTasks([...subTasks, subTask]);
      setNewSubTask({ title: '', estimatedTime: '' });
    }
  };

  const handleDeleteSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description && subTasks.length > 0) {
      onSubmit(title, description, subTasks);
      setTitle('');
      setDescription('');
      setSubTasks([]);
      setShowAddManual(false);
      onClose();
    }
  };

  const handleClose = () => {
    if (title || description || subTasks.length > 0) {
      setShowConfirm(true);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setTitle('');
    setDescription('');
    setSubTasks([]);
    setShowAddManual(false);
    setShowConfirm(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Task</h2>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                  rows={3}
                  placeholder="Enter task description"
                  required
                />
              </div>

              {!subTasks.length && (
                <>
                  <button
                    type="button"
                    onClick={handleGenerateSubtasks}
                    disabled={!title || !description || isGenerating || credits === 0}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Subtasks'}
                  </button>
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {credits} credits remaining
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Subtasks
                </label>

                <div className="space-y-3">
                  {subTasks.map((subTask) => (
                    <div
                      key={subTask.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{subTask.title}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {subTask.estimatedTime}m
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubTask(subTask.id)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {showAddManual && (
                    <div key="add-subtask-form" className="grid grid-cols-[1fr,auto,auto] gap-2">
                      <input
                        type="text"
                        value={newSubTask.title}
                        onChange={(e) => setNewSubTask({ ...newSubTask, title: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white text-sm"
                        placeholder="Subtask"
                      />
                      <div className="w-32">
                        <NumberInput
                          value={newSubTask.estimatedTime}
                          onChange={(value) => setNewSubTask({ ...newSubTask, estimatedTime: value })}
                          min={1}
                          max={60}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSubTask}
                        className="w-9 h-9 flex items-center justify-center bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex-shrink-0"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  )}

                  {subTasks.length > 0 && !showAddManual && (
                    <button
                      key="add-subtask-button"
                      type="button"
                      onClick={() => setShowAddManual(true)}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add Subtask
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title || !description || subTasks.length === 0}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={resetAndClose}
        title="Discard Changes"
        message="Are you sure you want to discard your changes?"
        confirmText="Discard"
        cancelText="Cancel"
      />

      <CreditsExhaustedModal
        isOpen={showCreditsExhausted}
        onClose={() => {
          setShowCreditsExhausted(false);
          setShowAddManual(true);
        }}
      />
    </>
  );
}