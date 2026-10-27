import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend, delay = 0 }) {
  const colorMap = {
    primary: {
      border: 'rgba(99, 102, 241, 0.25)',
      bg: 'var(--primary-subtle)',
      icon: 'var(--primary)',
      glow: 'var(--primary-glow)',
      bar: '#6366f1'
    },
    success: {
      border: 'rgba(16, 185, 129, 0.25)',
      bg: 'var(--success-subtle)',
      icon: 'var(--success)',
      glow: 'var(--success-glow)',
      bar: '#10b981'
    },
    warning: {
      border: 'rgba(245, 158, 11, 0.25)',
      bg: 'var(--warning-subtle)',
      icon: 'var(--warning)',
      glow: 'var(--warning-glow)',
      bar: '#f59e0b'
    },
    danger: {
      border: 'rgba(244, 63, 94, 0.25)',
      bg: 'var(--danger-subtle)',
      icon: 'var(--danger)',
      glow: 'var(--danger-glow)',
      bar: '#f43f5e'
    },
    info: {
      border: 'rgba(6, 182, 212, 0.25)',
      bg: 'var(--info-subtle)',
      icon: 'var(--info)',
      glow: 'rgba(6, 182, 212, 0.25)',
      bar: '#06b6d4'
    }
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div 
      className="glass-panel glass-panel-hover animate-slide-up"
      style={{ 
        padding: '22px 24px', 
        position: 'relative', 
        overflow: 'hidden',
        animationDelay: `${delay}s`
      }}
    >
      {/* Ambient Radial Glow in background */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: scheme.glow,
        filter: 'blur(40px)',
        opacity: 0.45,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div>
          <p style={{ 
            fontSize: '11px', 
            fontWeight: 800, 
            color: 'var(--text-secondary)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.06em', 
            marginBottom: '8px' 
          }}>
            {title}
          </p>
          <h2 
            style={{ 
              fontSize: '28px', 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              margin: 0, 
              letterSpacing: '-0.03em' 
            }} 
            className="font-mono"
          >
            {value}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: scheme.bg,
            border: `1px solid ${scheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: scheme.icon,
            boxShadow: `0 4px 14px ${scheme.glow}`,
            transition: 'transform 0.25s ease'
          }}>
            <Icon size={24} />
          </div>
        )}
      </div>

      {/* Decorative Bottom Progress Accent */}
      <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>{trend}</span>
          <span style={{ width: '32px', height: '3px', borderRadius: '2px', backgroundColor: scheme.bar, display: 'inline-block' }} />
        </div>
      </div>
    </div>
  );
}
