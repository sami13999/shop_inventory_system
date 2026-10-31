import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Truck, 
  TrendingUp, 
  Package, 
  Layers, 
  AlertTriangle, 
  ShoppingCart, 
  Receipt, 
  Printer, 
  Users, 
  Scale, 
  CheckCircle2, 
  LayoutDashboard, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  MousePointer, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Database
} from 'lucide-react';
import './Flowchart.css';

// 16 System Architecture Nodes with Optimized Coordinates
const NODES = [
  // Column 1: Procurement & Inward Intake
  {
    id: 'suppliers',
    title: 'Suppliers & Vendors',
    category: 'procurement',
    col: 1,
    x: 30,
    y: 60,
    w: 215,
    h: 115,
    icon: Truck,
    type: 'Master Entity',
    table: 'suppliers',
    route: '/suppliers',
    shortDesc: 'Vendor contact directory and procurement contracts.',
    fullDesc: 'Maintains verified vendor profiles, contact details, addresses, and supply catalogs for wholesale shop replenishment.',
    sqlCode: `CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
    apiEndpoint: 'GET /api/suppliers | POST /api/suppliers',
    inputs: [],
    outputs: ['purchases']
  },
  {
    id: 'purchases',
    title: 'Stock Purchases',
    category: 'procurement',
    col: 1,
    x: 30,
    y: 210,
    w: 215,
    h: 125,
    icon: TrendingUp,
    type: 'Inward Invoicing',
    table: 'purchases, purchase_items',
    route: '/purchases',
    shortDesc: 'Vendor purchase orders with cost prices & intake quantities.',
    fullDesc: 'Records wholesale stock intake with line items (purchase_items). When saved, instantly invokes MySQL triggers to increment product inventory stock.',
    sqlCode: `CREATE TABLE purchases (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0.00,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);`,
    apiEndpoint: 'POST /api/purchases | GET /api/purchases',
    inputs: ['suppliers', 'low_stock_view'],
    outputs: ['trigger_purchase']
  },
  {
    id: 'trigger_purchase',
    title: 'Trigger: +Stock Addition',
    category: 'trigger',
    col: 1,
    x: 30,
    y: 375,
    w: 215,
    h: 115,
    icon: Zap,
    type: 'MySQL Trigger',
    table: 'after_purchase_item_insert',
    shortDesc: 'Auto-executes: stock_quantity = stock_quantity + NEW.quantity.',
    fullDesc: 'Automated database trigger that fires synchronously after every purchase_item row insertion. Guarantees zero inventory mismatch without manual intervention.',
    sqlCode: `CREATE TRIGGER after_purchase_item_insert
AFTER INSERT ON purchase_items
FOR EACH ROW
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE product_id = NEW.product_id;
END;`,
    apiEndpoint: 'Database Engine Event',
    inputs: ['purchases'],
    outputs: ['products']
  },

  // Column 2: Inventory & Catalog Gate
  {
    id: 'categories',
    title: 'Category Taxonomy',
    category: 'inventory',
    col: 2,
    x: 285,
    y: 60,
    w: 215,
    h: 115,
    icon: Layers,
    type: 'Catalog Tree',
    table: 'categories',
    shortDesc: 'Product groupings, taxonomies and department filters.',
    fullDesc: 'Organizes products into structured categories (Groceries, Beverages, Hardware, etc.) for streamlined cashier searching and category-wise sales metrics.',
    sqlCode: `CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE
);`,
    apiEndpoint: 'GET /api/products/categories',
    inputs: [],
    outputs: ['products']
  },
  {
    id: 'products',
    title: 'Products & Master Stock',
    category: 'inventory',
    col: 2,
    x: 285,
    y: 210,
    w: 215,
    h: 130,
    icon: Package,
    type: 'Core Inventory',
    table: 'products',
    route: '/products',
    shortDesc: 'Real-time stock counts, barcodes, purchase & selling prices.',
    fullDesc: 'Central inventory table tracking live product quantities, cost margins (purchase_price vs selling_price), and barcode indexes for instant POS lookups.',
    sqlCode: `CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id INT NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock_quantity INT NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);`,
    apiEndpoint: 'GET /api/products | POST /api/products | PUT /api/products/:id',
    inputs: ['categories', 'trigger_purchase', 'trigger_sale'],
    outputs: ['low_stock_view', 'pos_terminal', 'dashboard_bi']
  },
  {
    id: 'low_stock_view',
    title: 'Low Stock Alert Watcher',
    category: 'inventory',
    col: 2,
    x: 285,
    y: 375,
    w: 215,
    h: 115,
    icon: AlertTriangle,
    type: 'SQL View',
    table: 'view_low_stock',
    route: '/products',
    shortDesc: 'Monitors inventory items where stock_quantity <= 10.',
    fullDesc: 'Live SQL view that continuously evaluates product inventory thresholds. Highlights reorder flags on the executive dashboard to prevent stockouts.',
    sqlCode: `CREATE OR REPLACE VIEW view_low_stock AS
