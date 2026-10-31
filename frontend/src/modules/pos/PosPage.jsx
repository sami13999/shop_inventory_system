import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Layers,
  Sparkles,
  Zap,
  Barcode,
  LayoutGrid,
  Grid3X3,
  List,
  Volume2,
  VolumeX,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Percent,
  Banknote,
  Receipt,
  Check,
  X,
  Phone,
  HelpCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { productsApi, categoriesApi, customersApi, billsApi } from '../../api/client';
import ReceiptModal from './components/ReceiptModal';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

// Category icon & emoji mapping for rapid visual recognition
const CATEGORY_MAP = {
  'beverages': { icon: '🥤', label: 'Beverages' },
  'snacks': { icon: '🍿', label: 'Snacks' },
  'dairy': { icon: '🥛', label: 'Dairy & Eggs' },
  'groceries': { icon: '🌾', label: 'Groceries & Flour' },
  'bakery': { icon: '🍞', label: 'Bakery & Sweets' },
  'tea': { icon: '☕', label: 'Tea & Coffee' },
  'frozen': { icon: '🧊', label: 'Frozen & Canned' },
  'baby': { icon: '🍼', label: 'Baby Care' },
  'personal': { icon: '🧼', label: 'Bath & Hygiene' },
  'household': { icon: '🧽', label: 'Cleaning & Wash' },
  'cosmetics': { icon: '💄', label: 'Cosmetics' },
  'stationery': { icon: '🔋', label: 'Office & Batteries' },
  'pet': { icon: '🐾', label: 'Pet Care' },
  'spices': { icon: '🧂', label: 'Spices & Sauces' }
};

const getCategoryMeta = (catName) => {
  if (!catName) return { icon: '📦', label: 'General' };
  const lower = catName.toLowerCase();
  for (const [key, meta] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return meta;
  }
  return { icon: '📦', label: catName };
};

// Web Audio API Sound Synthesizer for instant POS audio feedback
const playPosSound = (type = 'add') => {
  try {
    const isMuted = localStorage.getItem('aurapos_sound_muted') === 'true';
    if (isMuted) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'add') {
      // Crisp barcode scanner blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'remove') {
      // Low blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'checkout') {
      // Pleasant retail cash register chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        const start = ctx.currentTime + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    }
  } catch (err) {
    // Ignore audio permission or context restrictions
  }
};

