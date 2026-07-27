import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

function Header() {
  return (
    <div className="dashboard-header">
      {/* Search Input on the Left */}
      <div className="header-search-container">
        <Search className="header-search-icon" size={18} />
        <input 
          type="text" 
          placeholder="Search bookings, customers, documents..." 
          className="header-search-input"
        />
      </div>

      {/* User Actions on the Right */}
      <div className="header-actions">
        <div className="header-notification">
          <Bell size={20} className="header-icon-bell" />
          <span className="header-notification-badge"></span>
        </div>
        
        <div className="header-user-profile">
          <div className="header-avatar-circle">
            <span>NS</span>
          </div>
          <div className="header-user-info">
            <span className="header-user-name">Nasreeyah Sadeen</span>
            <span className="header-user-role">Admin</span>
          </div>
          <ChevronDown size={16} className="header-profile-chevron" />
        </div>
      </div>
    </div>
  );
}

export default Header;