SELECT 
  p.product_id,
  p.name AS product_name,
  c.category_name,
  p.stock_quantity,
  p.selling_price
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.stock_quantity <= 10;`,
    apiEndpoint: 'GET /api/products/low-stock',
    inputs: ['products'],
    outputs: ['purchases', 'dashboard_bi']
  },

  // Column 3: POS Terminal & Live Checkout
  {
    id: 'customer_khata',
    title: 'Khata Customer Directory',
    category: 'khata',
    col: 3,
    x: 540,
    y: 60,
    w: 215,
    h: 115,
    icon: Users,
    type: 'Khata Profiles',
    table: 'customers',
    route: '/customers',
    shortDesc: 'Registered shop customers with credit / Udhar ledgers.',
    fullDesc: 'Customer identity master record. Associates walk-in customers or verified account holders with credit lines and bill payment histories.',
    sqlCode: `CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255)
);`,
    apiEndpoint: 'GET /api/customers | POST /api/customers',
    inputs: [],
    outputs: ['pos_terminal', 'khata_ledger_view']
  },
  {
    id: 'pos_terminal',
    title: 'Live POS Checkout',
    category: 'pos',
    col: 3,
    x: 540,
    y: 210,
    w: 215,
    h: 130,
    icon: ShoppingCart,
    type: 'Terminal Engine',
    table: 'Live Cart Session',
    route: '/pos',
    shortDesc: 'High-speed barcode scanner, live cart, and hotkey checkout.',
    fullDesc: 'Optimized cashier interface supporting barcode scanning, quick category search, customer assignment, and instant payment method routing.',
    sqlCode: `-- Active POS transaction session
SELECT product_id, name, selling_price, stock_quantity 
FROM products 
WHERE stock_quantity > 0;`,
    apiEndpoint: 'GET /api/products/search | POST /api/bills',
    inputs: ['products', 'customer_khata', 'system_users'],
    outputs: ['cart_calc']
  },
  {
    id: 'cart_calc',
    title: 'Pricing & Discount Engine',
    category: 'pos',
    col: 3,
    x: 540,
    y: 375,
    w: 215,
    h: 115,
    icon: Scale,
    type: 'Calculation Hub',
    table: 'Cart Calculations',
    shortDesc: 'Computes line totals, custom discounts, and payable dues.',
    fullDesc: 'Calculates subtotal, discounts, taxable amounts, and validates customer credit eligibility before dispatching the final order to the billing engine.',
    sqlCode: `-- Order line calculation
total_amount = SUM(quantity * unit_price) - discount;
balance_due = total_amount - paid_amount;`,
    apiEndpoint: 'Client Computation Pipeline',
    inputs: ['pos_terminal'],
    outputs: ['bill_generation']
  },

  // Column 4: Billing & Outward Trigger
  {
    id: 'receipt_print',
    title: 'Thermal Slip & Receipt',
    category: 'billing',
    col: 4,
    x: 795,
    y: 60,
    w: 215,
    h: 115,
    icon: Printer,
    type: 'Receipt Engine',
    table: 'Print Dispatcher',
    route: '/bills',
    shortDesc: 'Generates 80mm thermal receipt slips and digital PDF invoices.',
    fullDesc: 'Formats compliant receipts complete with shop logo, invoice number, itemized pricing, balance due, and cashier verification stamps.',
    sqlCode: `-- Thermal receipt generator layout
SELECT b.bill_id, b.bill_date, b.total_amount, b.paid_amount,
       c.name AS customer_name, u.user_name AS cashier
FROM bills b
LEFT JOIN customers c ON b.customer_id = c.customer_id
LEFT JOIN users u ON b.created_by = u.user_id;`,
    apiEndpoint: 'GET /api/bills/:id/print',
    inputs: ['bill_generation'],
    outputs: []
  },
  {
    id: 'bill_generation',
    title: 'Sales Invoices Engine',
    category: 'billing',
    col: 4,
    x: 795,
    y: 210,
    w: 215,
    h: 130,
    icon: Receipt,
    type: 'Invoicing Engine',
    table: 'bills, bill_items',
    route: '/bills',
    shortDesc: 'Generates sequential INV-XXXX bills with payment statuses.',
    fullDesc: 'Persists immutable sales records. Marks transaction as PAID, PARTIAL, or UNPAID. Inserting bill_items automatically triggers inventory stock deduction.',
    sqlCode: `CREATE TABLE bills (
  bill_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NULL,
  bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  paid_amount DECIMAL(12, 2) DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  created_by INT NULL
);`,
    apiEndpoint: 'POST /api/bills | GET /api/bills',
    inputs: ['cart_calc', 'payment_settlement'],
    outputs: ['trigger_sale', 'receipt_print', 'khata_ledger_view', 'dashboard_bi']
  },
  {
    id: 'trigger_sale',
    title: 'Trigger: -Stock Deduction',
    category: 'trigger',
    col: 4,
    x: 795,
    y: 375,
    w: 215,
    h: 115,
    icon: Zap,
    type: 'MySQL Trigger',
    table: 'after_bill_item_insert',
    shortDesc: 'Auto-executes: stock_quantity = stock_quantity - NEW.quantity.',
    fullDesc: 'Automated database trigger that fires synchronously after every bill_item row insertion. Decrements the exact sold quantity from inventory master.',
    sqlCode: `CREATE TRIGGER after_bill_item_insert
