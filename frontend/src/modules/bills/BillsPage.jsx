import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Eye, 
  CreditCard, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Filter
} from 'lucide-react';
import { billsApi } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ReceiptModal from '../pos/components/ReceiptModal';

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Bill for Thermal Receipt Modal
  const [selectedBill, setSelectedBill] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Payment Settlement Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [settlingBill, setSettlingBill] = useState(null);
  const [newPaidAmount, setNewPaidAmount] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await billsApi.getAll({
        search,
        payment_status: paymentStatus
      });
      if (res.success) setBills(res.data);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [search, paymentStatus]);

  const viewReceipt = async (id) => {
    try {
      const res = await billsApi.getById(id);
      if (res.success) {
        setSelectedBill(res.data);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to load receipt');
    }
  };

  const openPaymentModal = (bill) => {
    setSettlingBill(bill);
    setNewPaidAmount(bill.total_amount.toString());
    setIsPaymentModalOpen(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!settlingBill) return;
    setSavingPayment(true);
    try {
      await billsApi.updatePayment(settlingBill.bill_id, newPaidAmount);
      setIsPaymentModalOpen(false);
      loadBills();
    } catch (err) {
      alert(err.message || 'Failed to update payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const formatCurrency = (val) => `Rs ${Number(val || 0).toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      {/* Search and Filters */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '40px' }}
              placeholder="Search invoice #, customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="form-select"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            style={{ width: '160px', height: '40px' }}
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date & Time</th>
              <th>Cashier</th>
              <th>Total Items</th>
              <th>Grand Total</th>
              <th>Amount Paid</th>
              <th>Balance Due</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No sales invoices found matching your criteria.
                </td>
              </tr>
            ) : (
              bills.map((bill) => {
                const bal = Number(bill.balance_due || 0);

                return (
                  <tr key={bill.bill_id}>
                    <td className="font-mono" style={{ fontWeight: 800 }}>
                      INV-{String(bill.bill_id).padStart(4, '0')}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {bill.customer_name}
                      {bill.customer_phone && (
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {bill.customer_phone}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(bill.bill_date).toLocaleDateString()} {new Date(bill.bill_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {bill.cashier_name || 'Admin'}
                      </span>
                    </td>
                    <td className="font-mono">{bill.total_items} items</td>
                    <td className="font-mono" style={{ fontWeight: 800, color: '#818cf8' }}>
                      {formatCurrency(bill.total_amount)}
                    </td>
                    <td className="font-mono" style={{ color: '#34d399' }}>
                      {formatCurrency(bill.paid_amount)}
                    </td>
                    <td className="font-mono" style={{ color: bal > 0 ? '#fb7185' : '#34d399', fontWeight: 700 }}>
                      {formatCurrency(bal)}
                    </td>
                    <td>
                      <Badge variant={bill.payment_status}>
                        {bill.payment_status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => viewReceipt(bill.bill_id)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '4px' }}
                          title="Print / View Thermal Receipt"
                        >
                          <Printer size={13} />
                          <span>Receipt</span>
                        </button>
                        {bal > 0 && (
                          <button
                            onClick={() => openPaymentModal(bill)}
                            className="btn btn-success btn-sm"
                            style={{ gap: '4px' }}
                            title="Record Customer Payment"
                          >
                            <CreditCard size={13} />
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={selectedBill}
        onNewOrder={() => setIsReceiptOpen(false)}
      />

      {/* Payment Settlement Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Settle Payment for Invoice #INV-${String(settlingBill?.bill_id || '').padStart(4, '0')}`}
        maxWidth="440px"
      >
        {settlingBill && (
          <form onSubmit={handleUpdatePayment}>
            <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Customer: <strong style={{ color: '#fff' }}>{settlingBill.customer_name}</strong><br />
              Total Bill: <strong style={{ color: '#fff' }} className="font-mono">{formatCurrency(settlingBill.total_amount)}</strong><br />
              Current Paid: <strong style={{ color: '#34d399' }} className="font-mono">{formatCurrency(settlingBill.paid_amount)}</strong><br />
              Remaining Due: <strong style={{ color: '#fb7185' }} className="font-mono">{formatCurrency(settlingBill.balance_due)}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">New Cumulative Paid Amount (Rs) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input font-mono"
                value={newPaidAmount}
                onChange={(e) => setNewPaidAmount(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
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
                {savingPayment ? 'Saving...' : 'Update Settlement'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
