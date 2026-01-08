import { useState, useEffect } from 'react';
import styles from '@/styles/ThemeToggle.module.css';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved ? saved === 'dark' : prefersDark;
    
    setIsDark(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <button 
      onClick={toggleTheme} 
      className={styles.toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className={`${styles.track} ${isDark ? styles.dark : styles.light}`}>
        <div className={styles.thumb}>
          {isDark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

