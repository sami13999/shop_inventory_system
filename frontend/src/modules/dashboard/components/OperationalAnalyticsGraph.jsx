import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  Layers, 
  Sparkles,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import Badge from '../../../components/ui/Badge';

export default function OperationalAnalyticsGraph({ data }) {
  const [activeView, setActiveView] = useState('inventory'); // 'inventory' or 'velocity'
  const [hoveredDay, setHoveredDay] = useState(null);

  const inventory = data?.inventory || {};
  const categories = data?.categories_distribution || [];
  const velocity = data?.weekly_velocity || [];

  const totalProds = inventory.total_products || 0;
  const healthyCount = inventory.healthy_stock_count || 0;
  const lowCount = inventory.low_stock_count || 0;
  const outCount = inventory.out_of_stock_count || 0;
  const totalUnits = inventory.total_stock_units || 0;
  const healthScore = inventory.health_score !== undefined ? inventory.health_score : 100;

  // Radial calculation (radius 46, circumference ~289.02)
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  // Velocity calculation for SVG Bar / Line Chart
  const maxDailyAmount = Math.max(...velocity.map(v => v.amount), 100);
  const totalWeeklyRevenue = velocity.reduce((sum, v) => sum + v.amount, 0);
  const totalWeeklyOrders = velocity.reduce((sum, v) => sum + v.orders, 0);

  const formatCurrency = (val) => `Rs ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '16px 20px', position: 'relative' }}>
      {/* Top Header & View Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Activity size={14} />
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Operational Health & Analytics Studio
            </h3>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 32px' }}>
            Interactive visual synthesis of inventory composition and revenue velocity
          </p>
        </div>

        {/* View Switcher Pills */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-subtle)',
          padding: '3px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveView('inventory')}
            className="btn btn-sm"
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '4px 12px',
              fontSize: '11px',
              backgroundColor: activeView === 'inventory' ? 'var(--primary)' : 'transparent',
              color: activeView === 'inventory' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: activeView === 'inventory' ? '0 2px 8px var(--primary-glow)' : 'none',
              fontWeight: 700,
              gap: '5px'
            }}
          >
            <PieChart size={13} />
            <span>Inventory Health & Composition</span>
          </button>
          <button
            onClick={() => setActiveView('velocity')}
            className="btn btn-sm"
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '4px 12px',
              fontSize: '11px',
              backgroundColor: activeView === 'velocity' ? 'var(--primary)' : 'transparent',
              color: activeView === 'velocity' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: activeView === 'velocity' ? '0 2px 8px var(--primary-glow)' : 'none',
              fontWeight: 700,
              gap: '5px'
            }}
          >
            <TrendingUp size={13} />
            <span>7-Day Revenue Velocity</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: INVENTORY HEALTH & COMPOSITION */}
      {activeView === 'inventory' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(240px, 1.2fr) minmax(240px, 1.2fr)',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Circular Donut Health Meter */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 12px',
            position: 'relative'
          }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="var(--bg-subtle)"
                  strokeWidth="10"
                />
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                {/* Animated Health Stroke */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={healthScore >= 70 ? 'url(#healthGradient)' : 'url(#warningGradient)'}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    filter: healthScore >= 70 ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' : 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.4))'
                  }}
                />
              </svg>

              {/* Text inside donut */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <span className="font-mono" style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {healthScore}%
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: healthScore >= 70 ? 'var(--success)' : 'var(--warning)', marginTop: '3px' }}>
                  {healthScore >= 90 ? 'OPTIMAL' : healthScore >= 70 ? 'STABLE' : 'ATTENTION'}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {totalUnits} Total Units
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                Across {totalProds} product items
              </span>
            </div>
          </div>

          {/* Center 3 Health Segment Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {/* Healthy Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 13px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--success-subtle)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={15} />
                </div>
                <div>
                  <h5 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Healthy Stock (&gt; 10 units)
                  </h5>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Optimal retail supply levels
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--success)' }}>
                  {healthyCount}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                  {totalProds > 0 ? `${Math.round((healthyCount / totalProds) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Low Stock Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 13px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)',
              border: lowCount > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-subtle)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--warning-subtle)',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h5 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Low Stock Warning (1 - 10 units)
                  </h5>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Requires procurement replenishment
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--warning)' }}>
                  {lowCount}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                  {totalProds > 0 ? `${Math.round((lowCount / totalProds) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Out of Stock Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 13px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)',
              border: outCount > 0 ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid var(--border-subtle)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--danger-subtle)',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertOctagon size={15} />
                </div>
                <div>
                  <h5 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Out of Stock (0 units)
                  </h5>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Unavailable for customer sales
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--danger)' }}>
                  {outCount}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                  {totalProds > 0 ? `${Math.round((outCount / totalProds) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Category Inventory Distribution */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '9px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                Category Stock Allocation
              </span>
              <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>
                {categories.length} Categories
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '115px', overflowY: 'auto' }}>
              {categories.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: '14px 0' }}>
                  No categories recorded yet.
                </p>
              ) : (
                categories.map(cat => {
                  const percent = totalUnits > 0 ? Math.round((cat.total_stock / totalUnits) * 100) : 0;
                  return (
                    <div key={cat.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</span>
                        <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {cat.total_stock} units ({percent}%)
                        </span>
                      </div>
                      <div style={{
                        height: '5px',
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(8, percent))}%`,
                          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 7-DAY REVENUE VELOCITY CHART */}
      {activeView === 'velocity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
          {/* Top KPI Summary Chips */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>7-Day Total Revenue:</span>
              <strong className="font-mono" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                {formatCurrency(totalWeeklyRevenue)}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Sales Count:</span>
              <strong className="font-mono" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                {totalWeeklyOrders} bills
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Hover bars for daily transaction detail
              </span>
            </div>
          </div>

          {/* Interactive SVG Bar & Trend Chart */}
          <div style={{
            height: '180px',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '20px 20px 10px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Grid Reference Lines */}
            <div style={{ position: 'absolute', inset: '10px 20px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              <div style={{ borderBottom: '1px dashed var(--border-subtle)', width: '100%' }} />
              <div style={{ borderBottom: '1px dashed var(--border-subtle)', width: '100%' }} />
              <div style={{ borderBottom: '1px dashed var(--border-subtle)', width: '100%' }} />
            </div>

            {velocity.map((item, idx) => {
              const heightPercent = maxDailyAmount > 0 ? Math.max(8, (item.amount / maxDailyAmount) * 100) : 8;
              const isHovered = hoveredDay?.date === item.date;

              return (
                <div
                  key={item.date}
                  onMouseEnter={() => setHoveredDay(item)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 2,
                    padding: '0 8px'
                  }}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% - 10px)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card-solid)',
                      border: '1px solid var(--border-hover)',
                      boxShadow: '0 4px 14px var(--primary-glow)',
                      color: '#ffffff',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      animation: 'slideUpFade 0.15s ease'
                    }}>
                      <div style={{ fontWeight: 800 }}>{item.day} ({item.date})</div>
                      <div className="font-mono" style={{ color: '#34d399' }}>{formatCurrency(item.amount)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{item.orders} order{item.orders === 1 ? '' : 's'}</div>
                    </div>
                  )}

                  {/* Vertical Revenue Bar */}
                  <div
                    style={{
                      width: '32px',
                      height: `${heightPercent}%`,
                      background: isHovered 
                        ? 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)' 
                        : item.amount > 0 
                          ? 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)' 
                          : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px 6px 2px 2px',
                      transition: 'all 0.25s ease',
                      boxShadow: isHovered || item.amount > 0 ? '0 4px 12px var(--primary-glow)' : 'none',
                      transform: isHovered ? 'scaleY(1.05)' : 'none',
                      transformOrigin: 'bottom'
                    }}
                  />

                  {/* Day Label */}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isHovered ? 800 : 600,
                    color: isHovered ? 'var(--primary)' : 'var(--text-secondary)',
                    marginTop: '8px',
                    transition: 'color 0.15s ease'
                  }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
