import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Sun, 
  Moon, 
  Clock, 
  Search,
  Sparkles,
  Command
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ pageTitle, pageSubtitle }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="top-header">
      {/* Page Title & Breadcrumb */}
      <div className="animate-slide-up">
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {pageTitle}
        </h2>
        {pageSubtitle && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            {pageSubtitle}
          </p>
        )}
      </div>

      {/* Right Controls: Live Clock, Theme Toggle, POS CTA, Status Beacon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Live Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }} className="font-mono">
          <Clock size={13} style={{ color: 'var(--primary)' }} />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          <span className="theme-icon-spin" style={{ display: 'inline-flex' }}>
            {isDark ? (
              <Sun size={15} style={{ color: '#fbbf24' }} />
            ) : (
              <Moon size={15} style={{ color: '#6366f1' }} />
            )}
          </span>
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Quick New Sale CTA */}
        <button
          onClick={() => navigate('/pos')}
          className="btn btn-primary btn-sm"
          style={{ gap: '6px', boxShadow: '0 4px 14px var(--primary-glow)' }}
        >
          <ShoppingCart size={14} />
          <span>New Sale (POS)</span>
        </button>

        <div style={{
          height: '24px',
          width: '1px',
          backgroundColor: 'var(--border-subtle)',
          margin: '0 2px'
        }} />

        {/* Live DB Active Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px'
        }}>
          <span className="live-beacon" />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            Live MySQL
          </span>
        </div>
      </div>
    </header>
  );
}
