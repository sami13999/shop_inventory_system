import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  Receipt, 
  TrendingUp, 
  LogOut,
  Store,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: '⌘1' },
    { to: '/pos', label: 'POS Terminal', icon: ShoppingCart, badge: 'LIVE', shortcut: '⌘2' },
    { to: '/products', label: 'Products & Stock', icon: Package, shortcut: '⌘3' },
    { to: '/customers', label: 'Khata & Customers', icon: Users, shortcut: '⌘4' },
    { to: '/suppliers', label: 'Suppliers', icon: Truck, shortcut: '⌘5' },
    { to: '/purchases', label: 'Stock Purchases', icon: TrendingUp, shortcut: '⌘6' },
    { to: '/bills', label: 'Sales Invoices', icon: Receipt, shortcut: '⌘7' },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 6px 18px var(--primary-glow)',
          animation: 'floatGentle 4s ease-in-out infinite'
        }}>
          <Store size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1 style={{ 
              fontSize: '18px', 
              fontWeight: 800, 
              margin: 0, 
              letterSpacing: '-0.03em', 
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              AuraPOS
            </h1>
            <span style={{ 
              fontSize: '9px', 
              fontWeight: 800, 
              padding: '1px 5px', 
              borderRadius: '4px', 
              backgroundColor: 'var(--primary-subtle)', 
              color: 'var(--primary)',
              letterSpacing: '0.04em'
            }}>
              PRO
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
            Enterprise POS & Khata
          </span>
        </div>
      </div>

      {/* Navigation Links with Active Indicator & Shortcuts */}
      <nav style={{ padding: '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 12px 8px' }}>
          Navigation
        </p>
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`animate-slide-up stagger-${idx + 1}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                boxShadow: isActive ? '0 4px 14px var(--primary-glow)' : 'none',
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                    <Icon size={17} style={{ color: isActive ? '#ffffff' : 'var(--text-secondary)' }} />
                    <span style={{ color: isActive ? '#ffffff' : 'inherit' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.badge && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--success)',
                        color: '#ffffff',
                        letterSpacing: '0.04em'
                      }}>
                        {item.badge}
                      </span>
                    )}
                    <span style={{
                      fontSize: '10px',
                      color: isActive ? 'rgba(255, 255, 255, 0.6)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {item.shortcut}
                    </span>
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div style={{
        padding: '16px 18px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-subtle)',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--primary)',
              boxShadow: '0 0 10px var(--primary-glow)'
            }}>
              {user?.user_name ? user.user_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {user?.user_name || 'Admin'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Online Cashier</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
