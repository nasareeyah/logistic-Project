import { useState } from 'react';
import backgroundImage from '../assets/background.jpg';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

function Login({ onLogin, loginError }) {
  const { lang, setLang, tText } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="login-container">
      <div className="login-left" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="login-left-content">
          <div className="login-logo-container">
            <svg viewBox="0 0 280 100" width="220" height="80" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round">
                <line x1="200" y1="20" x2="260" y2="20" />
                <line x1="210" y1="32" x2="255" y2="32" />
                <line x1="195" y1="44" x2="260" y2="44" />
                <line x1="205" y1="56" x2="250" y2="56" />
              </g>
              <path d="M 90,65 L 190,65 L 190,15 L 90,15 Z" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeLinejoin="round" />
              <path d="M 90,65 L 45,65 L 45,45 L 65,25 L 90,25 Z" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeLinejoin="round" />
              <path d="M 65,25 L 65,45 L 45,45" fill="none" stroke="#1e3a8a" strokeWidth="2" />
              <circle cx="70" cy="72" r="10" fill="#111827" stroke="#1e3a8a" strokeWidth="2" />
              <circle cx="70" cy="72" r="4" fill="#ffffff" />
              <circle cx="160" cy="72" r="10" fill="#111827" stroke="#1e3a8a" strokeWidth="2" />
              <circle cx="160" cy="72" r="4" fill="#ffffff" />
              <text x="105" y="52" fill="#ef4444" fontSize="38" fontWeight="900" fontStyle="italic" fontFamily="'Montserrat', 'Arial Black', sans-serif" letterSpacing="-1">ST</text>
              <text x="60" y="92" fill="#1e3a8a" fontSize="13" fontWeight="800" letterSpacing="3" fontFamily="sans-serif">TRAN EXPRESS</text>
            </svg>
          </div>
          <h1 className="login-system-title">S.T. TRAN EXPRESS</h1>
          <p className="login-system-subtitle">
            {tText('ระบบบริหารจัดการการขนส่งและโลจิสติกส์', 'Transportation Management System')}
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-card" style={{ position: 'relative' }}>
          {/* Language Switcher in Login Card */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={15} color="#64748b" />
            <button
              type="button"
              onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0284c7',
                cursor: 'pointer'
              }}
              title={tText('เปลี่ยนภาษา', 'Toggle Language')}
            >
              <span>{lang === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}</span>
            </button>
          </div>

          <h2 className="login-form-title">{tText('เข้าสู่ระบบ', 'Login')}</h2>
          {loginError && <div className="login-alert">⚠️ {loginError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-form-label">{tText('อีเมลผู้ใช้งาน', 'Email')}</label>
              <div className="login-input-wrapper">
                <input
                  type="email"
                  placeholder="example@st-tran.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="login-field-input"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-form-label">{tText('รหัสผ่าน', 'Password')}</label>
              <div className="login-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="login-field-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  title={showPassword ? tText('ซ่อนรหัสผ่าน', 'Hide password') : tText('แสดงรหัสผ่าน', 'Show password')}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10c4 4 14 4 18 0" />
                      <path d="M6 12l-1.5 2.5" />
                      <path d="M10 13v3" />
                      <path d="M14 13v3" />
                      <path d="M18 12l1.5 2.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="login-forgot-container">
              <a href="#" className="login-forgot-link" onClick={e => { e.preventDefault(); alert(tText('กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน (support@st-tran.com)', 'Please contact system administrator to reset password (support@st-tran.com)')); }}>
                {tText('ลืมรหัสผ่าน?', 'Forgot Password?')}
              </a>
            </div>

            <div className="login-btn-container">
              <button type="submit" className="login-btn-submit">{tText('เข้าสู่ระบบ', 'Login')}</button>
            </div>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600, textAlign: 'center' }}>
              {tText('ทดสอบเข้าสู่ระบบตามบทบาท (Quick Demo):', 'Quick Demo Roles Login:')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setEmail('operator@st-tran.com');
                  setPassword('1234');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🚛 {tText('1. Operator (โลโก้ OP | สิทธิ์เข้าถึงเอกสารการเงิน)', '1. Operator (OP | Financial & Operations Access)')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('account@st-tran.com');
                  setPassword('1234');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #8b5cf6',
                  backgroundColor: '#f5f3ff',
                  color: '#6d28d9',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                💼 {tText('2. Accounting (โลโก้ AC | ฝ่ายบัญชี + เอกสารการเงิน)', '2. Accounting (AC | Accounting & Finance Docs)')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('employee@st-tran.com');
                  setPassword('1234');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #10b981',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                👤 {tText('3. Employee (โลโก้ EM | พนักงานทั่วไป - ซ่อนเอกสารการเงิน)', '3. Employee (EM | Operations - Hides Finance Docs)')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;