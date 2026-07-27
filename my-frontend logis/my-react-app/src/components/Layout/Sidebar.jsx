import React from 'react';
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
  return (
    <div className="dashboard-sidebar">
      {/* 1. Header Logo */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '32px', gap: '12px', paddingLeft: '8px' }}>
        <div className="sidebar-logo-container">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#1872b2" />
            <circle cx="16" cy="10" r="2.5" fill="white" />
            <circle cx="10" cy="20" r="2.5" fill="white" />
            <circle cx="22" cy="20" r="2.5" fill="white" />
            <line x1="16" y1="10" x2="10" y2="20" stroke="white" strokeWidth="1.5" />
            <line x1="16" y1="10" x2="22" y2="20" stroke="white" strokeWidth="1.5" />
            <line x1="10" y1="20" x2="22" y2="20" stroke="white" strokeWidth="1.5" />
            <circle cx="16" cy="16.5" r="1.5" fill="white" />
            <line x1="16" y1="10" x2="16" y2="16.5" stroke="white" strokeWidth="1.5" />
            <line x1="10" y1="20" x2="16" y2="16.5" stroke="white" strokeWidth="1.5" />
            <line x1="22" y1="20" x2="16" y2="16.5" stroke="white" strokeWidth="1.5" />
          </svg>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-brand">LogiFlow</span>
            <span className="sidebar-logo-sub">Logistics ERP</span>
          </div>
        </div>
      </div>

      {/* 2. Menu Items Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '4px' }}>
        
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
              className="sidebar-menu-item"
              onClick={() => alert('ระบบ Booking ยังไม่เปิดให้บริการในเวอร์ชันนี้')}
            >
              <span className="sidebar-menu-item-icon">
                <ClipboardList size={18} />
              </span>
              <span>Booking</span>
            </li>

            {/* Document Center */}
            <li style={{ display: 'flex', flexDirection: 'column' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="sidebar-menu-item-icon">
                    <FileText size={18} color="#64748b" />
                  </span>
                  <span>Document Center</span>
                </div>
                <ChevronDown size={16} color="#64748b" />
              </div>
              
              {/* Sub-menus */}
              <ul style={{ 
                listStyle: 'none', 
                paddingLeft: '32px', 
                marginTop: '4px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '2px' 
              }}>
                <li 
                  className={`sidebar-menu-item ${activeTab === 'quotation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quotation')}
                  style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                >
                  ใบเสนอราคา
                </li>
                <li 
                  className={`sidebar-menu-item ${activeTab === 'invoice' ? 'active' : ''}`}
                  onClick={() => setActiveTab('invoice')}
                  style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                >
                  ใบแจ้งหนี้
                </li>
                <li 
                  className={`sidebar-menu-item ${activeTab === 'receipt' ? 'active' : ''}`}
                  onClick={() => setActiveTab('receipt')}
                  style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                >
                  ใบเสร็จ
                </li>
              </ul>
            </li>

            {/* Delivery Order (DO) */}
            <li 
              className="sidebar-menu-item"
              onClick={() => alert('ระบบ Delivery Order ยังไม่เปิดให้บริการในเวอร์ชันนี้')}
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

      {/* 3. Footer Help Card & Logout */}
      <div className="sidebar-help-card">
        <div className="sidebar-help-title">Need help?</div>
        <div className="sidebar-help-text">Contact your system admin</div>
      </div>

      <button className="sidebar-logout-btn" onClick={onLogout}>
        <LogOut size={16} />
        <span>Log out</span>
      </button>
    </div>
  );
}

export default Sidebar;