AFTER INSERT ON bill_items
FOR EACH ROW
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE product_id = NEW.product_id;
END;`,
    apiEndpoint: 'Database Engine Event',
    inputs: ['bill_generation'],
    outputs: ['products']
  },

  // Column 5: Khata Ledger & Executive BI
  {
    id: 'khata_ledger_view',
    title: 'Customer Khata Ledger',
    category: 'khata',
    col: 5,
    x: 1045,
    y: 60,
    w: 205,
    h: 115,
    icon: Scale,
    type: 'SQL View',
    table: 'view_customer_khata',
    route: '/customers',
    shortDesc: 'Computes remaining_balance = total_bills - total_paid.',
    fullDesc: 'Dynamically calculates outstanding debt and credit balances per customer across all lifetime sales invoices in real time.',
    sqlCode: `CREATE OR REPLACE VIEW view_customer_khata AS
SELECT 
  c.customer_id,
  c.name AS customer_name,
  c.phone,
  COUNT(b.bill_id) AS total_bills,
  COALESCE(SUM(b.total_amount), 0) AS total_purchase_amount,
  COALESCE(SUM(b.paid_amount), 0) AS total_paid_amount,
  (COALESCE(SUM(b.total_amount), 0) - COALESCE(SUM(b.paid_amount), 0)) AS remaining_balance
FROM customers c
LEFT JOIN bills b ON c.customer_id = b.customer_id
GROUP BY c.customer_id, c.name, c.phone;`,
    apiEndpoint: 'GET /api/customers/khata',
    inputs: ['customer_khata', 'bill_generation'],
    outputs: ['payment_settlement', 'dashboard_bi']
  },
  {
    id: 'payment_settlement',
    title: 'Khata Debt Settlement',
    category: 'khata',
    col: 5,
    x: 1045,
    y: 210,
    w: 205,
    h: 125,
    icon: CheckCircle2,
    type: 'Settlement Engine',
    table: 'bills (paid_amount)',
    route: '/customers',
    shortDesc: 'Settles overdue customer debt with cash / partial recovery.',
    fullDesc: 'Processes debt recovery payments against unpaid or partially paid bills. Updates paid_amount and switches status to PAID once balance clears.',
    sqlCode: `UPDATE bills 
SET paid_amount = paid_amount + :payment,
    payment_status = CASE 
      WHEN (paid_amount + :payment) >= total_amount THEN 'paid'
      ELSE 'partial'
    END
WHERE bill_id = :bill_id;`,
    apiEndpoint: 'PATCH /api/bills/:id/pay',
    inputs: ['khata_ledger_view'],
    outputs: ['bill_generation']
  },
  {
    id: 'dashboard_bi',
    title: 'Executive BI Dashboard',
    category: 'analytics',
    col: 5,
    x: 1045,
    y: 375,
    w: 205,
    h: 125,
    icon: LayoutDashboard,
    type: 'Analytics Hub',
    table: 'Live Aggregates',
    route: '/',
    shortDesc: 'Real-time sales revenue, gross margin, receivables & stock value.',
    fullDesc: 'Aggregates sales performance, revenue velocity, total Khata debt receivables, and stock reorder warnings in a live unified executive dashboard.',
    sqlCode: `-- Executive Metrics Aggregation
SELECT 
  SUM(total_amount) AS total_revenue,
  SUM(paid_amount) AS cash_collected,
  SUM(total_amount - paid_amount) AS total_receivable,
  (SELECT COUNT(*) FROM products WHERE stock_quantity <= 10) AS low_stock_count
FROM bills;`,
    apiEndpoint: 'GET /api/dashboard/summary',
    inputs: ['bill_generation', 'products', 'khata_ledger_view', 'low_stock_view'],
    outputs: []
  },

  // Base Row: Authentication & Cashier Session
  {
    id: 'system_users',
    title: 'Cashier Authentication Gate',
    category: 'auth',
    col: 3,
    x: 540,
    y: 535,
    w: 215,
    h: 80,
    icon: ShieldCheck,
    type: 'Security Hub',
    table: 'users',
    route: '/login',
    shortDesc: 'Role-based access control, cashier audit logs, & JWT sessions.',
    fullDesc: 'Authenticates cashiers and administrators. Ties every bill and procurement order to the logged-in user for complete accountability.',
    sqlCode: `CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(100),
  password VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
    apiEndpoint: 'POST /api/auth/login | POST /api/auth/register',
    inputs: [],
    outputs: ['pos_terminal']
  }
];

