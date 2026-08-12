import React, { useState, useEffect } from 'react';
import logoImg from '../../assets/LOGO.svg';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  ChevronDown, 
  Package, 
  Users, 
  Truck, 
  User, 
  LogOut 
} from 'lucide-react';

function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const [isDocOpen, setIsDocOpen] = useState(() => {
    return ['quotation', 'invoice', 'receipt'].includes(activeTab);
  });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (['quotation', 'invoice', 'receipt'].includes(activeTab)) {
      setIsDocOpen(true);
    }
  }, [activeTab]);

  const isExpanded = isDocOpen || isHovered;
  const isDocActive = ['quotation', 'invoice', 'receipt'].includes(activeTab);

  return (
    <div className="dashboard-sidebar">
      {/* 1. Header Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '24px' }}>
        <div className="sidebar-logo-container" style={{ justifyContent: 'center' }}>
          <img 
            src={logoImg} 
            alt="ST TRAN EXPRESS" 
            style={{ height: '65px', maxWidth: '100%', objectFit: 'contain' }} 
          />
        </div>
      </div>

      {/* 2. Menu Items Container */}
      <div className="sidebar-menu-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '4px' }}>
        
        {/* --- MAIN GROUP --- */}
        <div className="sidebar-group">
          <div className="sidebar-group-title">MAIN</div>
          <ul className="sidebar-menu-list">
            
            {/* Dashboard */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="sidebar-menu-item-icon">
                <LayoutDashboard size={18} />
              </span>
              <span>Dashboard</span>
            </li>

            {/* Booking */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'booking' ? 'active' : ''}`}
              onClick={() => setActiveTab('booking')}
            >
              <span className="sidebar-menu-item-icon">
                <ClipboardList size={18} />
              </span>
              <span>Booking</span>
            </li>

            {/* Document Center */}
            <li 
              style={{ display: 'flex', flexDirection: 'column' }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div 
                onClick={() => setIsDocOpen(prev => !prev)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: isDocActive ? '#0284c7' : '#475569',
                  backgroundColor: isDocActive ? '#f0f9ff' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="sidebar-menu-item-icon">
                    <FileText size={18} color={isDocActive ? '#0284c7' : '#64748b'} />
                  </span>
                  <span>Document Center</span>
                </div>
                <ChevronDown 
                  size={16} 
                  color={isDocActive ? '#0284c7' : '#64748b'} 
                  style={{ 
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease' 
                  }}
                />
              </div>
              
              {/* Sub-menus */}
              <div 
                style={{ 
                  maxHeight: isExpanded ? '200px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-in-out',
                  marginTop: isExpanded ? '4px' : '0px'
                }}
              >
                <ul style={{ 
                  listStyle: 'none', 
                  paddingLeft: '32px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '2px' 
                }}>
                  <li 
                    className={`sidebar-menu-item ${activeTab === 'quotation' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quotation')}
                    style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                  >
                    Quotation
                  </li>
                  <li 
                    className={`sidebar-menu-item ${activeTab === 'invoice' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invoice')}
                    style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                  >
                    Invoice
                  </li>
                  <li 
                    className={`sidebar-menu-item ${activeTab === 'receipt' ? 'active' : ''}`}
                    onClick={() => setActiveTab('receipt')}
                    style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                  >
                    Receipt
                  </li>
                </ul>
              </div>
            </li>

            {/* Delivery Order (DO) */}
            <li
              className={`sidebar-menu-item ${activeTab === 'delivery-order' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivery-order')}
            >
              <span className="sidebar-menu-item-icon">
                <Package size={18} />
              </span>
              <span>Delivery Order (DO)</span>
            </li>

          </ul>
        </div>

        {/* --- MASTER DATA GROUP --- */}
        <div className="sidebar-group">
          <div className="sidebar-group-title">MASTER DATA</div>
          <ul className="sidebar-menu-list">
            
            {/* Customers */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <span className="sidebar-menu-item-icon">
                <Users size={18} />
              </span>
              <span>Customers</span>
            </li>

            {/* Trucks */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'trucks' ? 'active' : ''}`}
              onClick={() => setActiveTab('trucks')}
            >
              <span className="sidebar-menu-item-icon">
                <Truck size={18} />
              </span>
              <span>Trucks</span>
            </li>

            {/* Drivers */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'driver' ? 'active' : ''}`}
              onClick={() => setActiveTab('driver')}
            >
              <span className="sidebar-menu-item-icon">
                <User size={18} />
              </span>
              <span>Drivers</span>
            </li>

          </ul>
        </div>

      </div>



      <button className="sidebar-logout-btn" onClick={onLogout}>
        <LogOut size={16} />
        <span>Log out</span>
      </button>
    </div>
  );
}

export default Sidebar;