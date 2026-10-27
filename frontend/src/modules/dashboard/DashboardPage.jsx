import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  Package, 
  Users, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { dashboardApi } from '../../api/client';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getMetrics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (val) => {
    return `Rs ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalProducts = data?.inventory?.total_products || 0;
  const lowStockCount = data?.inventory?.low_stock_count || 0;
  const outOfStockCount = data?.inventory?.out_of_stock_count || 0;
  const healthyCount = Math.max(0, totalProducts - lowStockCount - outOfStockCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }} className="animate-fade-in">
      {/* Executive Welcome Hero Banner */}
      <div 
        className="glass-panel" 
        style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, var(--primary-subtle) 0%, rgba(139, 92, 246, 0.08) 50%, var(--success-subtle) 100%)',
          border: '1px solid var(--border-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em', 
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={13} />
              Enterprise Store Command Center
            </span>
            <span className="live-beacon" />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Shop Financials & Live Khata Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px' }}>
            Real-time calculations computed directly from MySQL relational transactions with 0 SQL views.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => fetchMetrics(true)} 
            className="btn btn-secondary" 
            title="Refresh Live Data"
            disabled={refreshing}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spinSlow 0.8s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Updating...' : 'Sync Live'}</span>
          </button>
          <button 
            onClick={() => navigate('/pos')} 
            className="btn btn-primary btn-lg" 
            style={{ gap: '8px' }}
          >
            <ShoppingCart size={17} />
            <span>Launch POS Terminal</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--danger-subtle)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185'
        }}>
          {error}
        </div>
      )}

      {/* KPI Stat Cards Grid with Staggered Entrance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        <StatCard
          title="Total Gross Revenue"
          value={formatCurrency(data?.financials?.total_sales_amount)}
          subtitle={`${data?.financials?.total_bills_count || 0} completed sales invoices`}
          icon={DollarSign}
          color="primary"
          trend="Lifetime sales throughput"
          delay={0.05}
        />

        <StatCard
          title="Cash Collected"
          value={formatCurrency(data?.financials?.total_revenue_collected)}
          subtitle="Realized receipts & settlements"
          icon={TrendingUp}
          color="success"
          trend="100% verified transactions"
          delay={0.1}
        />

        <StatCard
          title="Khata Customer Debt"
          value={formatCurrency(data?.financials?.outstanding_khata_balance)}
          subtitle="Pending customer credit balances"
          icon={CreditCard}
          color={Number(data?.financials?.outstanding_khata_balance) > 0 ? 'warning' : 'info'}
          trend="Active credit receivables"
          delay={0.15}
        />

        <StatCard
          title="Low Stock Urgency"
          value={`${data?.inventory?.low_stock_count || 0} Items`}
          subtitle="Threshold: <= 10 units remaining"
          icon={AlertTriangle}
          color={Number(data?.inventory?.low_stock_count) > 0 ? 'danger' : 'success'}
          trend={`${data?.inventory?.total_products || 0} total active products`}
          delay={0.2}
        />
      </div>

      {/* Quick Launch & Inventory Health Bar */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Inventory Health Gauge
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Live stock ratio across active product catalog
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Healthy: <strong className="font-mono">{healthyCount}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              Low Stock: <strong className="font-mono">{lowStockCount}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
              Out of Stock: <strong className="font-mono">{outOfStockCount}</strong>
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{
          height: '10px',
          width: '100%',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          display: 'flex'
        }}>
          {totalProducts > 0 && (
            <>
              <div 
                style={{ 
                  width: `${(healthyCount / totalProducts) * 100}%`, 
                  backgroundColor: '#10b981',
                  transition: 'width 0.6s ease'
                }} 
                title={`Healthy: ${healthyCount}`}
              />
              <div 
                style={{ 
                  width: `${(lowStockCount / totalProducts) * 100}%`, 
                  backgroundColor: '#f59e0b',
                  transition: 'width 0.6s ease'
                }} 
                title={`Low: ${lowStockCount}`}
              />
              <div 
                style={{ 
                  width: `${(outOfStockCount / totalProducts) * 100}%`, 
                  backgroundColor: '#f43f5e',
                  transition: 'width 0.6s ease'
                }} 
                title={`Out: ${outOfStockCount}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Two Column Layout: Recent Transactions & Low Stock Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
        gap: '24px'
      }}>
        {/* Recent Sales Invoices */}
        <div className="glass-panel animate-slide-up stagger-3" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Recent Sales Transactions
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Latest invoices recorded in system
              </p>
            </div>
            <button
              onClick={() => navigate('/bills')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '5px 12px', gap: '5px' }}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.recent_bills || data.recent_bills.length === 0) ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No recent sales transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.recent_bills.map((bill) => (
                    <tr key={bill.bill_id}>
                      <td className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        INV-{String(bill.bill_id).padStart(4, '0')}
                      </td>
                      <td style={{ fontWeight: 600 }}>{bill.customer_name}</td>
                      <td className="font-mono">{formatCurrency(bill.total_amount)}</td>
                      <td className="font-mono" style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {formatCurrency(bill.paid_amount)}
                      </td>
                      <td>
                        <Badge variant={bill.payment_status}>
                          <span className="badge-dot" />
                          {bill.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-panel animate-slide-up stagger-4" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
                <span>Low Stock Inventory Alerts</span>
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Items that need stock procurement
              </p>
            </div>
            <button
              onClick={() => navigate('/purchases')}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11px', padding: '5px 12px', gap: '5px' }}
            >
              <span>Procure Stock</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>In Stock</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.low_stock_alerts || data.low_stock_alerts.length === 0) ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--success)' }}>
                      ✓ All product inventory levels are healthy (above 10 units)!
                    </td>
                  </tr>
                ) : (
                  data.low_stock_alerts.map((item) => (
                    <tr key={item.product_id}>
                      <td style={{ fontWeight: 700 }}>{item.product_name}</td>
                      <td>
                        <Badge variant="neutral">{item.category_name}</Badge>
                      </td>
                      <td>
                        <span className="badge badge-danger font-mono" style={{ fontWeight: 800 }}>
                          <span className="badge-dot" />
                          {item.stock_quantity} left
                        </span>
                      </td>
                      <td className="font-mono">{formatCurrency(item.selling_price)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
