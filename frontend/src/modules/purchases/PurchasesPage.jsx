import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Search, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Truck,
  ArrowRight
} from 'lucide-react';
import { purchasesApi, suppliersApi, productsApi } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Purchase Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [items, setItems] = useState([
    { product_id: '', quantity: 1, unit_cost: '' }
  ]);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchRes, suppRes, prodRes] = await Promise.all([
        purchasesApi.getAll({ search }),
        suppliersApi.getAll(),
        productsApi.getAll()
      ]);
      if (purchRes.success) setPurchases(purchRes.data);
      if (suppRes.success) setSuppliers(suppRes.data);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Order Row Manipulation
  const addRow = () => {
    setItems(prev => [...prev, { product_id: '', quantity: 1, unit_cost: '' }]);
  };

  const removeRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateRow = (index, field, value) => {
    setItems(prev => prev.map((row, idx) => {
      if (idx === index) {
        const updated = { ...row, [field]: value };
        // Auto populate unit cost from product purchase price if product changed
        if (field === 'product_id') {
          const prod = products.find(p => p.product_id === parseInt(value, 10));
          if (prod && !row.unit_cost) {
            updated.unit_cost = prod.purchase_price;
          }
        }
        return updated;
      }
      return row;
    }));
  };

  const openNewOrderModal = () => {
    setSelectedSupplier(suppliers.length > 0 ? suppliers[0].supplier_id : '');
    setPaidAmount('');
    setItems([
      { 
        product_id: products.length > 0 ? products[0].product_id : '', 
        quantity: 10, 
        unit_cost: products.length > 0 ? products[0].purchase_price : '' 
      }
    ]);
    setOrderError('');
    setIsOrderModalOpen(true);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const c = parseFloat(item.unit_cost) || 0;
      return sum + (q * c);
    }, 0);
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    setOrderError('');

    // Validation
    if (!selectedSupplier) {
      setOrderError('Please choose a supplier');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].product_id) {
        setOrderError(`Row #${i + 1} has no product selected.`);
        return;
      }
      if (!items[i].quantity || items[i].quantity <= 0) {
        setOrderError(`Row #${i + 1} quantity must be greater than 0.`);
        return;
      }
      if (items[i].unit_cost === '' || items[i].unit_cost < 0) {
        setOrderError(`Row #${i + 1} unit cost cannot be empty or negative.`);
        return;
      }
    }

    setSubmittingOrder(true);
    try {
      const total = calculateTotal();
      const numPaid = paidAmount === '' ? total : parseFloat(paidAmount) || 0;

      const payload = {
        supplier_id: parseInt(selectedSupplier, 10),
        paid_amount: numPaid,
        items: items.map(it => ({
          product_id: parseInt(it.product_id, 10),
          quantity: parseInt(it.quantity, 10),
          unit_cost: parseFloat(it.unit_cost)
        }))
      };

      const res = await purchasesApi.create(payload);
      if (res.success) {
        setIsOrderModalOpen(false);
        loadData();
      }
    } catch (err) {
      setOrderError(err.message || 'Failed to submit procurement order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const openDetails = async (id) => {
    try {
      const res = await purchasesApi.getById(id);
      if (res.success) {
        setSelectedPurchase(res.data);
        setIsDetailsOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to load purchase details');
    }
  };

  const formatCurrency = (val) => `Rs ${Number(val || 0).toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', height: '40px' }}
            placeholder="Search purchases by order ID or supplier name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        </div>

        <button onClick={openNewOrderModal} className="btn btn-primary" style={{ gap: '6px' }}>
          <Plus size={16} />
          <span>New Stock Procurement</span>
        </button>
      </div>

      {/* Procurement Orders Table */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Total Items</th>
              <th>Total Units Added</th>
              <th>Grand Total</th>
              <th>Amount Paid</th>
              <th>Balance Due</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No stock procurement orders recorded yet.
                </td>
              </tr>
            ) : (
              purchases.map(p => {
                const bal = Number(p.balance_due || 0);
                return (
                  <tr key={p.purchase_id}>
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      PO-{String(p.purchase_id).padStart(4, '0')}
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.supplier_name}</td>
                    <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                    <td className="font-mono">{p.total_items} item{p.total_items === 1 ? '' : 's'}</td>
                    <td className="font-mono">{p.total_quantity} units</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#818cf8' }}>
                      {formatCurrency(p.total_amount)}
                    </td>
                    <td className="font-mono" style={{ color: '#34d399' }}>
                      {formatCurrency(p.paid_amount)}
                    </td>
                    <td className="font-mono" style={{ color: bal > 0 ? '#fb7185' : '#34d399', fontWeight: 600 }}>
                      {formatCurrency(bal)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openDetails(p.purchase_id)}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '6px' }}
                      >
                        <Eye size={14} />
                        <span>View Items</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Procurement Order Intake Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Stock Procurement Intake (Increments MySQL Inventory)"
        maxWidth="760px"
      >
        {orderError && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            {orderError}
          </div>
        )}

        <form onSubmit={handleCreatePurchase}>
          <div className="form-group">
            <label className="form-label">Vendor / Supplier *</label>
            <select
              className="form-select"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              required
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map(s => (
                <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Intake Items</h4>
            <button
              type="button"
              onClick={addRow}
              className="btn btn-secondary btn-sm"
              style={{ gap: '4px', fontSize: '11px' }}
            >
              <Plus size={13} />
              <span>Add Row</span>
            </button>
          </div>

          {/* Multi-Row Intake Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
            {items.map((row, idx) => {
              const lineTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_cost) || 0);

              return (
                <div 
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(180px, 2fr) 90px 110px 110px 36px',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '8px 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px'
                  }}
                >
                  <select
                    className="form-select"
                    value={row.product_id}
                    onChange={(e) => updateRow(idx, 'product_id', e.target.value)}
                    required
                    style={{ fontSize: '13px' }}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map(p => (
                      <option key={p.product_id} value={p.product_id}>{p.name} (Current: {p.stock_quantity})</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="form-input font-mono"
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                    required
                    style={{ fontSize: '13px', textAlign: 'center' }}
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Unit Cost"
                    className="form-input font-mono"
                    value={row.unit_cost}
                    onChange={(e) => updateRow(idx, 'unit_cost', e.target.value)}
                    required
                    style={{ fontSize: '13px', textAlign: 'right' }}
                  />

                  <div className="font-mono" style={{ textAlign: 'right', fontWeight: 700, fontSize: '13px' }}>
                    Rs {lineTotal.toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={items.length <= 1}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: items.length > 1 ? '#fb7185' : 'var(--text-muted)',
                      cursor: items.length > 1 ? 'pointer' : 'not-allowed',
                      padding: '4px'
                    }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Totals & Paid Amount */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Calculated Total Cost:</span>
              <h3 className="font-mono" style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#818cf8' }}>
                Rs {calculateTotal().toFixed(2)}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ margin: '0 0 4px', fontSize: '11px' }}>Paid to Supplier (Rs):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input font-mono"
                  placeholder={calculateTotal().toFixed(2)}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  style={{ width: '130px', height: '36px', textAlign: 'right' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingOrder}
                className="btn btn-primary"
                style={{ height: '36px', marginTop: '16px' }}
              >
                {submittingOrder ? 'Intaking Stock...' : 'Submit & Restock'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Purchase Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={`Purchase Order PO-${String(selectedPurchase?.purchase_id || '').padStart(4, '0')}`}
        maxWidth="640px"
      >
        {selectedPurchase && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
              <div>
                <p style={{ margin: 0 }}>Supplier: <strong style={{ color: '#fff' }}>{selectedPurchase.supplier_name}</strong></p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Phone: {selectedPurchase.supplier_phone || 'N/A'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0 }}>Date: {new Date(selectedPurchase.purchase_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="table-container" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Quantity Added</th>
                    <th style={{ textAlign: 'right' }}>Unit Cost</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchase.items && selectedPurchase.items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{it.product_name}</td>
                      <td><Badge variant="neutral">{it.category_name || 'General'}</Badge></td>
                      <td className="font-mono" style={{ textAlign: 'center', fontWeight: 800, color: '#34d399' }}>
                        +{it.quantity}
                      </td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>{formatCurrency(it.unit_cost)}</td>
                      <td className="font-mono" style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(it.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Paid: </span>
                <span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>{formatCurrency(selectedPurchase.paid_amount)}</span>
                {Number(selectedPurchase.balance_due) > 0 && (
                  <span style={{ fontSize: '12px', color: '#fb7185', marginLeft: '12px' }}>
                    (Payable Due: {formatCurrency(selectedPurchase.balance_due)})
                  </span>
                )}
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Order: </span>
                <strong className="font-mono" style={{ fontSize: '16px', color: '#818cf8' }}>{formatCurrency(selectedPurchase.total_amount)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setIsDetailsOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
