import { useState, useEffect } from 'react';
import { getUserTheme, saveUserTheme } from '../services/userService';

export function useTheme(userId: string | undefined) {
  const [isDark, setIsDark] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (!userId) return;

    async function loadTheme() {
      const theme = await getUserTheme(userId);
      const isDarkTheme = theme === 'dark' || 
        (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkTheme);
      document.documentElement.classList.toggle('dark', isDarkTheme);
    }

    loadTheme();
  }, [userId]);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    if (userId) {
      await saveUserTheme(userId, newTheme ? 'dark' : 'light');
    }
  };

  return { isDark, toggleTheme };
}