import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Phone,
  MapPin
} from 'lucide-react';
import { customersApi, billsApi } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState('khata'); // 'khata' or 'directory'
  const [customers, setCustomers] = useState([]);
  const [khataLedger, setKhataLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dueOnly, setDueOnly] = useState(false);

  // Add/Edit Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Customer Ledger Drawer / Modal
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);

  // Quick Payment Receive Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentBill, setPaymentBill] = useState(null);
  const [newPaidAmount, setNewPaidAmount] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCustRes, khataRes] = await Promise.all([
        customersApi.getAll(search),
        customersApi.getKhata({ search, due_only: dueOnly })
      ]);
      if (allCustRes.success) setCustomers(allCustRes.data);
      if (khataRes.success) setKhataLedger(khataRes.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, dueOnly]);

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '' });
    setIsCustomerModalOpen(true);
  };

  const openEditCustomer = (c) => {
    setEditingCustomer(c);
    setFormData({ name: c.name, phone: c.phone || '', address: c.address || '' });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setSavingCustomer(true);
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.customer_id, formData);
      } else {
        await customersApi.create(formData);
      }
      setIsCustomerModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customersApi.delete(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  const openCustomerLedger = async (customer) => {
    setSelectedLedgerCustomer(customer);
    setIsLedgerModalOpen(true);
    setLoadingBills(true);
    try {
      const res = await customersApi.getBills(customer.customer_id);
      if (res.success) {
        setCustomerBills(res.data);
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoadingBills(false);
    }
  };

  const openPaymentModal = (bill) => {
    setPaymentBill(bill);
    setNewPaidAmount(bill.total_amount.toString());
    setIsPaymentModalOpen(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!paymentBill) return;
    setSavingPayment(true);
    try {
      await billsApi.updatePayment(paymentBill.bill_id, newPaidAmount);
      setIsPaymentModalOpen(false);
      // Refresh current customer bills and khata data
      const res = await customersApi.getBills(selectedLedgerCustomer.customer_id);
      if (res.success) setCustomerBills(res.data);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const formatCurrency = (val) => `Rs ${Number(val || 0).toFixed(2)}`;

  const totalOutstandingDue = khataLedger.reduce((acc, c) => acc + Number(c.remaining_balance || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Banner Overview */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fb7185', display: 'block', marginBottom: '4px' }}>
            Khata Credit & Receivables
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
            Total Outstanding Customer Debt:{' '}
            <span className="font-mono" style={{ color: totalOutstandingDue > 0 ? '#fb7185' : '#34d399' }}>
              {formatCurrency(totalOutstandingDue)}
            </span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
            Live khata ledger dynamically computed via SQL joins between customers and bills table.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('khata')}
            className="btn btn-sm"
            style={{
              backgroundColor: activeTab === 'khata' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'khata' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '8px 16px',
              fontWeight: 700
            }}
          >
            Khata Ledger View
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className="btn btn-sm"
            style={{
              backgroundColor: activeTab === 'directory' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'directory' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '8px 16px',
              fontWeight: 700
            }}
          >
            Customer Directory
          </button>
          <button
            onClick={openAddCustomer}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', padding: '8px 16px' }}
          >
            <Plus size={15} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', height: '40px' }}
            placeholder="Search customer by name, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        </div>

        {activeTab === 'khata' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={dueOnly}
              onChange={(e) => setDueOnly(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>Filter Outstanding Due Only</span>
          </label>
        )}
      </div>

      {/* Tab Content 1: Khata Ledger View */}
      {activeTab === 'khata' && (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total Invoices</th>
                <th>Total Billed</th>
                <th>Total Paid</th>
                <th>Remaining Debt (Due)</th>
                <th>Ledger Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {khataLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No customer khata records found.
                  </td>
                </tr>
              ) : (
                khataLedger.map((row) => {
                  const remaining = Number(row.remaining_balance || 0);
                  const isClear = remaining <= 0;

                  return (
                    <tr key={row.customer_id}>
                      <td style={{ fontWeight: 700, fontSize: '14px' }}>
                        {row.customer_name}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {row.phone || 'N/A'}
                      </td>
                      <td className="font-mono">
                        {row.total_bills} bill{row.total_bills === 1 ? '' : 's'}
                      </td>
                      <td className="font-mono">
                        {formatCurrency(row.total_purchase_amount)}
                      </td>
                      <td className="font-mono" style={{ color: '#34d399' }}>
                        {formatCurrency(row.total_paid_amount)}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 800 }}>
                        <span style={{ color: isClear ? '#34d399' : '#fb7185' }}>
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td>
                        {isClear ? (
                          <Badge variant="success">All Clear</Badge>
                        ) : (
                          <Badge variant="danger">Pending Debt</Badge>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openCustomerLedger(row)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px' }}
                        >
                          <FileText size={14} />
                          <span>View Statement</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 2: Customer Directory */}
      {activeTab === 'directory' && (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Name</th>
                <th>Contact Phone</th>
                <th>Billing Address</th>
                <th>Lifetime Spent</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No customers found. Click "Add Customer" to add one.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.customer_id}>
                    <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                      #{c.customer_id}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '14px' }}>{c.name}</td>
                    <td>{c.phone || 'N/A'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.address || 'N/A'}</td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{formatCurrency(c.total_spent)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditCustomer(c)}
                          className="btn btn-secondary btn-sm"
                          title="Edit"
                          style={{ padding: '6px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.customer_id)}
                          className="btn btn-danger btn-sm"
                          title="Delete"
                          style={{ padding: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer'}
      >
        <form onSubmit={handleSaveCustomer}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tariq Mehmood"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 03001234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address / Shop Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. G-9 Markaz, Islamabad"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCustomer}
              className="btn btn-primary"
            >
              {savingCustomer ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detailed Statement / Ledger Modal */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={`Khata Statement: ${selectedLedgerCustomer?.customer_name || selectedLedgerCustomer?.name}`}
        maxWidth="740px"
      >
        <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Phone: {selectedLedgerCustomer?.phone || 'N/A'}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Address: {selectedLedgerCustomer?.address || 'N/A'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining Debt Balance</span>
            <h3 className="font-mono" style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fb7185' }}>
              {formatCurrency(selectedLedgerCustomer?.remaining_balance)}
            </h3>
          </div>
        </div>

        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Invoices Breakdown</h4>
        <div className="table-container" style={{ maxHeight: '320px', overflowY: 'auto' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customerBills.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No sales invoices recorded for this customer yet.
                  </td>
                </tr>
              ) : (
                customerBills.map(bill => (
                  <tr key={bill.bill_id}>
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      INV-{String(bill.bill_id).padStart(4, '0')}
                    </td>
                    <td>{new Date(bill.bill_date).toLocaleDateString()}</td>
                    <td className="font-mono">{formatCurrency(bill.total_amount)}</td>
                    <td className="font-mono" style={{ color: '#34d399' }}>{formatCurrency(bill.paid_amount)}</td>
                    <td className="font-mono" style={{ color: Number(bill.balance_due) > 0 ? '#fb7185' : '#34d399', fontWeight: 700 }}>
                      {formatCurrency(bill.balance_due)}
                    </td>
                    <td>
                      <Badge variant={bill.payment_status}>{bill.payment_status}</Badge>
                    </td>
                    <td>
                      {Number(bill.balance_due) > 0 && (
                        <button
                          onClick={() => openPaymentModal(bill)}
                          className="btn btn-success btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Receive Cash
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={() => setIsLedgerModalOpen(false)} className="btn btn-secondary">
            Close
          </button>
        </div>
      </Modal>

      {/* Receive Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Receive Payment for Invoice #${paymentBill?.bill_id}`}
        maxWidth="440px"
      >
        {paymentBill && (
          <form onSubmit={handleUpdatePayment}>
            <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Total Invoice: <strong style={{ color: '#fff' }} className="font-mono">{formatCurrency(paymentBill.total_amount)}</strong><br />
              Previously Paid: <strong style={{ color: '#34d399' }} className="font-mono">{formatCurrency(paymentBill.paid_amount)}</strong><br />
              Remaining Due: <strong style={{ color: '#fb7185' }} className="font-mono">{formatCurrency(paymentBill.balance_due)}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">New Total Paid Amount (Rs) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input font-mono"
                value={newPaidAmount}
                onChange={(e) => setNewPaidAmount(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Enter the updated total cumulative amount paid for this invoice.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPayment}
                className="btn btn-success"
              >
                {savingPayment ? 'Updating...' : 'Record Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
