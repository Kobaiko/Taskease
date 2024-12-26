import React from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  reverseButtonOrder?: boolean;
}

export function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  confirmButtonClassName,
  cancelButtonClassName,
  reverseButtonOrder = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const defaultConfirmClass = `px-4 py-2 text-white rounded-lg transition-colors ${
    isDangerous 
      ? 'bg-red-600 hover:bg-red-700' 
      : 'bg-blue-600 hover:bg-blue-700'
  }`;

  const defaultCancelClass = "px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";

  const buttons = [
    <button
      key="cancel"
      onClick={onClose}
      className={cancelButtonClassName || defaultCancelClass}
    >
      {cancelText}
    </button>,
    <button
      key="confirm"
      onClick={onConfirm}
      className={confirmButtonClassName || defaultConfirmClass}
    >
      {confirmText}
    </button>
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
          <div className="text-gray-600 dark:text-gray-300 mb-6">{message}</div>
          <div className="flex justify-end gap-3">
            {reverseButtonOrder ? buttons.reverse() : buttons}
          </div>
        </div>
      </div>
    </div>
  );
}