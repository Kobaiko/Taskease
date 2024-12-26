import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
        aria-labelledby="taskEaseLogoTitle"
        role="img"
      >
        <title id="taskEaseLogoTitle">TaskEase Logo</title>
        <defs>
          <filter id="inner-shadow-large">
            <feOffset dx="0" dy="3" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.75" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          className="fill-purple-600 dark:fill-purple-500"
          filter="url(#inner-shadow-large)"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className={`ml-2 font-bold ${textSizeClasses[size]}`}>TaskEase</span>
      )}
    </div>
  );
}