// Defined Connections between Nodes
const CONNECTIONS = [
  { id: 'c1', from: 'suppliers', to: 'purchases', flowType: 'inward', label: 'Supplier Catalog & Terms' },
  { id: 'c2', from: 'purchases', to: 'trigger_purchase', flowType: 'trigger', label: 'Inserts purchase_items' },
  { id: 'c3', from: 'trigger_purchase', to: 'products', flowType: 'inward', label: '+Stock Increment Trigger' },
  { id: 'c4', from: 'categories', to: 'products', flowType: 'normal', label: 'Product Taxonomy' },
  { id: 'c5', from: 'products', to: 'low_stock_view', flowType: 'normal', label: 'Stock <= 10 Monitor' },
  { id: 'c6', from: 'low_stock_view', to: 'purchases', flowType: 'inward', label: 'Replenishment Reorder' },
  { id: 'c7', from: 'products', to: 'pos_terminal', flowType: 'normal', label: 'Barcode & Catalog Stream' },
  { id: 'c8', from: 'customer_khata', to: 'pos_terminal', flowType: 'normal', label: 'Customer Assignment' },
  { id: 'c9', from: 'pos_terminal', to: 'cart_calc', flowType: 'normal', label: 'Cart Items & Quantities' },
  { id: 'c10', from: 'cart_calc', to: 'bill_generation', flowType: 'outward', label: 'Finalized Order Invoice' },
  { id: 'c11', from: 'bill_generation', to: 'receipt_print', flowType: 'outward', label: '80mm Thermal Slip' },
  { id: 'c12', from: 'bill_generation', to: 'trigger_sale', flowType: 'trigger', label: 'Inserts bill_items' },
  { id: 'c13', from: 'trigger_sale', to: 'products', flowType: 'outward', label: '-Stock Deduction Trigger' },
  { id: 'c14', from: 'customer_khata', to: 'khata_ledger_view', flowType: 'normal', label: 'Credit Account Link' },
  { id: 'c15', from: 'bill_generation', to: 'khata_ledger_view', flowType: 'outward', label: 'Udhar Balance Post' },
  { id: 'c16', from: 'khata_ledger_view', to: 'payment_settlement', flowType: 'normal', label: 'Outstanding Debt' },
  { id: 'c17', from: 'payment_settlement', to: 'bill_generation', flowType: 'inward', label: 'Settlement Update' },
  { id: 'c18', from: 'bill_generation', to: 'dashboard_bi', flowType: 'normal', label: 'Revenue & Gross Profit' },
  { id: 'c19', from: 'products', to: 'dashboard_bi', flowType: 'normal', label: 'Inventory Valuation' },
  { id: 'c20', from: 'khata_ledger_view', to: 'dashboard_bi', flowType: 'normal', label: 'Total Receivables' },
  { id: 'c21', from: 'low_stock_view', to: 'dashboard_bi', flowType: 'trigger', label: 'Low Stock Flag' },
  { id: 'c22', from: 'system_users', to: 'pos_terminal', flowType: 'normal', label: 'Cashier Auth Session' }
];

// 10-step End-to-End Simulation Sequence
const SIM_STEPS = [
  {
    step: 1,
    nodeId: 'suppliers',
    title: '1. Vendor Procurement Onboarding',
    desc: 'Supplier "Premier Wholesale Corp" dispatches 50 units of Inventory. PO is drafted.'
  },
  {
    step: 2,
    nodeId: 'purchases',
    title: '2. Stock Purchase Intake',
    desc: 'Inward purchase invoice recorded with purchase unit price Rs. 180.00.'
  },
  {
    step: 3,
    nodeId: 'trigger_purchase',
    title: '3. MySQL Trigger (+Stock)',
    desc: 'Database trigger "after_purchase_item_insert" fires: stock_quantity increments by +50!'
  },
  {
    step: 4,
    nodeId: 'products',
    title: '4. Inventory Catalog Synchronized',
    desc: 'Live stock quantity reflected in product master. Low-stock alarm clears.'
  },
  {
    step: 5,
    nodeId: 'customer_khata',
    title: '5. Khata Customer Identified',
    desc: 'Customer "Ali Khan" arrives at POS counter. Previous Khata ledger balance retrieved.'
  },
  {
    step: 6,
    nodeId: 'pos_terminal',
    title: '6. POS Barcode Scan & Cart',
    desc: 'Cashier scans item barcode. Item added to active cart at retail price Rs. 270.00.'
  },
  {
    step: 7,
    nodeId: 'bill_generation',
    title: '7. Sales Invoice Generation',
    desc: 'Official invoice INV-0008 created with payment status "UNPAID" (Udhar credit sale).'
  },
  {
    step: 8,
    nodeId: 'trigger_sale',
    title: '8. MySQL Trigger (-Stock)',
    desc: 'Database trigger "after_bill_item_insert" fires: stock_quantity decrements by -1!'
  },
  {
    step: 9,
    nodeId: 'khata_ledger_view',
    title: '9. Khata Debt Ledger Calculation',
    desc: 'SQL view "view_customer_khata" updates: Ali Khan balance now reflects Rs. 270.00 due.'
  },
  {
    step: 10,
    nodeId: 'dashboard_bi',
    title: '10. Executive Analytics Synchronized',
    desc: 'Real-time sales revenue, gross margin and Khata receivables update automatically.'
  }
];

