import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  Phone, 
  MapPin, 
  History,
  TrendingUp
} from 'lucide-react';
import { suppliersApi } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ supplier_name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Purchases History Modal
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await suppliersApi.getAll(search);
      if (res.success) setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ supplier_name: '', phone: '', address: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingSupplier(s);
    setFormData({ supplier_name: s.supplier_name, phone: s.phone || '', address: s.address || '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.supplier_id, formData);
      } else {
        await suppliersApi.create(formData);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await suppliersApi.delete(id);
      loadSuppliers();
    } catch (err) {
      alert(err.message || 'Failed to delete supplier');
    }
  };

  const viewPurchases = async (supplier) => {
    setSelectedSupplier(supplier);
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await suppliersApi.getPurchases(supplier.supplier_id);
      if (res.success) setPurchases(res.data);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatCurrency = (val) => `Rs ${Number(val || 0).toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Header */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', height: '40px' }}
            placeholder="Search suppliers by name, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        </div>

        <button onClick={openAddModal} className="btn btn-primary" style={{ gap: '6px' }}>
          <Plus size={16} />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Suppliers Table */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier Name</th>
              <th>Contact Phone</th>
              <th>Office / Warehouse Address</th>
              <th>Orders Count</th>
              <th>Total Procured</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No suppliers found. Click "Add Supplier" to create one.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.supplier_id}>
                  <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                    #{s.supplier_id}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '14px' }}>
                    {s.supplier_name}
                  </td>
                  <td>{s.phone || 'N/A'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.address || 'N/A'}</td>
                  <td className="font-mono">
                    <Badge variant="primary">{s.total_purchases} Orders</Badge>
                  </td>
                  <td className="font-mono" style={{ fontWeight: 700, color: '#818cf8' }}>
                    {formatCurrency(s.total_procured_amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => viewPurchases(s)}
                        className="btn btn-secondary btn-sm"
                        title="View Purchase Orders"
                        style={{ padding: '6px' }}
                      >
                        <History size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(s)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Supplier"
                        style={{ padding: '6px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.supplier_id)}
                        className="btn btn-danger btn-sm"
                        title="Delete Supplier"
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

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.supplier_name}` : 'Add New Supplier'}
      >
        {error && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Supplier Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Metro Cash & Carry"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 03219876543"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Office / Warehouse Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Industrial Area Phase 2, Lahore"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Purchases History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Procurement History: ${selectedSupplier?.supplier_name}`}
        maxWidth="680px"
      >
        <div className="table-container" style={{ maxHeight: '360px', overflowY: 'auto' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Items Count</th>
                <th>Total Cost</th>
                <th>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No procurement orders found for this supplier yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.purchase_id}>
                    <td className="font-mono" style={{ fontWeight: 700 }}>PO-{String(p.purchase_id).padStart(4, '0')}</td>
                    <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                    <td className="font-mono">{p.item_count} item{p.item_count === 1 ? '' : 's'}</td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>{formatCurrency(p.total_amount)}</td>
                    <td className="font-mono" style={{ color: '#34d399' }}>{formatCurrency(p.paid_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={() => setIsHistoryOpen(false)} className="btn btn-secondary">
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
