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
import OperationalAnalyticsGraph from './components/OperationalAnalyticsGraph';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      {/* Executive Welcome Hero Banner */}
      <div 
        className="glass-panel" 
        style={{
          padding: '16px 22px',
          background: 'linear-gradient(135deg, var(--primary-subtle) 0%, rgba(139, 92, 246, 0.08) 50%, var(--success-subtle) 100%)',
          border: '1px solid var(--border-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ 
              fontSize: '10.5px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em', 
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={12} />
              Enterprise Store Command Center
            </span>
            <span className="live-beacon" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Shop Financials & Live Khata Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '3px' }}>
            Real-time calculations computed directly from MySQL relational transactions with 0 SQL views.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => fetchMetrics(true)} 
            className="btn btn-secondary btn-sm" 
            title="Refresh Live Data"
            disabled={refreshing}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spinSlow 0.8s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Updating...' : 'Sync Live'}</span>
          </button>
          <button 
            onClick={() => navigate('/pos')} 
            className="btn btn-primary" 
            style={{ gap: '7px', padding: '7px 15px', fontSize: '12.5px' }}
          >
            <ShoppingCart size={15} />
            <span>Launch POS Terminal</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--danger-subtle)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}

      {/* KPI Stat Cards Grid with Staggered Entrance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
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

      {/* Operational Health & Analytics Studio (Replaces simple line gauge) */}
      <OperationalAnalyticsGraph data={data} />

      {/* Two Column Layout: Recent Transactions & Low Stock Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '16px'
      }}>
        {/* Recent Sales Invoices */}
        <div className="glass-panel animate-slide-up stagger-3" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Recent Sales Transactions
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                Latest invoices recorded in system
              </p>
            </div>
            <button
              onClick={() => navigate('/bills')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
            >
              <span>View All</span>
              <ArrowRight size={12} />
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
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
        <div className="glass-panel animate-slide-up stagger-4" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-primary)' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
                <span>Low Stock Inventory Alerts</span>
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                Items that need stock procurement
              </p>
            </div>
            <button
              onClick={() => navigate('/purchases')}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
            >
              <span>Procure Stock</span>
              <ArrowUpRight size={12} />
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
