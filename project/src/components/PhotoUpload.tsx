import React from 'react';
import { User } from 'lucide-react';

interface PhotoUploadProps {
  className?: string;
}

export function PhotoUpload({ className = '' }: PhotoUploadProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <User className="h-12 w-12 text-gray-400" />
      </div>
    </div>
  );
}