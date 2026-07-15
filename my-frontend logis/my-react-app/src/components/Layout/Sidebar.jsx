import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FolderOpen, 
  FileSpreadsheet, 
  FileCheck, 
  Receipt as ReceiptIcon, 
  FileDown, 
  Users, 
  Truck, 
  UserSquare2,
  LogOut 
} from 'lucide-react'; 

function Sidebar({ activeTab, setActiveTab, onLogout, pendingBadge }) {
  // ตรวจสอบสถานะกลุ่มเอกสารว่ากำลังเปิดอันใดอันหนึ่งอยู่หรือไม่
  const isDocumentCenterActive = ['quotation', 'invoice', 'receipt'].includes(activeTab);

  return (
    <div 
      className="dashboard-sidebar" 
      style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        boxSizing: 'border-box',
        padding: '24px 16px 32px 16px',
        justifyContent: 'space-between'
      }}
    >
      {/* =========================================================
          1. ส่วนหัว (HEADER) & โลโก้บริษัท S.T. TRAN EXPRESS 
         ========================================================= */}
      <div className="sidebar-logo-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', color: '#ffffff' }}>
        <svg viewBox="0 0 280 100" width="130" height="46" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.9))' }}>
          <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none">
            <line x1="200" y1="20" x2="260" y2="20" stroke="#ffffff" />
            <line x1="210" y1="32" x2="255" y2="32" stroke="#ffffff" />
            <line x1="195" y1="44" x2="260" y2="44" stroke="#ffffff" />
            <line x1="205" y1="56" x2="250" y2="56" stroke="#ffffff" />
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
      </div>

      {/* =========================================================
          2. ส่วนเนื้อหาเมนูทั้งหมด (MENU CONTENT) 
         ========================================================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {/* --- กลุ่มเมนูหลัก (MAIN GROUP) --- */}
        <div className="sidebar-group" style={{ background: 'transparent', backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
          <div className="sidebar-group-title" style={{ color: '#ffffff', opacity: 0.8, fontWeight: '700', fontSize: '13px', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '12px' }}>MAIN</div>
          <ul className="sidebar-menu-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }}>
            
            {/* เมนู Dashboard */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
              onClick={() => setActiveTab('dashboard')} 
              style={{ 
                padding: '10px 12px',
                color: activeTab === 'dashboard' ? '#1e293b' : '#ffffff', // เมนูหลักที่ Active จะใช้ตัวหนังสือสีเข้มเพื่อตัดกับพื้นหลังขาวของ Active เดิม
                borderRadius: '8px'
              }}
            >
              <span className="sidebar-menu-item-icon" style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <LayoutDashboard size={18} color={activeTab === 'dashboard' ? 'currentColor' : '#ffffff'} />
              </span>
              <span>Dashboard</span>
              {pendingBadge > 0 && <span className="sidebar-menu-item-badge">{pendingBadge}</span>}
            </li>

            {/* เมนู Booking */}
            <li 
              className="sidebar-menu-item" 
              onClick={() => alert('ระบบ Booking ยังไม่เปิดให้บริการในเวอร์ชันนี้')} 
              style={{ padding: '10px 12px', color: '#ffffff', borderRadius: '8px' }}
            >
              <span className="sidebar-menu-item-icon" style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <PlusCircle size={18} color="#ffffff" />
              </span>
              <span>Booking</span>
            </li>

            {/* หัวข้อ Document Center (ไม่มีการเปลี่ยนพื้นหลังสีขาวตอนแอกทีฟ) */}
            <li 
              style={{ 
                display: 'flex',
                flexDirection: 'column', 
                alignItems: 'stretch', 
                gap: '4px', 
                padding: '10px 12px', 
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', color: '#ffffff' }}>
                <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                  <FolderOpen size={18} color="#ffffff" />
                </span>
                <span style={{ color: '#ffffff', fontWeight: isDocumentCenterActive ? '700' : 'normal' }}>Document Center</span>
              </div>
              
              {/* รายการเอกสารย่อยด้านใน (SUB-MENUS) */}
              <ul style={{ marginTop: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none' }}>
                
                {/* ใบเสนอราคา */}
                <li 
                  onClick={(e) => { e.stopPropagation(); setActiveTab('quotation'); }} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    // แก้ไข: ถ้า Active ให้ใส่พื้นหลังสีขาวโปร่งแสงบางเบา (0.15) เพื่อไม่ให้ทับฟอนต์ หรือถ้าอยากให้เป็นตัวหนังสือหนาขึ้นแทน
                    background: activeTab === 'quotation' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: '#ffffff',
                    fontWeight: activeTab === 'quotation' ? '700' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                    <FileSpreadsheet size={16} color="#ffffff" />
                  </span>
                  <span>ใบเสนอราคา</span>
                </li>

                {/* ใบแจ้งหนี้ */}
                <li 
                  onClick={(e) => { e.stopPropagation(); setActiveTab('invoice'); }} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeTab === 'invoice' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: '#ffffff',
                    fontWeight: activeTab === 'invoice' ? '700' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                    <FileCheck size={16} color="#ffffff" />
                  </span>
                  <span>ใบแจ้งหนี้</span>
                </li>

                {/* ใบเสร็จ */}
                <li 
                  onClick={(e) => { e.stopPropagation(); setActiveTab('receipt'); }} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeTab === 'receipt' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: '#ffffff',
                    fontWeight: activeTab === 'receipt' ? '700' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                    <ReceiptIcon size={16} color="#ffffff" />
                  </span>
                  <span>ใบเสร็จ</span>
                </li>

              </ul>
            </li>

            {/* เมนู ใบ DO */}
            <li 
              className="sidebar-menu-item" 
              onClick={() => alert('ระบบ Delivery Order ยังไม่เปิดให้บริการในเวอร์ชันนี้')} 
              style={{ padding: '10px 12px', color: '#ffffff', borderRadius: '8px' }}
            >
              <span className="sidebar-menu-item-icon" style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <FileDown size={18} color="#ffffff" />
              </span>
              <span>ใบ DO</span>
            </li>

          </ul>
        </div>

        {/* --- กลุ่มข้อมูลหลัก (MASTER DATA GROUP) --- */}
        <div className="sidebar-group" style={{ background: 'transparent', backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
          <div className="sidebar-group-title" style={{ color: '#ffffff', opacity: 0.8, fontWeight: '700', fontSize: '13px', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '12px' }}>MASTER DATA</div>
          <ul className="sidebar-menu-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }}>
            
            {/* เมนู Customer */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'customers' ? 'active' : ''}`} 
              onClick={() => setActiveTab('customers')} 
              style={{ 
                padding: '10px 12px',
                color: activeTab === 'customers' ? '#1e293b' : '#ffffff',
                borderRadius: '8px'
              }}
            >
              <span className="sidebar-menu-item-icon" style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <Users size={18} color={activeTab === 'customers' ? 'currentColor' : '#ffffff'} />
              </span>
              <span>Customer</span>
            </li>

            {/* เมนู Trucks */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'trucks' ? 'active' : ''}`} 
              onClick={() => setActiveTab('trucks')} 
              style={{ 
                padding: '10px 12px',
                color: activeTab === 'trucks' ? '#1e293b' : '#ffffff',
                borderRadius: '8px'
              }}
            >
              <span className="sidebar-menu-item-icon" style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <Truck size={18} color={activeTab === 'trucks' ? 'currentColor' : '#ffffff'} />
              </span>
              <span>Trucks</span>
            </li>

            {/* เมนู Driver */}
            <li 
              className={`sidebar-menu-item ${activeTab === 'driver' ? 'active' : ''}`} 
              onClick={() => setActiveTab('driver')} 
              style={{ 
                padding: '10px 12px',
                color: activeTab === 'driver' ? '#1e293b' : '#ffffff',
                borderRadius: '8px'
              }}
            >
              <span className="sidebar-menu-item-icon" style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                <UserSquare2 size={18} color={activeTab === 'driver' ? 'currentColor' : '#ffffff'} />
              </span>
              <span>Driver</span>
            </li>

          </ul>
        </div>

      </div>

      {/* =========================================================
          3. ส่วนท้าย (FOOTER) & ปุ่ม LOG OUT ดีไซน์กรอบขาวโค้งมน
         ========================================================= */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <button 
          className="sidebar-logout-btn" 
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: '#ffffff',
            color: '#1e293b',
            border: 'none',
            borderRadius: '16px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            width: '150px'
          }}
        >
          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
            <LogOut size={18} />
          </span>
          <span>Log out</span>
        </button>
      </div>

    </div>
  );
}

export default Sidebar;