export default function PosPage() {
  // Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search Controls
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('aurapos_pos_view') || 'grid');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 48;

  // Sound & Notifications
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('aurapos_sound_muted') !== 'true');
  const [scanToast, setScanToast] = useState({ show: false, message: '' });
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aurapos_active_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Customer & Payment State
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'card' | 'khata' | 'online'
  const [paidAmount, setPaidAmount] = useState('');

  // Parked / Held Carts
  const [parkedOrders, setParkedOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('aurapos_parked_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isParkedModalOpen, setIsParkedModalOpen] = useState(false);

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

  // Refs
  const searchInputRef = useRef(null);
  const categoryScrollRef = useRef(null);

  // Persist cart
  useEffect(() => {
    try {
      sessionStorage.setItem('aurapos_active_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Persist parked orders
  useEffect(() => {
    try {
      localStorage.setItem('aurapos_parked_orders', JSON.stringify(parkedOrders));
    } catch {}
  }, [parkedOrders]);

  // Load Data
  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        customersApi.getAll()
      ]);
      if (prodRes.success) setProducts(prodRes.data || []);
      if (catRes.success) setCategories(catRes.data || []);
      if (custRes.success) setCustomers(custRes.data || []);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, onlyInStock, sortBy]);

  // Sound toggle handler
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('aurapos_sound_muted', String(!next));
  };

  // View mode handler
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('aurapos_pos_view', mode);
  };

  // Scroll categories
  const handleScrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth'
      });
    }
  };

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesCat = selectedCategory ? p.category_id === selectedCategory : true;
      const matchesSearch = searchTerm 
        ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (p.category_name && p.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          String(p.product_id) === searchTerm.trim()
        : true;
      const matchesStock = onlyInStock ? p.stock_quantity > 0 : true;
      return matchesCat && matchesSearch && matchesStock;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') return Number(a.selling_price) - Number(b.selling_price);
      if (sortBy === 'price-desc') return Number(b.selling_price) - Number(a.selling_price);
      if (sortBy === 'stock-desc') return b.stock_quantity - a.stock_quantity;
      if (sortBy === 'id-asc') return a.product_id - b.product_id;
      return 0;
    });

    return result;
  }, [products, selectedCategory, searchTerm, onlyInStock, sortBy]);

  // Visible sliced products
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, page * PAGE_SIZE);
  }, [filteredProducts, page]);

  // Cart Actions
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Maximum available stock is ${product.stock_quantity} units of "${product.name}"`);
          return prev;
        }
        playPosSound('add');
        return prev.map(item => 
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1, line_total: (item.quantity + 1) * item.unit_price }
            : item
        );
      } else {
        playPosSound('add');
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

    // Trigger visual toast
    setScanToast({ show: true, message: `Added ${product.name} to order` });
    setTimeout(() => setScanToast({ show: false, message: '' }), 1800);
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
        playPosSound('add');
        return { ...item, quantity: qty, line_total: qty * item.unit_price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    playPosSound('remove');
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setPaidAmount('');
    setCheckoutError('');
  };

  // Barcode scanner keydown in search bar
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const term = searchTerm.trim().toLowerCase();
      if (!term) return;

      // Check exact ID match or exact name match
      let match = products.find(p => String(p.product_id) === term);
      if (!match) {
        match = products.find(p => p.name.toLowerCase() === term);
      }
      if (!match && filteredProducts.length === 1) {
        match = filteredProducts[0];
      }

      if (match) {
        addToCart(match);
        setSearchTerm('');
      } else if (filteredProducts.length > 0) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
      }
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Ignore if inside text inputs other than global shortcuts
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // F2 or '/' to focus search
      if ((e.key === 'F2') || (e.key === '/' && !isInput)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      // F4 or Ctrl+Enter to checkout
      if (e.key === 'F4' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cart.length > 0 && !checkingOut) {
          handleCheckout();
        }
      }

      // Alt+C to clear cart
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (cart.length > 0 && confirm('Clear active cart?')) {
          clearCart();
        }
      }

      // Alt+H to hold/park sale
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        if (cart.length > 0) {
          handleParkOrder();
        }
      }

      // Alt+W: Walk-in
      if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        setIsWalkIn(true);
        setSelectedCustomer(null);
      }

      // Alt+K: Khata
      if (e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsWalkIn(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [cart, checkingOut]);

  // Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.line_total, 0), [cart]);
  const totalUnits = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  // Calculated discount
  const calculatedDiscount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === 'percent') {
      return Math.min(subtotal, (subtotal * val) / 100);
    }
    return Math.min(subtotal, val);
  }, [subtotal, discountType, discountValue]);

  const totalAmount = Math.max(0, subtotal - calculatedDiscount);

  // Settlement calculations
  const effectivePaid = paidAmount === '' ? (paymentMethod === 'khata' ? 0 : totalAmount) : Math.max(0, parseFloat(paidAmount) || 0);
  const balanceDue = Math.max(0, totalAmount - effectivePaid);
  const changeDue = Math.max(0, effectivePaid - totalAmount);

  let paymentStatus = 'unpaid';
  if (effectivePaid >= totalAmount && totalAmount > 0) {
    paymentStatus = 'paid';
  } else if (effectivePaid > 0) {
    paymentStatus = 'partial';
  }

  // Quick Cash Presets
  const setExactCash = () => {
    setPaidAmount(totalAmount.toString());
    setPaymentMethod('cash');
  };

  const setFixedCashNote = (amount) => {
    setPaidAmount(amount.toString());
    setPaymentMethod('cash');
  };

  const addCashAmount = (extra) => {
    const current = parseFloat(paidAmount) || totalAmount;
    setPaidAmount((current + extra).toString());
    setPaymentMethod('cash');
  };

  // Hold / Park Order
  const handleParkOrder = () => {
    if (cart.length === 0) return;

    const newParked = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cart: [...cart],
      isWalkIn,
      selectedCustomer,
      customerName: isWalkIn 
        ? 'Walk-in' 
        : (customers.find(c => c.customer_id === selectedCustomer)?.name || 'Khata Customer'),
      discountType,
      discountValue,
      totalAmount
    };

    setParkedOrders(prev => [newParked, ...prev]);
    clearCart();
    playPosSound('remove');
    setScanToast({ show: true, message: 'Sale parked successfully!' });
    setTimeout(() => setScanToast({ show: false, message: '' }), 2000);
  };

  // Resume Parked Order
  const handleResumeParked = (order) => {
    setCart(order.cart);
    setIsWalkIn(order.isWalkIn);
    setSelectedCustomer(order.selectedCustomer);
    setDiscountType(order.discountType);
    setDiscountValue(order.discountValue);
    setPaidAmount('');
    setParkedOrders(prev => prev.filter(o => o.id !== order.id));
    setIsParkedModalOpen(false);
    playPosSound('add');
    setScanToast({ show: true, message: 'Parked sale restored!' });
    setTimeout(() => setScanToast({ show: false, message: '' }), 2000);
  };

  // Discard Parked Order
  const handleDiscardParked = (orderId) => {
    setParkedOrders(prev => prev.filter(o => o.id !== orderId));
  };

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
        playPosSound('add');
      }
    } catch (err) {
      alert(err.message || 'Failed to create customer');
    } finally {
      setCustomerSaving(false);
    }
  };

  // Active Selected Customer Info
  const activeCustomerInfo = useMemo(() => {
    if (isWalkIn || !selectedCustomer) return null;
    return customers.find(c => c.customer_id === selectedCustomer);
  }, [isWalkIn, selectedCustomer, customers]);

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError('Cart is empty. Add products to proceed.');
      return;
    }

    if (!isWalkIn && !selectedCustomer) {
      setCheckoutError('Please select a customer for Khata credit billing.');
      return;
    }

    setCheckingOut(true);
    setCheckoutError('');

    try {
      const payload = {
        customer_id: isWalkIn ? null : selectedCustomer,
        discount: calculatedDiscount,
        paid_amount: effectivePaid,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const res = await billsApi.create(payload);
      if (res.success && res.data) {
        playPosSound('checkout');
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {}

        setCompletedBill(res.data);
        setIsReceiptOpen(true);
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
    searchInputRef.current?.focus();
  };

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.68fr) minmax(390px, 1fr)',
        gap: '20px',
        alignItems: 'start'
      }}
      className="animate-fade-in"
    >
      {/* =========================================================================
          Left Column: Interactive Product Catalog Workspace
          ========================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Top Search & Filter Bar */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Barcode & Search Input */}
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={searchInputRef}
                type="text"
                className="form-input"
                style={{ 
                  paddingLeft: '44px', 
                  paddingRight: searchTerm ? '38px' : '90px',
                  height: '46px', 
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)'
                }}
                placeholder="Scan barcode, enter SKU ID, or type product name... (Press Enter to add)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <Barcode 
                size={22} 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '12px', 
                  color: 'var(--primary)' 
                }} 
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '13px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              ) : (
                <span 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '13px', 
                    fontSize: '11px', 
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    fontWeight: 700
                  }}
                  className="font-mono"
                >
                  F2 or /
                </span>
              )}
            </div>

            {/* View Mode Switcher */}
            <div style={{ 
              display: 'flex', 
              background: 'var(--bg-subtle)', 
              borderRadius: 'var(--radius-md)', 
              padding: '3px',
              border: '1px solid var(--border-subtle)' 
            }}>
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className="btn btn-sm"
                title="Cards Grid View"
                style={{
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('dense')}
                className="btn btn-sm"
                title="Dense Touch Tiles View"
                style={{
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: viewMode === 'dense' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'dense' ? '#fff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className="btn btn-sm"
                title="Fast List / Table View"
                style={{
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                <List size={16} />
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="btn btn-secondary btn-sm"
              title={soundEnabled ? 'Mute Audio Scanner Beep' : 'Unmute Audio Scanner Beep'}
              style={{ height: '44px', width: '44px', padding: 0 }}
            >
              {soundEnabled ? <Volume2 size={18} color="var(--primary)" /> : <VolumeX size={18} color="var(--text-muted)" />}
            </button>

            {/* Parked Orders Button */}
            {parkedOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsParkedModalOpen(true)}
                className="btn btn-warning btn-sm"
                style={{ height: '44px', padding: '0 12px', fontWeight: 800, gap: '6px' }}
                title="View Parked / Held Bills"
              >
                <PauseCircle size={16} />
                <span>Held ({parkedOrders.length})</span>
              </button>
            )}

            {/* Shortcuts Guide Button */}
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="btn btn-secondary btn-sm"
              title="Keyboard Shortcuts"
              style={{ height: '44px', width: '44px', padding: 0 }}
            >
              <HelpCircle size={17} color="var(--text-muted)" />
            </button>
          </div>

          {/* Quick Filter Row: In Stock Toggle, Sort, and Item Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span>In Stock Only</span>
              </label>

              <span style={{ color: 'var(--border-subtle)' }}>|</span>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-select"
                  style={{ height: '28px', padding: '2px 8px', fontSize: '11px', width: 'auto' }}
                >
                  <option value="name-asc">Name (A to Z)</option>
                  <option value="price-asc">Price (Lowest first)</option>
                  <option value="price-desc">Price (Highest first)</option>
                  <option value="stock-desc">Stock (Highest first)</option>
                  <option value="id-asc">SKU ID</option>
                </select>
              </div>
            </div>

            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{visibleProducts.length}</strong> of {filteredProducts.length} items
            </div>
          </div>

          {/* Category Scroller Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px', borderRadius: 'var(--radius-full)', flexShrink: 0 }}
              title="Scroll Categories Left"
            >
              <ChevronLeft size={16} />
            </button>

            <div ref={categoryScrollRef} className="pos-categories-scroll" style={{ flex: 1 }}>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`pos-cat-pill ${selectedCategory === null ? 'active' : ''}`}
              >
                <span>🛒</span>
                <span>All Products</span>
                <span className="cat-count">{products.length}</span>
              </button>

              {categories.map(cat => {
                const meta = getCategoryMeta(cat.category_name);
                const count = products.filter(p => p.category_id === cat.category_id).length;
                return (
                  <button
                    key={cat.category_id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.category_id)}
                    className={`pos-cat-pill ${selectedCategory === cat.category_id ? 'active' : ''}`}
                  >
                    <span>{meta.icon}</span>
                    <span>{cat.category_name}</span>
                    <span className="cat-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleScrollCategories('right')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px', borderRadius: 'var(--radius-full)', flexShrink: 0 }}
              title="Scroll Categories Right"
            >
              <ChevronRight size={16} />
            </button>
          </div>

        </div>

        {/* Product Catalog Display (Grid / Dense / List) */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid rgba(99, 102, 241, 0.2)',
              borderTopColor: 'var(--primary)',
              animation: 'spinSlow 0.8s linear infinite',
              margin: '0 auto 12px'
            }} />
            <p style={{ margin: 0, fontWeight: 700 }}>Loading product inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <ShoppingBag size={48} style={{ opacity: 0.2, margin: '0 auto 14px' }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No products found</h3>
            <p style={{ margin: 0, fontSize: '13px' }}>
              No items match "{searchTerm}" {selectedCategory ? 'in this category' : ''}. Try another keyword or clear filters.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory(null); setOnlyInStock(false); }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '16px' }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div>
            {/* Visual Card Grid View */}
            {viewMode === 'grid' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '14px',
                maxHeight: 'calc(100vh - 275px)',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {visibleProducts.map(product => {
                  const isOutOfStock = product.stock_quantity <= 0;
                  const isLow = product.stock_quantity > 0 && product.stock_quantity <= 10;
                  const inCart = cart.find(i => i.product_id === product.product_id);
                  const meta = getCategoryMeta(product.category_name);

                  return (
                    <div
                      key={product.product_id}
                      className={`pos-card ${inCart ? 'in-cart' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => !isOutOfStock && !inCart && addToCart(product)}
                      style={{ cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                    >
                      {/* Top Row: Category tag + SKU badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{meta.icon}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                            {product.category_name || 'General'}
                          </span>
                        </span>
                        
                        <span 
                          className="font-mono"
                          style={{ 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            backgroundColor: 'var(--bg-subtle)', 
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            fontWeight: 700
                          }}
                        >
                          #{product.product_id}
                        </span>
                      </div>

                      {/* Product Name */}
                      <div style={{ minHeight: '38px', marginBottom: '10px' }}>
                        <h4 
                          style={{ 
                            fontSize: '13.5px', 
                            fontWeight: 800, 
                            margin: 0, 
                            color: 'var(--text-primary)', 
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                          title={product.name}
                        >
                          {product.name}
                        </h4>
                      </div>

                      {/* Pricing & Stock Status */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '1px' }}>Price</span>
                          <span className="font-mono" style={{ fontSize: '17px', fontWeight: 900, color: 'var(--primary)' }}>
                            Rs {Number(product.selling_price).toFixed(2)}
                          </span>
                        </div>

                        <div>
                          {isOutOfStock ? (
                            <span className="badge badge-danger" style={{ fontSize: '10px', padding: '3px 7px' }}>
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="badge badge-warning" style={{ fontSize: '10px', padding: '3px 7px' }}>
                              {product.stock_quantity} left
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '10px', padding: '3px 7px' }}>
                              {product.stock_quantity} in stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Direct Interactive Controls */}
                      {inCart ? (
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            backgroundColor: 'var(--bg-card-solid)',
                            borderRadius: 'var(--radius-md)',
                            padding: '4px 6px',
                            border: '1px solid var(--primary-glow)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.product_id, inCart.quantity - 1)}
                            className="pos-stepper-btn"
                            title="Decrease"
                          >
                            <Minus size={13} />
                          </button>

                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800, display: 'block' }}>In Cart</span>
                            <span className="font-mono" style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>
                              {inCart.quantity}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateQuantity(product.product_id, inCart.quantity + 1)}
                            className="pos-stepper-btn"
                            disabled={inCart.quantity >= product.stock_quantity}
                            title="Increase"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            width: '100%',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '6px 0',
                            gap: '4px'
                          }}
                        >
                          <Plus size={14} />
                          <span>{isOutOfStock ? 'Unavailable' : 'Add to Cart'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dense Touch Grid View */}
            {viewMode === 'dense' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
                gap: '10px',
                maxHeight: 'calc(100vh - 275px)',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {visibleProducts.map(product => {
                  const isOutOfStock = product.stock_quantity <= 0;
                  const inCart = cart.find(i => i.product_id === product.product_id);
                  const meta = getCategoryMeta(product.category_name);

                  return (
                    <div
                      key={product.product_id}
                      className={`pos-card ${inCart ? 'in-cart' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      style={{
                        padding: '10px',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{meta.icon}</span>
                        <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          #{product.product_id}
                        </span>
                      </div>

                      <h5 style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        margin: '6px 0 4px',
                        color: 'var(--text-primary)',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '30px'
                      }}>
                        {product.name}
                      </h5>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'auto' }}>
                        <span className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                          Rs {Number(product.selling_price).toFixed(0)}
                        </span>
                        <span style={{ fontSize: '10px', color: isOutOfStock ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {isOutOfStock ? '0' : product.stock_quantity} left
                        </span>
                      </div>

                      {inCart && (
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 800
                        }}>
                          {inCart.quantity}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* List / Table View */}
            {viewMode === 'list' && (
              <div className="glass-panel" style={{
                maxHeight: 'calc(100vh - 275px)',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 14px', width: '60px' }}>SKU</th>
                      <th style={{ padding: '10px 14px' }}>Product Name</th>
                      <th style={{ padding: '10px 14px' }}>Category</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Stock</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', width: '120px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map(product => {
                      const isOutOfStock = product.stock_quantity <= 0;
                      const inCart = cart.find(i => i.product_id === product.product_id);
                      const meta = getCategoryMeta(product.category_name);

                      return (
                        <tr 
                          key={product.product_id}
                          style={{ 
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: inCart ? 'var(--primary-subtle)' : 'transparent',
                            opacity: isOutOfStock ? 0.5 : 1
                          }}
                        >
                          <td style={{ padding: '8px 14px' }} className="font-mono">#{product.product_id}</td>
                          <td style={{ padding: '8px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {product.name}
                          </td>
                          <td style={{ padding: '8px 14px', color: 'var(--text-secondary)' }}>
                            <span style={{ marginRight: '6px' }}>{meta.icon}</span>
                            {product.category_name || 'General'}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            {isOutOfStock ? (
                              <span className="badge badge-danger">Out</span>
                            ) : (
                              <span className={`badge ${product.stock_quantity <= 10 ? 'badge-warning' : 'badge-success'}`}>
                                {product.stock_quantity}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 800 }} className="font-mono">
                            Rs {Number(product.selling_price).toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            {inCart ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product.product_id, inCart.quantity - 1)}
                                  className="pos-stepper-btn"
                                  style={{ width: '24px', height: '24px' }}
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="font-mono" style={{ fontWeight: 800, padding: '0 6px', fontSize: '12px' }}>
                                  {inCart.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product.product_id, inCart.quantity + 1)}
                                  className="pos-stepper-btn"
                                  disabled={inCart.quantity >= product.stock_quantity}
                                  style={{ width: '24px', height: '24px' }}
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => addToCart(product)}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                              >
                                <Plus size={13} /> Add
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load More Button for large inventory */}
            {filteredProducts.length > visibleProducts.length && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setPage(p => p + 1)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 24px', fontWeight: 700 }}
                >
                  Load More Products ({filteredProducts.length - visibleProducts.length} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          Right Column: Interactive Cart & Billing Station
          ========================================================================= */}
      <div 
        className="glass-panel animate-slide-up stagger-1" 
        style={{ 
          padding: '20px 22px', 
          position: 'sticky', 
          top: '74px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}
      >
        {/* Billing Station Header */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Active Order
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {cart.length} item{cart.length === 1 ? '' : 's'} • {totalUnits} unit{totalUnits === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {cart.length > 0 && (
                <>
                  <button 
                    onClick={handleParkOrder} 
                    className="btn btn-secondary btn-sm" 
                    title="Hold / Park Current Cart (Alt+H)"
                    style={{ padding: '5px 8px', fontSize: '11px', gap: '4px' }}
                  >
                    <PauseCircle size={13} color="var(--warning)" />
                    <span>Hold</span>
                  </button>
                  <button 
                    onClick={clearCart} 
                    className="btn btn-secondary btn-sm" 
                    title="Clear Active Cart (Alt+C)"
                    style={{ padding: '5px 8px', fontSize: '11px', color: 'var(--danger)' }}
                  >
                    <RotateCcw size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Customer Type Segmented Switch */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-subtle)', 
            padding: '3px', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)' 
          }}>
            <button
              type="button"
              onClick={() => { setIsWalkIn(true); setSelectedCustomer(null); }}
              className="btn btn-sm"
              style={{
                flex: 1,
                backgroundColor: isWalkIn ? 'var(--primary)' : 'transparent',
                color: isWalkIn ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                border: 'none',
                boxShadow: isWalkIn ? '0 2px 8px var(--primary-glow)' : 'none'
              }}
            >
              Walk-in Customer
            </button>
            <button
              type="button"
              onClick={() => setIsWalkIn(false)}
              className="btn btn-sm"
              style={{
                flex: 1,
                backgroundColor: !isWalkIn ? 'var(--primary)' : 'transparent',
                color: !isWalkIn ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                border: 'none',
                boxShadow: !isWalkIn ? '0 2px 8px var(--primary-glow)' : 'none'
              }}
            >
              Khata Account
            </button>
          </div>

          {/* Khata Customer Selection */}
          {!isWalkIn && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="form-select"
                  value={selectedCustomer || ''}
                  onChange={(e) => setSelectedCustomer(e.target.value ? parseInt(e.target.value, 10) : null)}
                  style={{ flex: 1, height: '38px', fontSize: '13px' }}
                >
                  <option value="">-- Choose Khata Customer --</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="btn btn-primary btn-sm"
                  title="Add New Customer"
                  style={{ height: '38px', padding: '0 12px' }}
                >
                  <UserPlus size={16} />
                </button>
              </div>

              {/* Active Khata Balance Display */}
              {activeCustomerInfo && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: Number(activeCustomerInfo.remaining_balance) > 0 ? 'var(--warning-subtle)' : 'var(--success-subtle)',
                  border: Number(activeCustomerInfo.remaining_balance) > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="var(--text-primary)" />
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{activeCustomerInfo.name}</span>
                    {activeCustomerInfo.phone && <span style={{ color: 'var(--text-muted)' }}>({activeCustomerInfo.phone})</span>}
                  </div>
                  <div>
                    {Number(activeCustomerInfo.remaining_balance) > 0 ? (
                      <span className="font-mono" style={{ color: 'var(--warning)', fontWeight: 800 }}>
                        Khata Debt: Rs {Number(activeCustomerInfo.remaining_balance).toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontWeight: 800 }}>
                        ✓ All Dues Cleared
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div style={{ 
          minHeight: '160px', 
          maxHeight: '260px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          paddingRight: '2px'
        }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 10px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={36} style={{ opacity: 0.25, margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Cart is empty</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                Click products or scan barcode with scanner gun to add items.
              </p>
            </div>
          ) : (
            cart.map(item => {
              const meta = getCategoryMeta(item.category_name);
              return (
                <div key={item.product_id} className="pos-cart-row">
                  <span style={{ fontSize: '16px' }}>{meta.icon}</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      margin: 0, 
                      fontWeight: 700, 
                      fontSize: '12.5px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      color: 'var(--text-primary)' 
                    }}>
                      {item.name}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--text-muted)' }} className="font-mono">
                      Rs {item.unit_price.toFixed(2)} each
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="pos-stepper-btn"
                      style={{ width: '24px', height: '24px' }}
                    >
                      <Minus size={11} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stock_quantity}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                      className="font-mono"
                      style={{
                        width: '38px',
                        height: '24px',
                        textAlign: 'center',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="pos-stepper-btn"
                      disabled={item.quantity >= item.stock_quantity}
                      style={{ width: '24px', height: '24px' }}
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div style={{ width: '75px', textAlign: 'right' }}>
                    <span className="font-mono" style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                      Rs {item.line_total.toFixed(2)}
                    </span>
                  </div>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Discounts, Calculation & Settlement Panel */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
            <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              Rs {subtotal.toFixed(2)}
            </span>
          </div>

          {/* Quick Discount Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>Discount:</span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setDiscountType('percent'); setDiscountValue(0); }}
                  className="btn btn-sm"
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: discountValue === 0 ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: discountValue === 0 ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  0%
                </button>
                <button
                  type="button"
                  onClick={() => { setDiscountType('percent'); setDiscountValue(5); }}
                  className="btn btn-sm"
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: discountType === 'percent' && discountValue === 5 ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: discountType === 'percent' && discountValue === 5 ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  5%
                </button>
                <button
                  type="button"
                  onClick={() => { setDiscountType('percent'); setDiscountValue(10); }}
                  className="btn btn-sm"
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: discountType === 'percent' && discountValue === 10 ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: discountType === 'percent' && discountValue === 10 ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  10%
                </button>
                <div style={{ position: 'relative', width: '85px' }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rs 0"
                    value={discountType === 'flat' ? discountValue : ''}
                    onChange={(e) => {
                      setDiscountType('flat');
                      setDiscountValue(e.target.value);
                    }}
                    className="font-mono"
                    style={{
                      width: '100%',
                      height: '26px',
                      padding: '2px 6px',
                      textAlign: 'right',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>
            </div>

            {calculatedDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--success)' }}>
                <span>Discount applied:</span>
                <span className="font-mono" style={{ fontWeight: 800 }}>- Rs {calculatedDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Grand Total Payable */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--primary-glow)',
            marginTop: '2px'
          }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800, color: 'var(--primary)', display: 'block' }}>
                Total Payable
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net after discounts</span>
            </div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: 900, color: 'var(--primary)' }}>
              Rs {totalAmount.toFixed(2)}
            </div>
          </div>

          {/* Payment Method Switcher */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
            {[
              { id: 'cash', label: 'Cash 💵' },
              { id: 'card', label: 'Card 💳' },
              { id: 'khata', label: 'Khata 📋' },
              { id: 'online', label: 'Online 📱' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(m.id);
                  if (m.id === 'card' || m.id === 'online') {
                    setPaidAmount(totalAmount.toString());
                  } else if (m.id === 'khata') {
                    setPaidAmount('0');
                  }
                }}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  padding: '5px 0',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: paymentMethod === m.id ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: paymentMethod === m.id ? '#ffffff' : 'var(--text-secondary)',
                  border: paymentMethod === m.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Quick Cash Presets (Pakistani Currency) */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={setExactCash}
              className="pos-quick-note"
              style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
            >
              Exact
            </button>
            <button type="button" onClick={() => setFixedCashNote(100)} className="pos-quick-note">100</button>
            <button type="button" onClick={() => setFixedCashNote(500)} className="pos-quick-note">500</button>
            <button type="button" onClick={() => setFixedCashNote(1000)} className="pos-quick-note">1,000</button>
            <button type="button" onClick={() => setFixedCashNote(5000)} className="pos-quick-note">5,000</button>
            <button type="button" onClick={() => addCashAmount(50)} className="pos-quick-note">+50</button>
          </div>

          {/* Paid Amount Input */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>Amount Received:</span>
            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={totalAmount.toFixed(2)}
              className="font-mono"
              style={{
                width: '135px',
                height: '36px',
                padding: '4px 10px',
                textAlign: 'right',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border-focus)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontWeight: 900,
                fontSize: '15px'
              }}
            />
          </div>

          {/* Settlement / Change Banner */}
          {totalAmount > 0 && (
            <div>
              {changeDue > 0 ? (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1.5px solid var(--success)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--success)' }}>
                    Change to Return:
                  </span>
                  <span className="font-mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--success)' }}>
                    Rs {changeDue.toFixed(2)}
                  </span>
                </div>
              ) : balanceDue > 0 ? (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: !isWalkIn ? 'var(--warning-subtle)' : 'var(--danger-subtle)',
                  border: !isWalkIn ? '1.5px solid var(--warning)' : '1.5px solid var(--danger)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: !isWalkIn ? 'var(--warning)' : 'var(--danger)', display: 'block' }}>
                      {!isWalkIn ? 'Khata Debit Addition:' : 'Remaining Balance (Due):'}
                    </span>
                    {!isWalkIn && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Will update customer's Khata</span>
                    )}
                  </div>
                  <span className="font-mono" style={{ fontSize: '17px', fontWeight: 900, color: !isWalkIn ? 'var(--warning)' : 'var(--danger)' }}>
                    Rs {balanceDue.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: 'var(--success)',
                  fontWeight: 700
                }}>
                  ✓ Exact payment received in full
                </div>
              )}
            </div>
          )}

        </div>

        {/* Error message */}
        {checkoutError && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--danger-subtle)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Complete & Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={checkingOut || cart.length === 0}
          className="btn btn-primary btn-lg"
          style={{ 
            width: '100%', 
            padding: '13px', 
            fontSize: '14px', 
            fontWeight: 800, 
            letterSpacing: '0.02em',
            gap: '8px',
            boxShadow: '0 6px 20px var(--primary-glow)' 
          }}
        >
          <CreditCard size={18} />
          <span>{checkingOut ? 'Executing Transaction...' : 'Complete & Generate Receipt'}</span>
          <span 
            className="font-mono" 
            style={{ 
              fontSize: '10px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              marginLeft: '4px' 
            }}
          >
            F4
          </span>
        </button>
      </div>

      {/* =========================================================================
          Barcode Quick-Add Floating Toast
          ========================================================================= */}
      {scanToast.show && (
        <div className="pos-scan-toast">
          <CheckCircle size={18} />
          <span>{scanToast.message}</span>
        </div>
      )}

      {/* =========================================================================
          Parked / Held Sales Modal
          ========================================================================= */}
      <Modal
        isOpen={isParkedModalOpen}
        onClose={() => setIsParkedModalOpen(false)}
        title={`Parked / Held Orders (${parkedOrders.length})`}
        maxWidth="600px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {parkedOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
              No held sales currently parked.
            </p>
          ) : (
            parkedOrders.map(order => (
              <div 
                key={order.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {order.customerName}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      at {order.timestamp}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {order.cart.length} item{order.cart.length === 1 ? '' : 's'} • Total: <strong className="font-mono" style={{ color: 'var(--primary)' }}>Rs {order.totalAmount.toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleResumeParked(order)}
                    className="btn btn-primary btn-sm"
                  >
                    Resume Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscardParked(order.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger)' }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* =========================================================================
          Keyboard Shortcuts Helper Modal
          ========================================================================= */}
      <Modal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        title="POS Cashier Keyboard Shortcuts"
        maxWidth="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          {[
            { key: 'F2 or /', desc: 'Focus barcode scanner / search input' },
            { key: 'Enter in search', desc: 'Instantly add matched product to active order' },
            { key: 'F4 or Ctrl+Enter', desc: 'Complete sale & generate receipt' },
            { key: 'Alt + H', desc: 'Hold / park active sale for next customer' },
            { key: 'Alt + C', desc: 'Clear active cart' },
            { key: 'Alt + W', desc: 'Switch to Walk-in customer mode' },
            { key: 'Alt + K', desc: 'Switch to Khata ledger customer mode' },
            { key: 'Esc', desc: 'Close open dialogs & receipts' }
          ].map((item, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.desc}</span>
              <kbd 
                className="font-mono" 
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-card)', 
                  borderRadius: '4px', 
                  padding: '3px 8px', 
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--primary)'
                }}
              >
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </Modal>

      {/* =========================================================================
          Quick Add Customer Modal
          ========================================================================= */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Khata Customer"
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

      {/* =========================================================================
          Thermal Receipt Modal
          ========================================================================= */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={completedBill}
        onNewOrder={handleNewOrder}
      />
    </div>
  );
}
