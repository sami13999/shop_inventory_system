import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Sun, 
  Moon, 
  Clock, 
  PanelLeftClose, 
  Menu,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ pageTitle, pageSubtitle, sidebarOpen = true, onToggleSidebar }) {
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
      {/* Left Section: Sidebar Toggle Button & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="btn btn-secondary"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-label="Toggle sidebar"
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            {sidebarOpen ? <PanelLeftClose size={15} /> : <Menu size={15} />}
            <span style={{ display: 'inline-block' }}>
              {sidebarOpen ? 'Collapse' : 'Menu'}
            </span>
          </button>
        )}

        <div className="animate-slide-up">
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {pageTitle}
          </h2>
          {pageSubtitle && (
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls: Live Clock, Theme Toggle, POS CTA, Status Beacon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Live Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 9px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }} className="font-mono">
          <Clock size={12} style={{ color: 'var(--primary)' }} />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          style={{ padding: '4px 10px', fontSize: '11px' }}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          <span className="theme-icon-spin" style={{ display: 'inline-flex' }}>
            {isDark ? (
              <Sun size={13} style={{ color: '#fbbf24' }} />
            ) : (
              <Moon size={13} style={{ color: '#6366f1' }} />
            )}
          </span>
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Quick New Sale CTA */}
        <button
          onClick={() => navigate('/pos')}
          className="btn btn-primary btn-sm"
          style={{ gap: '5px', padding: '5px 11px', fontSize: '11.5px', boxShadow: '0 3px 10px var(--primary-glow)' }}
        >
          <ShoppingCart size={13} />
          <span>New Sale (POS)</span>
        </button>

        <div style={{
          height: '20px',
          width: '1px',
          backgroundColor: 'var(--border-subtle)',
          margin: '0 1px'
        }} />

        {/* Live DB Active Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 9px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          fontSize: '11px'
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
