import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ pageTitle, pageSubtitle }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {pageTitle}
        </h2>
        {pageSubtitle && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            {pageSubtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => navigate('/pos')}
          className="btn btn-primary btn-sm"
          style={{ gap: '6px' }}
        >
          <ShoppingCart size={15} />
          <span>New Sale (POS)</span>
        </button>

        <div style={{
          height: '24px',
          width: '1px',
          backgroundColor: 'var(--border-subtle)',
          margin: '0 4px'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '999px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            Live DB Active
          </span>
        </div>
      </div>
    </header>
  );
}
