import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  ShoppingBag,
  CreditCard,
  User,
  ArrowRight,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { productsApi, categoriesApi, customersApi, billsApi } from '../../api/client';
import ReceiptModal from './components/ReceiptModal';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

export default function PosPage() {
  // Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [customerSaving, setCustomerSaving] = useState(false);

  // Checkout State
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [completedBill, setCompletedBill] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Load Data
  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        customersApi.getAll()
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (custRes.success) setCustomers(custRes.data);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = searchTerm 
      ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(p.product_id) === searchTerm
      : true;
    return matchesCat && matchesSearch;
  });

  // Cart Actions
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Cannot add more than ${product.stock_quantity} available units of ${product.name}`);
          return prev;
        }
        return prev.map(item => 
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1, line_total: (item.quantity + 1) * item.unit_price }
            : item
        );
      } else {
        return [...prev, {
          product_id: product.product_id,
          name: product.name,
          category_name: product.category_name,
          unit_price: Number(product.selling_price),
          stock_quantity: product.stock_quantity,
          quantity: 1,
          line_total: Number(product.selling_price)
        }];
      }
    });
  };

  const updateQuantity = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        if (qty > item.stock_quantity) {
          alert(`Max stock available is ${item.stock_quantity}`);
          return { ...item, quantity: item.stock_quantity, line_total: item.stock_quantity * item.unit_price };
        }
        return { ...item, quantity: qty, line_total: qty * item.unit_price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount('');
    setCheckoutError('');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.line_total, 0);
  const numDiscount = Math.max(0, parseFloat(discount) || 0);
  const totalAmount = Math.max(0, subtotal - numDiscount);
  const numPaid = paidAmount === '' ? totalAmount : Math.max(0, parseFloat(paidAmount) || 0);
  const balanceDue = Math.max(0, totalAmount - numPaid);
  const changeDue = Math.max(0, numPaid - totalAmount);

  let paymentStatus = 'unpaid';
  if (numPaid >= totalAmount && totalAmount > 0) {
    paymentStatus = 'paid';
  } else if (numPaid > 0) {
    paymentStatus = 'partial';
  }

  // Quick Cash Helper
  const setExactCash = () => setPaidAmount(totalAmount.toString());

  // Quick Customer Creation
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    setCustomerSaving(true);
    try {
      const res = await customersApi.create({
        name: newCustomerName,
        phone: newCustomerPhone,
        address: newCustomerAddress
      });
      if (res.success && res.data) {
        setCustomers(prev => [...prev, res.data]);
        setSelectedCustomer(res.data.customer_id);
        setIsWalkIn(false);
        setIsCustomerModalOpen(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
      }
    } catch (err) {
      alert(err.message || 'Failed to create customer');
    } finally {
      setCustomerSaving(false);
    }
  };

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError('Cart is empty. Add products to proceed.');
      return;
    }

    if (!isWalkIn && !selectedCustomer) {
      setCheckoutError('Please select a customer or switch to Walk-in.');
      return;
    }

    setCheckingOut(true);
    setCheckoutError('');

    try {
      const payload = {
        customer_id: isWalkIn ? null : selectedCustomer,
        discount: numDiscount,
        paid_amount: numPaid,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const res = await billsApi.create(payload);
      if (res.success && res.data) {
        // Trigger celebration confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch {}

        setCompletedBill(res.data);
        setIsReceiptOpen(true);
        // Refresh catalog inventory numbers
        loadCatalog();
      }
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleNewOrder = () => {
    clearCart();
    setIsReceiptOpen(false);
    setCompletedBill(null);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.6fr) minmax(360px, 1fr)',
      gap: '24px',
      alignItems: 'start'
    }}>
      {/* Left Column: Catalog & Products */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Search & Category Pills Bar */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '42px', fontSize: '14px' }}
              placeholder="Search product by name, barcode, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className="btn btn-sm"
              style={{
                borderRadius: '999px',
                padding: '6px 14px',
                backgroundColor: selectedCategory === null ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === null ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap'
              }}
            >
              All Categories ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategory(cat.category_id)}
                className="btn btn-sm"
                style={{
                  borderRadius: '999px',
                  padding: '6px 14px',
                  backgroundColor: selectedCategory === cat.category_id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: selectedCategory === cat.category_id ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
          maxHeight: 'calc(100vh - 250px)',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock_quantity <= 0;
            const isLow = product.stock_quantity > 0 && product.stock_quantity <= 10;
            const inCart = cart.find(i => i.product_id === product.product_id);

            return (
              <div
                key={product.product_id}
                className="glass-panel"
                onClick={() => !isOutOfStock && addToCart(product)}
                style={{
                  padding: '16px',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  position: 'relative',
                  border: inCart ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  boxShadow: inCart ? '0 0 16px var(--primary-glow)' : 'var(--shadow-sm)',
                  transform: 'translateZ(0)'
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    {product.category_name || 'General'}
                  </span>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0 6px', color: '#fff', lineHeight: 1.3 }}>
                    {product.name}
                  </h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#818cf8' }} className="font-mono">
                      Rs {Number(product.selling_price).toFixed(2)}
                    </span>
                  </div>

                  {isOutOfStock ? (
                    <span className="badge badge-danger">Out</span>
                  ) : isLow ? (
                    <span className="badge badge-warning">{product.stock_quantity} left</span>
                  ) : (
                    <span className="badge badge-success">{product.stock_quantity} in stock</span>
                  )}
                </div>

                {inCart && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800
                  }}>
                    {inCart.quantity}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Interactive Cart & Checkout Panel */}
      <div className="glass-panel" style={{ padding: '22px', position: 'sticky', top: '88px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Cart Header & Customer Selector */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} color="var(--primary)" />
              <span>Current Cart</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                ({cart.length} items)
              </span>
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                Clear
              </button>
            )}
          </div>

          {/* Customer Selection Option */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              onClick={() => { setIsWalkIn(true); setSelectedCustomer(null); }}
              className="btn btn-sm"
              style={{
                flex: 1,
                backgroundColor: isWalkIn ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: isWalkIn ? 'var(--primary)' : 'var(--border-subtle)',
                color: isWalkIn ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Walk-in Customer
            </button>
            <button
              onClick={() => setIsWalkIn(false)}
              className="btn btn-sm"
              style={{
                flex: 1,
                backgroundColor: !isWalkIn ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: !isWalkIn ? 'var(--primary)' : 'var(--border-subtle)',
                color: !isWalkIn ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Account / Khata
            </button>
          </div>

          {!isWalkIn && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="form-select"
                value={selectedCustomer || ''}
                onChange={(e) => setSelectedCustomer(e.target.value ? parseInt(e.target.value, 10) : null)}
                style={{ flex: 1, height: '38px', fontSize: '13px' }}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="btn btn-secondary btn-sm"
                title="Add New Customer"
                style={{ height: '38px', padding: '0 10px' }}
              >
                <UserPlus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div style={{ minHeight: '160px', maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Cart is empty. Select products from the left to start billing.</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.product_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }} className="font-mono">
                    Rs {item.unit_price.toFixed(2)} each
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '26px', height: '26px', padding: 0 }}
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.stock_quantity}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                    className="font-mono"
                    style={{
                      width: '40px',
                      height: '26px',
                      textAlign: 'center',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '26px', height: '26px', padding: 0 }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div style={{ width: '80px', textAlign: 'right', paddingLeft: '8px' }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: '13px' }}>
                    Rs {item.line_total.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.product_id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    marginLeft: '4px'
                  }}
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Payment Breakdown & Discount */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
            <span className="font-mono" style={{ fontWeight: 600 }}>Rs {subtotal.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Discount (Rs):</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="font-mono"
              placeholder="0.00"
              style={{
                width: '100px',
                height: '30px',
                padding: '4px 8px',
                textAlign: 'right',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '16px',
            fontWeight: 800
          }}>
            <span>Total Payable:</span>
            <span className="font-mono" style={{ color: '#818cf8', fontSize: '18px' }}>
              Rs {totalAmount.toFixed(2)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'block' }}>Paid Amount:</span>
              <button 
                type="button" 
                onClick={setExactCash}
                style={{ fontSize: '10px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Exact Cash
              </button>
            </div>
            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={totalAmount.toFixed(2)}
              className="font-mono"
              style={{
                width: '130px',
                height: '34px',
                padding: '4px 10px',
                textAlign: 'right',
                background: 'var(--bg-input)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '6px',
                color: '#34d399',
                fontWeight: 700,
                fontSize: '15px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '2px' }}>
            <span>Status / Khata Balance:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant={paymentStatus}>
                {paymentStatus}
              </Badge>
              {balanceDue > 0 ? (
                <span className="font-mono" style={{ color: '#fb7185', fontWeight: 700 }}>
                  Due: Rs {balanceDue.toFixed(2)}
                </span>
              ) : changeDue > 0 ? (
                <span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>
                  Change: Rs {changeDue.toFixed(2)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {checkoutError && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '12px'
          }}>
            {checkoutError}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={checkingOut || cart.length === 0}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: '4px', gap: '8px' }}
        >
          <CreditCard size={18} />
          <span>{checkingOut ? 'Processing ACID Transaction...' : 'Complete & Generate Receipt'}</span>
        </button>
      </div>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleCreateCustomer}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tariq Mehmood"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 03001234567"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address / Shop Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Sector G-9, Islamabad"
              value={newCustomerAddress}
              onChange={(e) => setNewCustomerAddress(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={customerSaving}
              className="btn btn-primary"
            >
              {customerSaving ? 'Saving...' : 'Save & Select Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={completedBill}
        onNewOrder={handleNewOrder}
      />
    </div>
  );
}
