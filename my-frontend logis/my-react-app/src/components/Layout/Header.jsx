import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

function Header({ user }) {
  const { lang, setLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const role = user?.role;

  let roleInfo = {
    title: t('roleEmployee', 'Employee'),
    initials: 'EM',
    avatarBg: '#059669',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    borderColor: '#a7f3d0'
  };

  if (role === 'operator' || role === 'operator_accounting') {
    roleInfo = {
      title: t('roleOperator', 'Operator'),
      initials: 'OP',
      avatarBg: '#1e40af',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      borderColor: '#bfdbfe'
    };
  } else if (role === 'accounting') {
    roleInfo = {
      title: t('roleAccounting', 'Accounting'),
      initials: 'AC',
      avatarBg: '#7c3aed',
      badgeBg: '#f5f3ff',
      badgeColor: '#6d28d9',
      borderColor: '#ddd6fe'
    };
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dashboard-header">
      {/* Left section: Original Header Title */}
      <div className="header-brand-title">
        S.T.TRANS EXPRESS MANAGEMENT
      </div>

      {/* User Actions on the Right */}
      <div className="header-actions">
        {/* Language Dropdown */}
        <div className="header-lang-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="header-lang-trigger"
            onClick={() => setIsOpen(prev => !prev)}
            aria-expanded={isOpen}
            title={lang === 'th' ? 'เปลี่ยนภาษา' : 'Change Language'}
          >
            <span className="header-lang-code">{lang.toUpperCase()}</span>
            <ChevronDown size={14} className={`header-lang-chevron ${isOpen ? 'open' : ''}`} />
          </button>

          {isOpen && (
            <div className="header-lang-menu">
              <button
                type="button"
                className={`header-lang-option ${lang === 'th' ? 'active' : ''}`}
                onClick={() => {
                  setLang('th');
                  setIsOpen(false);
                }}
              >
                <span>ไทย (TH)</span>
              </button>
              <button
                type="button"
                className={`header-lang-option ${lang === 'en' ? 'active' : ''}`}
                onClick={() => {
                  setLang('en');
                  setIsOpen(false);
                }}
              >
                <span>ENGLISH (EN)</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar (Far Right) */}
        <div 
          className="header-avatar-circle" 
          title={roleInfo.title}
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
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'default',
            flexShrink: 0
          }}
        >
          <span>{roleInfo.initials}</span>
        </div>
      </div>
    </div>
  );
}

export default Header;