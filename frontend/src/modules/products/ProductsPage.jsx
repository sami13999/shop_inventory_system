import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  FolderPlus,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { productsApi, categoriesApi } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Add/Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    purchase_price: '',
    selling_price: '',
    stock_quantity: ''
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState('');

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, lowRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        productsApi.getLowStock()
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (lowRes.success) setLowStockCount(lowRes.count || 0);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].category_id : '',
      purchase_price: '',
      selling_price: '',
      stock_quantity: '0'
    });
    setProductError('');
    setIsProductModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity
    });
    setProductError('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    setProductError('');

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.product_id, formData);
      } else {
        await productsApi.create(formData);
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err) {
      setProductError(err.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      await categoriesApi.create({ category_name: newCategoryName });
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSavingCategory(false);
    }
  };

  const confirmDelete = (product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await productsApi.delete(deletingProduct.product_id);
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = searchTerm 
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    const matchesCategory = selectedCategory ? p.category_id === parseInt(selectedCategory, 10) : true;
    const matchesLowStock = onlyLowStock ? p.stock_quantity <= 10 : true;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const formatCurrency = (val) => `Rs ${Number(val || 0).toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div style={{
          padding: '14px 20px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(244, 63, 94, 0.12) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fef3c7' }}>
                Inventory Alert: {lowStockCount} product{lowStockCount > 1 ? 's' : ''} low on stock
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#fde68a' }}>
                Items have dropped to or below the safety threshold of 10 units.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOnlyLowStock(prev => !prev)}
            className="btn btn-sm"
            style={{
              backgroundColor: onlyLowStock ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
              color: onlyLowStock ? '#000' : '#fff',
              fontWeight: 700
            }}
          >
            {onlyLowStock ? 'Show All Products' : 'Filter Low Stock Only'}
          </button>
        </div>
      )}

      {/* Control Header & Filters */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '40px' }}
              placeholder="Search product by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '180px', height: '40px' }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn btn-secondary"
            style={{ gap: '6px' }}
          >
            <FolderPlus size={16} />
            <span>New Category</span>
          </button>
          <button
            onClick={openAddModal}
            className="btn btn-primary"
            style={{ gap: '6px' }}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Purchase Price</th>
              <th>Selling Price</th>
              <th>Profit Margin</th>
              <th>Stock Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No products found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => {
                const isOutOfStock = product.stock_quantity <= 0;
                const isLow = product.stock_quantity > 0 && product.stock_quantity <= 10;
                const profit = Number(product.selling_price) - Number(product.purchase_price);

                return (
                  <tr key={product.product_id}>
                    <td className="font-mono" style={{ color: 'var(--text-muted)' }}>
                      #{product.product_id}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '14px' }}>
                      {product.name}
                    </td>
                    <td>
                      <Badge variant="neutral">{product.category_name || 'Unassigned'}</Badge>
                    </td>
                    <td className="font-mono">
                      {formatCurrency(product.purchase_price)}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#818cf8' }}>
                      {formatCurrency(product.selling_price)}
                    </td>
                    <td className="font-mono">
                      <span style={{ color: profit >= 0 ? '#34d399' : '#fb7185', fontWeight: 600 }}>
                        {formatCurrency(profit)}
                      </span>
                    </td>
                    <td>
                      {isOutOfStock ? (
                        <Badge variant="danger">0 - Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">{product.stock_quantity} - Low Stock</Badge>
                      ) : (
                        <Badge variant="success">{product.stock_quantity} Units</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(product)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Product"
                          style={{ padding: '6px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => confirmDelete(product)}
                          className="btn btn-danger btn-sm"
                          title="Delete Product"
                          style={{ padding: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
      >
        {productError && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            {productError}
          </div>
        )}

        <form onSubmit={handleSaveProduct}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Mineral Water 1.5L"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Purchase Price (Rs) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input font-mono"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (Rs) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input font-mono"
                placeholder="0.00"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Stock Quantity *</label>
            <input
              type="number"
              min="0"
              className="form-input font-mono"
              placeholder="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProduct}
              className="btn btn-primary"
            >
              {savingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Product Category"
      >
        <form onSubmit={handleSaveCategory}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dairy, Cosmetics, Bakery"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCategory}
              className="btn btn-primary"
            >
              {savingCategory ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Product"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Are you sure you want to delete <strong style={{ color: '#fff' }}>"{deletingProduct?.name}"</strong>?
          This action cannot be undone if no sales are attached.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(false)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-danger"
          >
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
