import { useState } from 'react';
import backgroundImage from '../assets/background.jpg';

function Login({ onLogin, loginError }) {
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
          <p className="login-system-subtitle">Transportation Management System</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-card">
          <h2 className="login-form-title">Login</h2>
          {loginError && <div className="login-alert">⚠️ {loginError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-form-label">Email</label>
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
              <label className="login-form-label">Password</label>
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
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
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
              <a href="#" className="login-forgot-link" onClick={e => { e.preventDefault(); alert("กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน (support@st-tran.com)"); }}>
                Forgot Password?
              </a>
            </div>

            <div className="login-btn-container">
              <button type="submit" className="login-btn-submit">Login</button>
            </div>
          </form>
          <div className="login-hint">การสาธิต: สามารถใช้อีเมลและรหัสผ่านใดก็ได้เพื่อเข้าสู่ระบบ</div>
        </div>
      </div>
    </div>
  );
}

export default Login;