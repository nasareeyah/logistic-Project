import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// Flag SVG Components
function ThaiFlag({ className = 'header-lang-flag-img' }) {
  return (
    <svg className={className} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="900" height="600" fill="#ED1C24" />
      <rect y="100" width="900" height="400" fill="#ffffff" />
      <rect y="200" width="900" height="200" fill="#241D4F" />
    </svg>
  );
}

function UKFlag({ className = 'header-lang-flag-img' }) {
  return (
    <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="uk-flag-clip-header">
        <path d="M0,0 v30 h60 v-30 z"/>
      </clipPath>
      <g clipPath="url(#uk-flag-clip-header)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
      </g>
    </svg>
  );
}

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
        {/* Language Dropdown (Matching Screenshot Style) */}
        <div className="header-lang-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="header-lang-trigger"
            onClick={() => setIsOpen(prev => !prev)}
            aria-expanded={isOpen}
            title={lang === 'th' ? 'เปลี่ยนภาษา' : 'Change Language'}
          >
            {lang === 'th' ? <ThaiFlag /> : <UKFlag />}
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
                <ThaiFlag />
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
                <UKFlag />
                <span>ENGLISH (EN)</span>
              </button>
            </div>
          )}
        </div>

        {/* Original User Profile */}
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