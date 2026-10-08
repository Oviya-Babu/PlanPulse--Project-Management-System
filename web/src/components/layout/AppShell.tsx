import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Toaster } from 'sonner';

export const AppShell: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('pms_theme') === 'dark' ||
      (!('pms_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pms_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pms_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Navbar onToggleTheme={toggleTheme} isDark={isDark} />
      <main className="flex-1 container py-6 px-4 sm:px-8 max-w-7xl">
        <Outlet />
      </main>
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground">
        PlanPulse &mdash; Project Management System &copy; {new Date().getFullYear()}
      </footer>
      <Toaster position="top-right" richColors />
    </div>
  );
};
