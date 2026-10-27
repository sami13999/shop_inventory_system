import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('aurapos_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('aurapos_sidebar_open', String(next));
      return next;
    });
  };

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Analytics & Executive Dashboard', subtitle: 'Live overview of sales, Khata debt ledger & inventory health' };
      case '/pos':
        return { title: 'Point of Sale Terminal', subtitle: 'Fast barcode & live catalog checkout system' };
      case '/products':
        return { title: 'Products & Inventory', subtitle: 'Manage stock levels, categories, purchase & selling prices' };
      case '/customers':
        return { title: 'Customers & Khata Ledger', subtitle: 'Track customer balances, debt, and credit transaction ledger' };
      case '/suppliers':
        return { title: 'Suppliers Directory', subtitle: 'Vendor contacts and procurement history' };
      case '/purchases':
        return { title: 'Stock Procurement', subtitle: 'Intake supplier inventory orders with automated stock increment' };
      case '/bills':
        return { title: 'Sales Invoices & History', subtitle: 'Review customer receipts and manage payment settlements' };
      default:
        return { title: 'AuraPOS Management System', subtitle: '' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <Header 
          pageTitle={title} 
          pageSubtitle={subtitle} 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar} 
        />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
