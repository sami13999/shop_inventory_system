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
  PanelLeftClose
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen = true, onToggle }) {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'POS Terminal', icon: ShoppingCart, badge: 'LIVE' },
    { to: '/products', label: 'Products & Stock', icon: Package },
    { to: '/customers', label: 'Khata & Customers', icon: Users },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/purchases', label: 'Stock Purchases', icon: TrendingUp },
    { to: '/bills', label: 'Sales Invoices', icon: Receipt },
  ];

  return (
    <aside className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      {/* Brand Header */}
      <div style={{
        padding: '14px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px var(--primary-glow)',
            animation: 'floatGentle 4s ease-in-out infinite',
            flexShrink: 0
          }}>
            <Store size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <h1 style={{ 
                fontSize: '16px', 
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
                fontSize: '8.5px', 
                fontWeight: 800, 
                padding: '1px 4px', 
                borderRadius: '3px', 
                backgroundColor: 'var(--primary-subtle)', 
                color: 'var(--primary)',
                letterSpacing: '0.04em'
              }}>
                PRO
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.03em' }}>
              Enterprise POS & Khata
            </span>
          </div>
        </div>

        {/* Close Sidebar Button inside Sidebar Header */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="btn btn-secondary btn-sm"
            title="Close sidebar"
            aria-label="Close sidebar"
            style={{
              padding: '5px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* Navigation Links without shortcut tags */}
      <nav style={{ padding: '14px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 10px 6px' }}>
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
                padding: '8px 11px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                fontWeight: 600,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                boxShadow: isActive ? '0 3px 10px var(--primary-glow)' : 'none',
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <Icon size={15} style={{ color: isActive ? '#ffffff' : 'var(--text-secondary)' }} />
                    <span style={{ color: isActive ? '#ffffff' : 'inherit' }}>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--success)',
                      color: '#ffffff',
                      letterSpacing: '0.04em'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-subtle)',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--primary)',
              boxShadow: '0 0 8px var(--primary-glow)'
            }}>
              {user?.user_name ? user.user_name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {user?.user_name || 'Admin'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Online Cashier</span>
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
