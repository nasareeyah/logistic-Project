import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';

function Header() {
  return (
    <div className="dashboard-header">
      {/* Left section: Header Title */}
      <div className="header-brand-title">
        S.T.TRANS EXPRESS MANAGEMENT
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