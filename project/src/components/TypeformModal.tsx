import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface TypeformModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TypeformModal({ isOpen, onClose }: TypeformModalProps) {
  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script');
      script.src = '//embed.typeform.com/next/embed.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl h-[600px] relative">
        <button
          onClick={onClose}
          className="absolute -right-4 -top-4 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div className="w-full h-full">
          <div 
            data-tf-live="01JC91Y5WT0V8V1RN06DTFT5EM"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}