export default function FlowchartPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Focus and Blur Mode State
  const [focusMode, setFocusMode] = useState('node-focus');
  const [blurIntensity, setBlurIntensity] = useState(6);

  // Hover and selection state
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  // Mouse cursor coordinate state for spotlight/torch effect
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const [simSpeed, setSimSpeed] = useState(2500);

  // Copy code state
  const [copiedCode, setCopiedCode] = useState(false);

  // Escape key handler to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track Mouse movement over the canvas for the requested cursor point spotlight blur
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsMouseOverCanvas(true);
  const handleMouseLeave = () => {
    setIsMouseOverCanvas(false);
    setHoveredNodeId(null);
  };

  // Automated Simulation Timer
  useEffect(() => {
    let timer;
    if (isSimulating) {
      timer = setInterval(() => {
        setSimStepIndex((prev) => {
          if (prev >= SIM_STEPS.length - 1) {
            setIsSimulating(false);
            return 0;
          }
          return prev + 1;
        });
      }, simSpeed);
    }
    return () => clearInterval(timer);
  }, [isSimulating, simSpeed]);

  const currentSimStep = SIM_STEPS[simStepIndex];
  const activeSimNodeId = isSimulating ? currentSimStep.nodeId : null;

  // Compute active focus node (simulation takes priority when active)
  const activeFocusNodeId = isSimulating ? activeSimNodeId : hoveredNodeId;

  const connectedNodeIds = useMemo(() => {
    if (!activeFocusNodeId) return new Set();
    const set = new Set();
    CONNECTIONS.forEach((conn) => {
      if (conn.from === activeFocusNodeId) set.add(conn.to);
      if (conn.to === activeFocusNodeId) set.add(conn.from);
    });
    return set;
  }, [activeFocusNodeId]);

  // Compute active connection lines
  const activeConnectionIds = useMemo(() => {
    if (!activeFocusNodeId) return new Set();
    const set = new Set();
    CONNECTIONS.forEach((conn) => {
      if (conn.from === activeFocusNodeId || conn.to === activeFocusNodeId) {
        set.add(conn.id);
      }
    });
    return set;
  }, [activeFocusNodeId]);

  // Node center calculation helper for SVG cables
  const getNodeCenter = (nodeId) => {
    const node = NODES.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.x + node.w / 2,
      y: node.y + node.h / 2,
      left: node.x,
      right: node.x + node.w,
      top: node.y,
      bottom: node.y + node.h,
      width: node.w,
      height: node.h
    };
  };

  // Generate SVG Bezier Path between two nodes
  const renderPath = (conn) => {
    const fromNode = getNodeCenter(conn.from);
    const toNode = getNodeCenter(conn.to);

    let startX = fromNode.right;
    let startY = fromNode.y;
    let endX = toNode.left;
    let endY = toNode.y;

    // Smart anchor port detection based on relative node alignment
    if (Math.abs(fromNode.x - toNode.x) < 40) {
      // Vertical alignment
      if (toNode.y > fromNode.y) {
        startX = fromNode.x;
        startY = fromNode.bottom;
        endX = toNode.x;
        endY = toNode.top;
      } else {
        startX = fromNode.x;
        startY = fromNode.top;
        endX = toNode.x;
        endY = toNode.bottom;
      }
    } else if (fromNode.x > toNode.x) {
      // Loopback or reverse direction
      startX = fromNode.left;
      startY = fromNode.bottom;
      endX = toNode.right;
      endY = toNode.bottom;
    }

    const deltaX = Math.abs(endX - startX) * 0.45;

    let d;
    if (Math.abs(fromNode.x - toNode.x) < 40) {
      d = `M ${startX} ${startY} C ${startX} ${startY + 25}, ${endX} ${endY - 25}, ${endX} ${endY}`;
    } else if (fromNode.x > toNode.x) {
      d = `M ${startX} ${startY} C ${startX - 40} ${startY + 50}, ${endX + 40} ${endY + 50}, ${endX} ${endY}`;
    } else {
      d = `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;
    }

    const isActive = activeConnectionIds.has(conn.id);
    const isBlurred = activeFocusNodeId && !isActive && focusMode === 'node-focus';

    return (
      <g key={conn.id}>
        {/* Base Track */}
        <path
          d={d}
          className={`flow-cable ${isActive ? 'active-connection' : ''} ${isBlurred ? 'blurred' : ''}`}
        />
        {/* Animated Pulsing Signal along line */}
        <path
          d={d}
          className={`flow-pulse-cable ${conn.flowType} ${isBlurred ? 'blurred' : ''}`}
          style={{
            strokeWidth: isActive ? 3.5 : 2,
            opacity: isBlurred ? 0.08 : (isActive ? 1 : 0.6)
          }}
        />
      </g>
    );
  };

  // Determine node blur and focus styles based on active mode
  const getNodeVisualState = (node) => {
    const isSelf = activeFocusNodeId === node.id;
    const isConnected = connectedNodeIds.has(node.id);
    const isSimActive = activeSimNodeId === node.id;

    if (focusMode === 'sharp') {
      return {
        className: isSimActive ? 'sim-active' : (isSelf ? 'focused' : ''),
        style: {}
      };
    }

    if (focusMode === 'node-focus') {
      if (!activeFocusNodeId) {
        return { className: '', style: {} };
      }
      if (isSelf) {
        return { className: isSimActive ? 'sim-active' : 'focused', style: {} };
      }
      if (isConnected) {
        return { className: 'connected-focus', style: {} };
      }
      // THE BLUR STATE: All remaining nodes are blurred
      return {
        className: 'blurred',
        style: {
          filter: `blur(${blurIntensity}px) grayscale(0.55)`,
          opacity: 0.2,
          transform: 'scale(0.96)'
        }
      };
    }

    if (focusMode === 'cursor-torch') {
      // Dynamic blur based on Euclidean distance to mouse cursor point
      if (!isMouseOverCanvas) {
        return { className: '', style: {} };
      }
      const nodeCenterX = node.x + node.w / 2;
      const nodeCenterY = node.y + node.h / 2;
      const dist = Math.hypot(nodeCenterX - mousePos.x, nodeCenterY - mousePos.y);

      // Distance threshold: within 160px is 100% sharp, beyond that smoothly blurs
      if (dist < 160) {
        return {
          className: 'focused',
          style: {
            filter: 'none',
            opacity: 1,
            transform: 'scale(1.05)',
            boxShadow: '0 0 30px var(--primary-glow)'
          }
        };
      } else if (dist < 310) {
        const factor = (dist - 160) / (310 - 160);
        const blur = (factor * blurIntensity).toFixed(1);
        const opacity = (1 - factor * 0.6).toFixed(2);
        return {
          className: '',
          style: {
            filter: `blur(${blur}px)`,
            opacity: opacity,
            transform: `scale(${1 - factor * 0.04})`
          }
        };
      } else {
        return {
          className: 'blurred',
          style: {
            filter: `blur(${blurIntensity}px) grayscale(0.6)`,
            opacity: 0.18,
            transform: 'scale(0.95)'
          }
        };
      }
    }

    return { className: '', style: {} };
  };

  const handleCopySql = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flowchart-page animate-fade-in">
      {/* Interactive Controls Bar */}
      <div className="flowchart-controls-bar">
        {/* Left: Focus & Blur Mode Selector */}
        <div className="controls-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MousePointer size={15} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Interactive Focus:
            </span>
          </div>

          <div className="mode-pill-group">
            <button
              onClick={() => setFocusMode('node-focus')}
              className={`mode-pill ${focusMode === 'node-focus' ? 'active' : ''}`}
              title="Point at any node to show its data flow clearly and blur remaining nodes"
            >
              <Eye size={13} />
              <span>Node Smart Focus (Blur Rest)</span>
            </button>

            <button
              onClick={() => setFocusMode('cursor-torch')}
              className={`mode-pill ${focusMode === 'cursor-torch' ? 'active' : ''}`}
              title="Where the mouse cursor points is shown clearly, all remaining elements are blurred"
            >
              <Sparkles size={13} />
              <span>Cursor Torch Blur</span>
            </button>

            <button
              onClick={() => setFocusMode('sharp')}
              className={`mode-pill ${focusMode === 'sharp' ? 'active' : ''}`}
              title="Show all flowchart nodes without background blur"
            >
              <EyeOff size={13} />
              <span>All Clear</span>
            </button>
          </div>

          {/* Blur Intensity Slider */}
          {focusMode !== 'sharp' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Blur:</span>
              <input
                type="range"
                min="3"
                max="10"
                value={blurIntensity}
                onChange={(e) => setBlurIntensity(Number(e.target.value))}
                style={{ width: '55px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                title={`Blur intensity: ${blurIntensity}px`}
              />
              <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>
                {blurIntensity}px
              </span>
            </div>
          )}
        </div>

        {/* Center: Live Order Simulation Controls */}
        <div className="controls-center">
          <button
            id="btn-simulate-flow"
            onClick={() => {
              if (isSimulating) {
                setIsSimulating(false);
              } else {
                setSimStepIndex(0);
                setIsSimulating(true);
              }
            }}
            className={`btn ${isSimulating ? 'btn-danger' : 'btn-primary'} btn-sm`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '6px 14px' }}
          >
            {isSimulating ? (
              <>
                <Pause size={14} />
                <span>Pause Simulation</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Simulate Complete Order Flow</span>
              </>
            )}
          </button>

          {isSimulating && (
            <button
              onClick={() => {
                setIsSimulating(false);
                setSimStepIndex(0);
              }}
              className="btn btn-secondary btn-sm"
              title="Reset simulation"
              style={{ padding: '5px 8px' }}
            >
              <RotateCcw size={12} />
            </button>
          )}

          {isSimulating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Speed:</span>
              <select
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                className="filter-select"
                style={{ padding: '2px 6px', fontSize: '10.5px' }}
              >
                <option value={3500}>0.7x (Slow)</option>
                <option value={2500}>1.0x (Normal)</option>
                <option value={1400}>1.8x (Fast)</option>
              </select>
            </div>
          )}
        </div>

        {/* Right: Subsystem Filter */}
        <div className="controls-right">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Filter:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Architecture (16 Nodes)</option>
            <option value="procurement">Procurement & Vendors</option>
            <option value="inventory">Products & Stock</option>
            <option value="pos">POS Terminal & Checkout</option>
            <option value="billing">Sales Invoices & Triggers</option>
            <option value="khata">Khata Customer Ledger</option>
            <option value="analytics">Executive Analytics</option>
          </select>
        </div>
      </div>

      {/* Simulation Live Progress Banner */}
      {isSimulating && (
        <div className="sim-hud-banner">
          <div className="sim-hud-content">
            <span className="sim-step-badge">
              STEP {currentSimStep.step} / {SIM_STEPS.length}
            </span>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '12.5px', color: '#ffffff' }}>
                {currentSimStep.title}
              </p>
              <p className="sim-hud-text" style={{ margin: 0, opacity: 0.9 }}>
                {currentSimStep.desc}
              </p>
            </div>
          </div>

          <div className="sim-hud-controls">
            <button
              onClick={() => setSimStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={simStepIndex === 0}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '10.5px' }}
            >
              Prev
            </button>
            <button
              onClick={() => setSimStepIndex((prev) => Math.min(SIM_STEPS.length - 1, prev + 1))}
              disabled={simStepIndex === SIM_STEPS.length - 1}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '10.5px' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Main Flowchart Viewport Canvas */}
      <div 
        ref={canvasRef}
        className="flowchart-viewport"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background Grid Pattern */}
        <div className="flowchart-grid-bg" />

        {/* Dynamic Cursor Spotlight Torchlight that tracks mouse pointer */}
        {focusMode === 'cursor-torch' && isMouseOverCanvas && (
          <div 
            className="cursor-spotlight-torch"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`
            }}
          />
        )}

        {/* Swimlane Headers */}
        <div className="swimlanes-header">
          <div className="swimlane-col-label">
            <span className="swimlane-col-title">1. Procurement & Intake</span>
            <div className="swimlane-col-subtitle">Vendor Inward Supply</div>
          </div>
          <div className="swimlane-col-label">
            <span className="swimlane-col-title">2. Inventory Master</span>
            <div className="swimlane-col-subtitle">Live Stock & Categories</div>
          </div>
          <div className="swimlane-col-label">
            <span className="swimlane-col-title">3. POS Terminal Checkout</span>
            <div className="swimlane-col-subtitle">Live Barcode & Cart</div>
          </div>
          <div className="swimlane-col-label">
            <span className="swimlane-col-title">4. Billing & Triggers</span>
            <div className="swimlane-col-subtitle">Invoices & Stock Deduct</div>
          </div>
          <div className="swimlane-col-label">
            <span className="swimlane-col-title">5. Khata Ledger & BI</span>
            <div className="swimlane-col-subtitle">Customer Debt & Metrics</div>
          </div>
        </div>

        {/* SVG Cable Connector Layer */}
        <svg className="flowchart-svg-layer" viewBox="0 0 1280 630" preserveAspectRatio="none">
          <defs>
            <linearGradient id="glowIndigo" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="glowEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {CONNECTIONS.map(renderPath)}
        </svg>

        {/* Interactive Flow Nodes Layer */}
        <div className="flowchart-nodes-layer">
          {NODES.map((node) => {
            const Icon = node.icon;
            const isMatchFilter = filterCategory === 'all' || node.category === filterCategory;
            const { className: stateClass, style: stateStyle } = getNodeVisualState(node);

            return (
              <div
                key={node.id}
                className={`flow-node-card cat-${node.category} ${stateClass} ${!isMatchFilter ? 'blurred' : ''}`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.w}px`,
                  height: `${node.h}px`,
                  ...stateStyle
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onClick={() => setSelectedNode(node)}
                title={`Click to inspect ${node.title} architecture`}
              >
                {/* Node Anchor Ports */}
                <span className="node-port port-in" />
                <span className="node-port port-out" />

                {/* Header */}
                <div className="node-header">
                  <div className="node-icon-wrapper">
                    <Icon size={15} />
                  </div>
                  <span className="node-type-tag">{node.type}</span>
                </div>

                {/* Title & Short Description */}
                <div>
                  <h4 className="node-title">{node.title}</h4>
                  <p className="node-desc">{node.shortDesc}</p>
                </div>

                {/* Footer with database table / view badge */}
                <div className="node-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Database size={9} style={{ color: 'var(--text-muted)' }} />
                    <span className="node-table-badge">{node.table}</span>
                  </div>
                  <span style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--primary)' }}>
                    Inspect →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Guide Bar */}
      <div className="flowchart-legend">
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#a78bfa' }} />
            <span>Procurement & Vendors</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#60a5fa' }} />
            <span>Master Inventory</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#34d399' }} />
            <span>POS Live Checkout</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#fb7185' }} />
            <span>Sales Invoicing</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#f472b6' }} />
            <span>MySQL Automated Triggers</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#fbbf24' }} />
            <span>Khata Udhar Ledger</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#818cf8' }} />
            <span>Executive Analytics</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <HelpCircle size={12} />
          <span>Hover any node to isolate its live data pipeline; Click to inspect database schema</span>
        </div>
      </div>

      {/* Node Deep-Dive Inspector Slide-Over Drawer & Backdrop */}
      {selectedNode && (
        <>
          <div 
            className="drawer-backdrop" 
            onClick={() => setSelectedNode(null)} 
          />
          <div className="node-inspector-drawer">
            {/* Header */}
            <div className="inspector-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  className="node-icon-wrapper" 
                  style={{ 
                    background: 'var(--primary-subtle)', 
                    color: 'var(--primary)',
                    width: '32px',
                    height: '32px'
                  }}
                >
                  {React.createElement(selectedNode.icon, { size: 18 })}
                </div>
                <div>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedNode.title}
                  </h3>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {selectedNode.type} • Column {selectedNode.col}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '5px', borderRadius: '50%' }}
                title="Close drawer (Esc)"
              >
                <X size={15} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="inspector-body">
              {/* Description */}
              <div className="inspector-section">
                <span className="inspector-section-title">Component Role & Description</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {selectedNode.fullDesc}
                </p>
              </div>

              {/* Quick Navigation to this page */}
              {selectedNode.route && (
                <div className="inspector-section">
                  <button
                    onClick={() => navigate(selectedNode.route)}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      padding: '8px 14px'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Open {selectedNode.title} Module</span>
                  </button>
                </div>
              )}

              {/* API Endpoints */}
              <div className="inspector-section">
                <span className="inspector-section-title">Backend REST Endpoints</span>
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-primary)'
                }}>
                  {selectedNode.apiEndpoint}
                </div>
              </div>

              {/* Data Pipeline Dependencies */}
              <div className="inspector-section">
                <span className="inspector-section-title">Data Pipeline Flow</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{
                    padding: '8px 10px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-muted)' }}>INPUTS</span>
                    <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedNode.inputs.length > 0 ? selectedNode.inputs.map((inId) => (
                        <span key={inId} style={{ fontSize: '9.5px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '2px 5px', borderRadius: '3px' }}>
                          {inId}
                        </span>
                      )) : (
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>External / Root</span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-muted)' }}>OUTPUTS</span>
                    <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedNode.outputs.length > 0 ? selectedNode.outputs.map((outId) => (
                        <span key={outId} style={{ fontSize: '9.5px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '2px 5px', borderRadius: '3px' }}>
                          {outId}
                        </span>
                      )) : (
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Final Consumer</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SQL Schema / Trigger / Query Box */}
              <div className="inspector-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="inspector-section-title">MySQL Schema & Triggers</span>
                  <button
                    onClick={() => handleCopySql(selectedNode.sqlCode)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10.5px',
                      fontWeight: 600
                    }}
                  >
                    {copiedCode ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                    <span>{copiedCode ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>

                <div className="sql-code-box">
                  {selectedNode.sqlCode}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
