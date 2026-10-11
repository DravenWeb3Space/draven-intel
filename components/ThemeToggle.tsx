'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark'|'light'>('dark');

  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme');
    setTheme(t === 'light' ? 'light' : 'dark');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('draven_theme', next); } catch {}
  }

  return (
    <button className="btn-ghost" onClick={toggle} aria-label="Toggle light/dark theme" title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} style={{ fontSize:'15px', width:'28px', height:'28px' }}>
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  );
}
