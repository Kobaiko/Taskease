import React from 'react';
import { CreditCard } from 'lucide-react';

interface CreditDisplayProps {
  credits: number;
}

export function CreditDisplay({ credits }: CreditDisplayProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
      <CreditCard size={16} className="text-blue-400" />
      <span className="text-sm font-medium">{credits} Credits</span>
    </div>
  );
}