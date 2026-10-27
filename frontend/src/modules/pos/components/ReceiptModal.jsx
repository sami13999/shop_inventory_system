import React from 'react';
import { Printer, CheckCircle, RefreshCw } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';

export default function ReceiptModal({ isOpen, onClose, bill, onNewOrder }) {
  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => `Rs ${Number(val || 0).toFixed(2)}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sale Completed Successfully" maxWidth="500px">
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px'
        }}>
          <CheckCircle size={28} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Invoice #{bill.bill_id}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Inventory stock has been deducted automatically by MySQL triggers.
        </p>
      </div>

      {/* Printable Receipt Paper Container */}
      <div 
        id="printable-receipt"
        style={{
          backgroundColor: '#fff',
          color: '#111827',
          padding: '24px',
          borderRadius: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          marginBottom: '20px'
        }}
      >
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #9ca3af', paddingBottom: '12px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#111827', margin: 0, textTransform: 'uppercase' }}>
            AuraPOS Store
          </h2>
          <p style={{ margin: '2px 0', fontSize: '11px', color: '#4b5563' }}>Main Commercial Market, Retail Hub</p>
          <p style={{ margin: '2px 0', fontSize: '11px', color: '#4b5563' }}>Tel: +92 300 0000000</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
          <span>Invoice: INV-{String(bill.bill_id).padStart(4, '0')}</span>
          <span>{new Date(bill.bill_date || Date.now()).toLocaleDateString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
          <span>Customer: {bill.customer_name || 'Walk-in Customer'}</span>
          <span>Cashier: {bill.cashier_name || 'Admin'}</span>
        </div>

        <div style={{ borderTop: '1px dashed #9ca3af', borderBottom: '1px dashed #9ca3af', padding: '8px 0', margin: '8px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', fontWeight: 700, marginBottom: '6px' }}>
            <span>Item</span>
            <span style={{ textAlign: 'center' }}>Qty</span>
            <span style={{ textAlign: 'right' }}>Price</span>
            <span style={{ textAlign: 'right' }}>Total</span>
          </div>
          {bill.items && bill.items.map((it, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.product_name}</span>
              <span style={{ textAlign: 'center' }}>{it.quantity}</span>
              <span style={{ textAlign: 'right' }}>{Number(it.unit_price).toFixed(2)}</span>
              <span style={{ textAlign: 'right' }}>{Number(it.line_total).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Discount:</span>
            <span>- {formatCurrency(bill.discount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '14px', borderTop: '1px solid #111', paddingTop: '4px' }}>
            <span>Total Bill:</span>
            <span>{formatCurrency(bill.total_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857', fontWeight: 700 }}>
            <span>Amount Paid:</span>
            <span>{formatCurrency(bill.paid_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: Number(bill.balance_due) > 0 ? '#b91c1c' : '#111' }}>
            <span>{Number(bill.balance_due) > 0 ? 'Remaining Balance (Due):' : 'Change Returned:'}</span>
            <span>{formatCurrency(Math.abs(bill.balance_due || 0))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
            <span>Payment Status:</span>
            <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{bill.payment_status}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', borderTop: '1px dashed #9ca3af', paddingTop: '10px', marginTop: '12px', fontSize: '10px', color: '#6b7280' }}>
          Thank you for shopping with us! Please come again.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button onClick={handlePrint} className="btn btn-secondary">
          <Printer size={16} />
          <span>Print Thermal Receipt</span>
        </button>
        <button onClick={onNewOrder} className="btn btn-primary">
          <RefreshCw size={16} />
          <span>New Order</span>
        </button>
      </div>
    </Modal>
  );
}
