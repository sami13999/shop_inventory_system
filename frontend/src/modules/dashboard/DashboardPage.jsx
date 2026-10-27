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
  RefreshCw
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { dashboardApi } from '../../api/client';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchMetrics = async () => {
    setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (val) => {
    return `Rs ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8', display: 'block', marginBottom: '6px' }}>
            Store Intelligence System
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#fff' }}>
            Welcome to AuraPOS Control Center
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Live aggregated metrics directly calculated from MySQL transactions without database views.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchMetrics} className="btn btn-secondary btn-sm" title="Refresh Live Data">
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => navigate('/pos')} className="btn btn-primary" style={{ gap: '8px' }}>
            <ShoppingCart size={16} />
            <span>Start POS Sale</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fda4af'
        }}>
          {error}
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px'
      }}>
        <StatCard
          title="Total Gross Sales"
          value={formatCurrency(data?.financials?.total_sales_amount)}
          subtitle={`${data?.financials?.total_bills_count || 0} completed invoices`}
          icon={DollarSign}
          color="primary"
          trend="Lifetime sales revenue"
        />

        <StatCard
          title="Revenue Collected"
          value={formatCurrency(data?.financials?.total_revenue_collected)}
          subtitle="Cash & settled receipts"
          icon={TrendingUp}
          color="success"
          trend="Realized cash flow"
        />

        <StatCard
          title="Outstanding Khata Debt"
          value={formatCurrency(data?.financials?.outstanding_khata_balance)}
          subtitle="Customer credit balance"
          icon={CreditCard}
          color={Number(data?.financials?.outstanding_khata_balance) > 0 ? 'warning' : 'info'}
          trend="Pending customer receivables"
        />

        <StatCard
          title="Low Stock Warning"
          value={`${data?.inventory?.low_stock_count || 0} Items`}
          subtitle={`Stock <= 10 threshold`}
          icon={AlertTriangle}
          color={Number(data?.inventory?.low_stock_count) > 0 ? 'danger' : 'success'}
          trend={`${data?.inventory?.total_products || 0} total active products`}
        />
      </div>

      {/* Two Column Layout: Recent Transactions & Low Stock Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
        gap: '24px'
      }}>
        {/* Recent Sales Invoices */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Recent Sales Transactions</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Latest customer invoices</p>
            </div>
            <button
              onClick={() => navigate('/bills')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                      No recent sales transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.recent_bills.map((bill) => (
                    <tr key={bill.bill_id}>
                      <td className="font-mono" style={{ fontWeight: 700 }}>
                        INV-{String(bill.bill_id).padStart(4, '0')}
                      </td>
                      <td style={{ fontWeight: 600 }}>{bill.customer_name}</td>
                      <td className="font-mono">{formatCurrency(bill.total_amount)}</td>
                      <td className="font-mono" style={{ color: '#34d399' }}>{formatCurrency(bill.paid_amount)}</td>
                      <td>
                        <Badge variant={bill.payment_status}>
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
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                <span>Low Stock Inventory Alerts</span>
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Items requiring procurement</p>
            </div>
            <button
              onClick={() => navigate('/purchases')}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              <span>Procure Stock</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
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
                    <td colSpan={4} style={{ textAlign: 'center', padding: '28px', color: '#34d399' }}>
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
