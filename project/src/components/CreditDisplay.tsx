import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';

interface CreditDisplayProps {
  credits: number;
}

export function CreditDisplay({ credits }: CreditDisplayProps) {
  const navigate = useNavigate();

  if (credits === 0) {
    return (
      <button
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        <span className="text-sm font-medium">Subscribe</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
      <Coins size={16} className="text-blue-400" />
      <span className="text-sm font-medium">
        <span className="sm:hidden">{credits}</span>
        <span className="hidden sm:inline">{credits} Credits</span>
      </span>
    </div>
  );
}