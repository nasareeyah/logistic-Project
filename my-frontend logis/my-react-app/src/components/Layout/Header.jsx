import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';

function Header({ user }) {
  const role = user?.role;

  let roleInfo = {
    title: 'Employee',
    initials: 'EM',
    avatarBg: '#059669',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    borderColor: '#a7f3d0'
  };

  if (role === 'operator' || role === 'operator_accounting') {
    roleInfo = {
      title: 'Operator',
      initials: 'OP',
      avatarBg: '#1e40af',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      borderColor: '#bfdbfe'
    };
  } else if (role === 'accounting') {
    roleInfo = {
      title: 'Accounting',
      initials: 'AC',
      avatarBg: '#7c3aed',
      badgeBg: '#f5f3ff',
      badgeColor: '#6d28d9',
      borderColor: '#ddd6fe'
    };
  }

  return (
    <div className="dashboard-header">
      {/* Left section: Header Title */}
      <div className="header-brand-title">
        S.T.TRANS EXPRESS MANAGEMENT
      </div>

      {/* User Actions on the Right */}
      <div className="header-actions">
        <div className="header-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            className="header-avatar-circle" 
            style={{ 
              backgroundColor: roleInfo.avatarBg, 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: '700',
              fontSize: '13px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <span>{roleInfo.initials}</span>
          </div>
          <div className="header-user-info" style={{ display: 'flex', alignItems: 'center' }}>
            <span 
              className="header-user-role" 
              style={{ 
                fontSize: '13px', 
                fontWeight: 700, 
                color: roleInfo.badgeColor,
                backgroundColor: roleInfo.badgeBg,
                border: `1px solid ${roleInfo.borderColor}`,
                padding: '4px 12px',
                borderRadius: '16px',
                display: 'inline-block',
                letterSpacing: '0.3px'
              }}
            >
              {roleInfo.title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;