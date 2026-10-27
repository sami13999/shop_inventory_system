import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend }) {
  const colorMap = {
    primary: {
      border: 'rgba(99, 102, 241, 0.3)',
      bg: 'rgba(99, 102, 241, 0.1)',
      icon: '#818cf8'
    },
    success: {
      border: 'rgba(16, 185, 129, 0.3)',
      bg: 'rgba(16, 185, 129, 0.1)',
      icon: '#34d399'
    },
    warning: {
      border: 'rgba(245, 158, 11, 0.3)',
      bg: 'rgba(245, 158, 11, 0.1)',
      icon: '#fbbf24'
    },
    danger: {
      border: 'rgba(244, 63, 94, 0.3)',
      bg: 'rgba(244, 63, 94, 0.1)',
      icon: '#fb7185'
    },
    info: {
      border: 'rgba(6, 182, 212, 0.3)',
      bg: 'rgba(6, 182, 212, 0.1)',
      icon: '#38bdf8'
    }
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            {title}
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }} className="font-mono">
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
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: scheme.bg,
            border: `1px solid ${scheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: scheme.icon
          }}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {trend && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {trend}
        </div>
      )}
    </div>
  );
}
