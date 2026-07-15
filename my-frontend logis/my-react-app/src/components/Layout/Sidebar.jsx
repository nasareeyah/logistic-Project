import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FolderOpen, 
  FileText, 
  FileCheck, 
  Receipt, 
  Package, 
  Users, 
  Truck, 
  UserSquare2,
  LogOut 
} from 'lucide-react'; 

function Sidebar({ activeTab, setActiveTab, onLogout, pendingBadge }) {
  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-logo-section">
        <svg viewBox="0 0 280 100" width="130" height="46" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.9))' }}>
          <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
            <line x1="200" y1="20" x2="260" y2="20" />
            <line x1="210" y1="32" x2="255" y2="32" />
            <line x1="195" y1="44" x2="260" y2="44" />
            <line x1="205" y1="56" x2="250" y2="56" />
          </g>
          <path d="M 90,65 L 190,65 L 190,15 L 90,15 Z" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 90,65 L 45,65 L 45,45 L 65,25 L 90,25 Z" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 65,25 L 65,45 L 45,45" fill="none" stroke="#ffffff" strokeWidth="2" />
          <circle cx="70" cy="72" r="10" fill="#111827" stroke="#ffffff" strokeWidth="2" />
          <circle cx="70" cy="72" r="4" fill="#ffffff" />
          <circle cx="160" cy="72" r="10" fill="#111827" stroke="#ffffff" strokeWidth="2" />
          <circle cx="160" cy="72" r="4" fill="#ffffff" />
          <text x="105" y="52" fill="#ef4444" fontSize="38" fontWeight="900" fontStyle="italic" fontFamily="sans-serif">ST</text>
          <text x="60" y="92" fill="#ffffff" fontSize="13" fontWeight="800" letterSpacing="3" fontFamily="sans-serif">TRAN EXPRESS</text>
        </svg>
        <div className="sidebar-logo-title">S.T. TRAN EXPRESS</div>
      </div>

      {/* กลุ่มเมนูหลัก (MAIN) */}
      <div className="sidebar-group">
        <div className="sidebar-group-title">MAIN</div>
        <ul className="sidebar-menu-list">
          
          {/* Dashboard */}
          <li className={`sidebar-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="sidebar-menu-item-icon">
              <LayoutDashboard size={18} />
            </span>
            <span>Dashboard</span>
            <span className="sidebar-menu-item-badge">{pendingBadge}</span>
          </li>

          {/* Booking */}
          <li className="sidebar-menu-item" onClick={() => alert('ระบบ Booking ยังไม่เปิดให้บริการในเวอร์ชันนี้')}>
            <span className="sidebar-menu-item-icon">
              <PlusCircle size={18} />
            </span>
            <span>Booking</span>
          </li>

          {/* Document Center & Sub-menus */}
          <li className="sidebar-menu-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="sidebar-menu-item-icon">
                <FolderOpen size={18} />
              </span>
              <span>Document Center</span>
            </div>
            
            <ul className="sidebar-menu-list" style={{ marginTop: '4px' }}>
              {/* Quotation */}
              <li className={`sidebar-menu-item sidebar-menu-sub-item ${activeTab === 'quotation' ? 'active' : ''}`} onClick={() => setActiveTab('quotation')}>
                <span className="sidebar-menu-item-icon">
                  <FileText size={16} />
                </span>
                <span>Quotation</span>
              </li>
              
              {/* Invoice */}
              <li className={`sidebar-menu-item sidebar-menu-sub-item ${activeTab === 'invoice' ? 'active' : ''}`} onClick={() => setActiveTab('invoice')}>
                <span className="sidebar-menu-item-icon">
                  <FileCheck size={16} />
                </span>
                <span>Invoice</span>
              </li>
              
              {/* Receipt */}
              <li className={`sidebar-menu-item sidebar-menu-sub-item ${activeTab === 'receipt' ? 'active' : ''}`} onClick={() => setActiveTab('receipt')}>
                <span className="sidebar-menu-item-icon">
                  <Receipt size={16} />
                </span>
                <span>Receipt</span>
              </li>
            </ul>
          </li>

          {/* Delivery Order */}
          <li className="sidebar-menu-item" onClick={() => alert('ระบบ Delivery Order ยังไม่เปิดให้บริการในเวอร์ชันนี้')}>
            <span className="sidebar-menu-item-icon">
              <Package size={18} />
            </span>
            <span>Delivery Order</span>
          </li>

        </ul>
      </div>

      {/* กลุ่มเมนูข้อมูลหลัก (MASTER DATA) */}
      <div className="sidebar-group">
        <div className="sidebar-group-title">MASTER DATA</div>
        <ul className="sidebar-menu-list">
          
          {/* Customer Profile */}
          <li className={`sidebar-menu-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
            <span className="sidebar-menu-item-icon">
              <Users size={18} />
            </span>
            <span>Customer Profile</span>
          </li>

          {/* Truck List */}
          <li className={`sidebar-menu-item ${activeTab === 'trucks' ? 'active' : ''}`} onClick={() => setActiveTab('trucks')}>
            <span className="sidebar-menu-item-icon">
              <Truck size={18} />
            </span>
            <span>Truck List</span>
          </li>

          {/* Driver Profile */}
          <li className={`sidebar-menu-item ${activeTab === 'driver' ? 'active' : ''}`} onClick={() => setActiveTab('driver')}>
            <span className="sidebar-menu-item-icon">
              <UserSquare2 size={18} />
            </span>
            <span>Driver Profile</span>
          </li>

        </ul>
      </div>

      {/* ปุ่ม Logout ด้านล่างสุด */}
      <button className="sidebar-logout-btn" onClick={onLogout}>
        <span className="sidebar-logout-icon">
          <LogOut size={18} />
        </span>
        <span>Log out</span>
      </button>
    </div>
  );
}

export default Sidebar;

