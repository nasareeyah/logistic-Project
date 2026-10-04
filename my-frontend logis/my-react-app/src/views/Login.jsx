import { useState } from 'react';
import backgroundImage from '../assets/background.jpg';
import logoWhite from '../assets/logo-white.png';
import { useLanguage } from '../context/LanguageContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Truck,
  Briefcase,
  User,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

function Login({ onLogin, loginError }) {
  const { lang, setLang, tText } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeRole, setActiveRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    onLogin(email, password);
    setTimeout(() => setIsSubmitting(false), 500);
  };

  const handleSelectRole = (roleKey) => {
    setActiveRole(roleKey);
    if (roleKey === 'operator') {
      setEmail('operator@st-tran.com');
      setPassword('St@2026!');
    } else if (roleKey === 'accounting') {
      setEmail('account@st-tran.com');
      setPassword('St@2026!');
    } else if (roleKey === 'employee') {
      setEmail('employee@st-tran.com');
      setPassword('St@2026!');
    }
  };

  return (
    <div className="login-container">
      {/* --------------------------------------------------------------- */}
      {/* LEFT PANEL: Clean, Balanced, Left-Aligned Brand Showcase */}
      {/* --------------------------------------------------------------- */}
      <div className="login-hero-panel" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="login-hero-overlay" />

        <div className="login-hero-content">
          {/* Top Logo */}
          <div className="login-hero-top">
            <img
              src={logoWhite}
              alt="S.T. TRANS EXPRESS"
              className="login-brand-logo-img"
            />
          </div>

          {/* Middle Content */}
          <div className="login-hero-middle">
            <div className="login-brand-badge">
              <Sparkles size={13} />
              <span>{tText('ระบบบริหารจัดการงานขนส่งอัจฉริยะ', 'Intelligent Logistics Platform')}</span>
            </div>

            <h1 className="login-brand-title">
              S.T. TRANS EXPRESS
              <br />
              <span>MANAGEMENT SYSTEM</span>
            </h1>

            <p className="login-brand-tagline">
              {tText(
                'ระบบบริหารจัดการงานขนส่ง โลจิสติกส์ และศูนย์รวมเอกสารการเงินครบวงจร ออกแบบเพื่อความรวดเร็ว แม่นยำ และความปลอดภัยระดับองค์กร',
                'Comprehensive enterprise logistics, fleet dispatching, and automated financial document workflows.'
              )}
            </p>

            {/* Clean Value Props Checklist */}
            <div className="login-value-props">
              <div className="login-value-prop-item">
                <CheckCircle2 size={16} className="login-prop-icon" />
                <span>{tText('วางแผนเที่ยววิ่ง จัดสรรรถ และติดตามสถานะขนส่งเรียลไทม์', 'Real-time booking dispatch & fleet tracking')}</span>
              </div>
              <div className="login-value-prop-item">
                <CheckCircle2 size={16} className="login-prop-icon" />
                <span>{tText('ศูนย์รวมเอกสาร Quotation, DO, Invoice, Receipt อัตโนมัติ', 'Automated Quotation, DO, Invoice & Receipt workflows')}</span>
              </div>
              <div className="login-value-prop-item">
                <CheckCircle2 size={16} className="login-prop-icon" />
                <span>{tText('ควบคุมความปลอดภัยแยกสิทธิ์ฝ่ายปฏิบัติการและการเงิน', 'Enterprise role-based security & audit trail')}</span>
              </div>
            </div>
          </div>

          {/* Bottom Footnote */}
          <div className="login-hero-bottom">
            <span>S.T. TRANS EXPRESS CO., LTD. • SECURE ENTERPRISE PORTAL</span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* RIGHT PANEL: Clean White Canvas Matching System Interior */}
      {/* --------------------------------------------------------------- */}
      <div className="login-auth-panel">
        <div className="login-auth-card">
          {/* Topbar: Status & Language Switcher */}
          <div className="login-auth-topbar">
            <div className="login-status-pill">
              <span className="login-status-dot" />
              <span>{tText('ระบบออนไลน์พร้อมใช้งาน', 'System Online • Secure SSL')}</span>
            </div>

            <button
              type="button"
              onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
              className="login-lang-btn"
              title={tText('สลับภาษา TH / EN', 'Toggle Language')}
            >
              <Globe size={14} />
              <span>{lang === 'th' ? 'TH' : 'EN'}</span>
            </button>
          </div>

          {/* Header */}
          <div className="login-header-group">
            <h2 className="login-header-title">{tText('เข้าสู่ระบบ', 'Sign In')}</h2>
            <p className="login-header-subtitle">
              {tText(
                'ยินดีต้อนรับสู่ระบบบริหารจัดการขนส่ง S.T. Trans Express',
                'Welcome back to S.T. Trans Express Management System'
              )}
            </p>
          </div>

          {/* Quick Demo Role Selector (Clean Compact Pills) */}
          <div className="login-demo-section">
            <span className="login-demo-title">
              {tText('ทดสอบเข้าใช้งาน (Quick Demo):', 'Quick Demo Access:')}
            </span>
            <div className="login-demo-pills">
              <button
                type="button"
                className={`login-demo-pill ${activeRole === 'operator' ? 'active' : ''}`}
                onClick={() => handleSelectRole('operator')}
              >
                <Truck size={14} />
                <span>Operator</span>
              </button>

              <button
                type="button"
                className={`login-demo-pill ${activeRole === 'accounting' ? 'active' : ''}`}
                onClick={() => handleSelectRole('accounting')}
              >
                <Briefcase size={14} />
                <span>Accounting</span>
              </button>

              <button
                type="button"
                className={`login-demo-pill ${activeRole === 'employee' ? 'active' : ''}`}
                onClick={() => handleSelectRole('employee')}
              >
                <User size={14} />
                <span>Employee</span>
              </button>
            </div>
          </div>

          {/* Login Error Notification */}
          {loginError && (
            <div className="login-alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="login-form-group">
              <label className="login-form-label">
                {tText('อีเมลผู้ใช้งาน', 'Email Address')}
              </label>
              <div className="login-input-wrapper">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="email"
                  placeholder="operator@st-tran.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setActiveRole(null);
                  }}
                  className="login-field-input"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-form-group">
              <label className="login-form-label">
                {tText('รหัสผ่าน', 'Password')}
              </label>
              <div className="login-input-wrapper">
                <Lock size={16} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActiveRole(null);
                  }}
                  className="login-field-input"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  title={showPassword ? tText('ซ่อนรหัสผ่าน', 'Hide password') : tText('แสดงรหัสผ่าน', 'Show password')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="login-options-row">
              <label className="login-remember-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-remember-checkbox"
                />
                <span>{tText('จดจำการเข้าสู่ระบบ', 'Remember me')}</span>
              </label>

              <a
                href="#"
                className="login-forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert(
                    tText(
                      'กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน (support@st-tran.com)',
                      'Please contact system administrator to reset password (support@st-tran.com)'
                    )
                  );
                }}
              >
                {tText('ลืมรหัสผ่าน?', 'Forgot password?')}
              </a>
            </div>

            {/* Submit Button */}
            <div className="login-btn-container">
              <button
                type="submit"
                className="login-btn-submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? tText('กำลังเข้าสู่ระบบ...', 'Signing in...') : tText('เข้าสู่ระบบ', 'Sign In')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="login-card-footer">
            S.T. TRANS EXPRESS LOGISTICS • SYSTEM v2.4
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;