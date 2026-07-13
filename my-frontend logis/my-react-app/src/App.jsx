import { useState, useEffect } from 'react';
import backgroundImage from './assets/background.jpg';
import GenericTable from './GenericTable';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('customers');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    setLoginError('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    setEmail('');
    setPassword('');
  };

  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // โครงสร้างอินพุตสำหรับเพิ่มข้อมูลใหม่ใต้ตาราง
  const [newCustomer, setNewCustomer] = useState({
    customer_name: '',
    tax_id: '',
    address: '',
    phone: '',
    email: '',
    contact_person: ''
  });
  const [newCar, setNewCar] = useState({ car_number: '', car_type: '' });
  const [newDriver, setNewDriver] = useState({ full_name: '', phone: '' });

  // สถานะสำหรับการกดแก้ไขแถวเดิมแบบ Inline
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editCustomerData, setEditCustomerData] = useState({});
  const [editingCarId, setEditingCarId] = useState(null);
  const [editCarData, setEditCarData] = useState({});
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [editDriverData, setEditDriverData] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    setError(null);
    Promise.all([
      fetch('http://localhost:3000/api/customers').then(r => r.json()),
      fetch('http://localhost:3000/api/cars').then(r => r.json()), // ใส่ url เต็ม และคง s ไว้ตามฐานข้อมูล
      fetch('http://localhost:3000/api/driver').then(r => r.json())
    ])
      .then(([c, carsData, d]) => {
        setCustomers(c);
        setCars(carsData);
        setDrivers(d);
        setLoading(false);
      })
      .catch(err => {
        setError('ไม่สามารถโหลดข้อมูลได้: ' + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  // ฟังก์ชันบันทึกข้อมูลเข้าฐานข้อมูล (INSERT)
  const handleAddCustomer = () => {

    if (!newCustomer.customer_name) {
      alert('กรุณากรอกชื่อลูกค้า');
      return;
    }
    const autoCustomerId = 'c-' + Math.floor(1000000 + Math.random() * 9000000);

    const customerDataToSend = {
      ...newCustomer,
      customer_id: autoCustomerId
    };

    fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerDataToSend)
    })
      .then(res => res.json())
      .then(data => {

        if (data.error) {
          alert('บันทึกไม่สำเร็จ: ' + data.error);
        } else {
          alert(data.message);
          setNewCustomer({
            customer_name: '',
            tax_id: '',
            address: '',
            phone: '',
            email: '',
            contact_person: ''
          });
          fetchData();
        }
      })
      .catch(err => alert('เกิดข้อผิดพลาด: ' + err.message));
  };

  const handleAddCar = () => {
    // 1. สุ่มรหัสรถสั้น ๆ (เช่น car-84930) ส่งไปเป็น Primary Key
    const autoCarId = 'car-' + Math.floor(10000 + Math.random() * 90000);

    // 2. มัดรวมข้อมูลจากสเตท newCar ทั้งหมด พร้อมแนบ car_id
    const carDataToSend = {
      ...newCar,
      car_id: autoCarId
    };

    // 3. ยิงข้อมูลไปที่หลังบ้านพอร์ต 3000 เส้นทาง /api/car
    fetch('http://localhost:3000/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carDataToSend)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('บันทึกไม่สำเร็จ: ' + data.error);
        } else {
          alert(data.message); // จะขึ้นเตือน "✅ เพิ่มข้อมูลสำเร็จ!"

          // ล้างช่องกรอกข้อมูลในสเตทให้กลับเป็นค่าว่าง
          if (typeof setNewCar === 'function') {
            setNewCar(Object.keys(newCar).reduce((acc, key) => ({ ...acc, [key]: '' }), {}));
          }

          fetchData(); // รีโหลดตารางเพื่อดึงข้อมูลรถคันใหม่มาโชว์
        }
      })
      .catch(err => alert('เกิดข้อผิดพลาด: ' + err.message));
  };
  const handleAddDriver = () => {
    /// 1. เปลี่ยนจาก 'driver-' เป็น 'd-' เพื่อประหยัดพื้นที่ตัวอักษร (รวม 8 ตัวอักษร ไม่เกิน 10 แน่นอน)
const autoDriverId = 'd-' + Math.floor(100000 + Math.random() * 900000);

    // 2. มัดรวมข้อมูลจากสเตท newDriver ทั้งหมด พร้อมแนบ driver_id
    const driverDataToSend = {
      ...newDriver,
      driver_id: autoDriverId
    };

    // 3. ยิงข้อมูลไปที่หลังบ้านพอร์ต 3000 เส้นทาง /api/driver (ไม่มี s ตาม ALLOWED หลังบ้าน)
    fetch('http://localhost:3000/api/driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverDataToSend)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('บันทึกไม่สำเร็จ: ' + data.error);
        } else {
          alert(data.message); // จะขึ้นเตือน "✅ เพิ่มข้อมูลสำเร็จ!" ลบคำว่า undefined ออกไป

          // ล้างช่องกรอกข้อมูลพนักงานขับรถในสเตทให้กลับเป็นค่าว่าง
          if (typeof setNewDriver === 'function') {
            setNewDriver(Object.keys(newDriver).reduce((acc, key) => ({ ...acc, [key]: '' }), {}));
          }

          fetchData(); // รีโหลดตารางเพื่อดึงข้อมูลพนักงานขับรถคนใหม่มาโชว์
        }
      })
      .catch(err => alert('เกิดข้อผิดพลาด: ' + err.message));
  };

  // ฟังก์ชันแก้ไขข้อมูลแถวเดิม (UPDATE)
  const handleSaveCustomerEdit = (id) => {
    fetch(`/api/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCustomerData) }).then(() => { setEditingCustomerId(null); fetchData(); });
  };

  const handleSaveCarEdit = (id) => {
    fetch(`/api/cars/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCarData) }).then(() => { setEditingCarId(null); fetchData(); });
  };

  const handleSaveDriverEdit = (id) => {
    fetch(`/api/driver/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDriverData) }).then(() => { setEditingDriverId(null); fetchData(); });
  };

  const handleDeleteCustomer = (id) => {
    if (!confirm('ยืนยันการลบลูกค้านี้?')) return;
    fetch(`/api/customers/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  const handleDeleteCar = (id) => {
    if (!confirm('ยืนยันการลบรถคันนี้?')) return;
    fetch(`/api/cars/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  const handleDeleteDriver = (id) => {
    if (!confirm('ยืนยันการลบคนขับคนนี้?')) return;
    fetch(`/api/driver/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  // If not logged in, render the login page first
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        {/* Left Side */}
        <div className="login-left" style={{ backgroundImage: `url(${backgroundImage})` }}>
          <div className="login-left-content">
            <div className="login-logo-container">
              <svg viewBox="0 0 280 100" width="220" height="80" xmlns="http://www.w3.org/2000/svg">
                {/* Trailing speed lines */}
                <g stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round">
                  <line x1="200" y1="20" x2="260" y2="20" />
                  <line x1="210" y1="32" x2="255" y2="32" />
                  <line x1="195" y1="44" x2="260" y2="44" />
                  <line x1="205" y1="56" x2="250" y2="56" />
                </g>
                {/* Truck body / outline */}
                <path d="M 90,65 L 190,65 L 190,15 L 90,15 Z" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeLinejoin="round" />
                {/* Truck cabin */}
                <path d="M 90,65 L 45,65 L 45,45 L 65,25 L 90,25 Z" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeLinejoin="round" />
                {/* Windshield line */}
                <path d="M 65,25 L 65,45 L 45,45" fill="none" stroke="#1e3a8a" strokeWidth="2" />
                {/* Wheels */}
                <circle cx="70" cy="72" r="10" fill="#111827" stroke="#1e3a8a" strokeWidth="2" />
                <circle cx="70" cy="72" r="4" fill="#ffffff" />
                <circle cx="160" cy="72" r="10" fill="#111827" stroke="#1e3a8a" strokeWidth="2" />
                <circle cx="160" cy="72" r="4" fill="#ffffff" />
                {/* ST Text inside cargo block */}
                <text x="105" y="52" fill="#ef4444" fontSize="38" fontWeight="900" fontStyle="italic" fontFamily="'Montserrat', 'Arial Black', sans-serif" letterSpacing="-1">ST</text>
                {/* TRAN EXPRESS text below */}
                <text x="60" y="92" fill="#1e3a8a" fontSize="13" fontWeight="800" letterSpacing="3" fontFamily="sans-serif">TRAN EXPRESS</text>
              </svg>
            </div>
            <h1 className="login-system-title">S.T. TRAN EXPRESS</h1>
            <p className="login-system-subtitle">Transportation Management System</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="login-right">
          <div className="login-form-card">
            <h2 className="login-form-title">Login</h2>

            {loginError && <div className="login-alert">⚠️ {loginError}</div>}

            <form onSubmit={handleLogin}>
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
                      /* Eye icon open */
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      /* Closed eye curve with eyelashes (mockup style) */
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
                <a
                  href="#"
                  className="login-forgot-link"
                  onClick={e => {
                    e.preventDefault();
                    alert("กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน (support@st-tran.com)");
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              <div className="login-btn-container">
                <button type="submit" className="login-btn-submit">
                  Login
                </button>
              </div>
            </form>

            <div className="login-hint">
              การสาธิต: สามารถใช้อีเมลและรหัสผ่านใดก็ได้เพื่อเข้าสู่ระบบ
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: '30px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: '20px' }}>⏳ กำลังโหลดข้อมูล...</div>;
  if (error) return <div style={{ padding: '30px', textAlign: 'center', fontFamily: 'sans-serif', color: 'red', fontSize: '18px' }}>{error}</div>;

  // Render overview layout panel for tab 'dashboard'
  const renderOverview = () => (
    <div>
      <h2 className="dashboard-view-title">Dashboard</h2>
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card" style={{ padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#1e293b' }}>
          <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customers</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px', color: '#0c2356' }}>{customers.length}</span>
        </div>
        <div className="dashboard-stat-card" style={{ padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#1e293b' }}>
          <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Trucks</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px', color: '#0c2356' }}>{cars.length}</span>
        </div>
        <div className="dashboard-stat-card" style={{ padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#1e293b' }}>
          <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Drivers</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px', color: '#0c2356' }}>{drivers.length}</span>
        </div>
        <div className="dashboard-stat-card" style={{ padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#1e293b' }}>
          <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Bookings</span>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '5px', color: '#0c2356' }}>5</span>
        </div>
      </div>
      <div className="dashboard-panels-grid">
        <div className="dashboard-panel-main" style={{ padding: '24px', boxSizing: 'border-box', color: '#1e293b' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', fontWeight: '700' }}>Recent Logistics Activities</h3>
          <div style={{ borderTop: '2px solid rgba(0,0,0,0.05)', paddingTop: '15px' }}>
            <p style={{ margin: '12px 0', fontSize: '0.95rem', color: '#475569', textAlign: 'left' }}>🚚 <strong>Vehicle dispatched:</strong> 72-2955 was assigned to route A.</p>
            <p style={{ margin: '12px 0', fontSize: '0.95rem', color: '#475569', textAlign: 'left' }}>👤 <strong>New profile registered:</strong> Customer SCG Group updated phone records.</p>
            <p style={{ margin: '12px 0', fontSize: '0.95rem', color: '#475569', textAlign: 'left' }}>👮 <strong>Driver status:</strong> สมชาย ดีใจ completed vehicle checklist.</p>
          </div>
        </div>
        <div className="dashboard-panel-side" style={{ padding: '24px', boxSizing: 'border-box', color: '#1e293b' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', fontWeight: '700' }}>Status Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span>On Route</span>
              <strong>70%</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '70%', background: '#1890ff', height: '100%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '10px' }}>
              <span>Available</span>
              <strong>30%</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '30%', background: '#52c41a', height: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-panel-bottom" style={{ padding: '24px', boxSizing: 'border-box', color: '#1e293b', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '700' }}>System Information</h3>
        <p style={{ margin: '5px 0', fontSize: '0.95rem', color: '#475569' }}>All systems operational. Connected to MariaDB database: <strong>Back-logistic</strong>.</p>
        <p style={{ margin: '5px 0', fontSize: '0.95rem', color: '#475569' }}>API Server running at <strong>http://localhost:3000</strong></p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout-container">
      {/* Left Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-logo-section">
          {/* Logo SVG */}
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

        {/* Group: MAIN */}
        <div className="sidebar-group">
          <div className="sidebar-group-title">MAIN</div>
          <ul className="sidebar-menu-list">
            <li className={`sidebar-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <span className="sidebar-menu-item-icon">📊</span>
              <span>Dashboard</span>
              <span className="sidebar-menu-item-badge">5</span>
            </li>
            <li className="sidebar-menu-item" onClick={() => alert('ระบบ Booking ยังไม่เปิดให้บริการในเวอร์ชันนี้')}>
              <span className="sidebar-menu-item-icon">➕</span>
              <span>Booking</span>
            </li>
            <li className="sidebar-menu-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="sidebar-menu-item-icon">📄</span>
                <span>Document Center</span>
              </div>
              <ul className="sidebar-menu-list" style={{ marginTop: '4px' }}>
                <li className={`sidebar-menu-item sidebar-menu-sub-item ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}>
                  <span className="sidebar-menu-item-icon">📄</span>
                  <span>Quotation</span>
                </li>
                <li className={`sidebar-menu-item sidebar-menu-sub-item ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}>
                  <span className="sidebar-menu-item-icon">📄</span>
                  <span>Invoice</span>
                </li>
                <li className={`sidebar-menu-item sidebar-menu-sub-item ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}>
                  <span className="sidebar-menu-item-icon">📄</span>
                  <span>Receipt</span>
                </li>
              </ul>
            </li>
            <li className="sidebar-menu-item" onClick={() => alert('ระบบ Delivery Order ยังไม่เปิดให้บริการในเวอร์ชันนี้')}>
              <span className="sidebar-menu-item-icon">📦</span>
              <span>Delivery Order</span>
            </li>
          </ul>
        </div>

        {/* Group: MASTER DATA */}
        <div className="sidebar-group">
          <div className="sidebar-group-title">MASTER DATA</div>
          <ul className="sidebar-menu-list">
            <li className={`sidebar-menu-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
              <span className="sidebar-menu-item-icon">👤</span>
              <span>Customer Profile</span>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'trucks' ? 'active' : ''}`} onClick={() => setActiveTab('trucks')}>
              <span className="sidebar-menu-item-icon">🚚</span>
              <span>Truck List</span>
            </li>
            <li className={`sidebar-menu-item ${activeTab === 'driver' ? 'active' : ''}`} onClick={() => setActiveTab('driver')}>
              <span className="sidebar-menu-item-icon">👮</span>
              <span>Driver Profile</span>
            </li>
          </ul>
        </div>

        {/* Logout Button */}
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <span className="sidebar-logout-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span>Log out</span>
        </button>
      </div>

      {/* Main content right wrapper */}
      <div className="dashboard-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-profile-avatar"></div>
        </div>

        {/* Dynamic content rendering */}
        <div className="dashboard-content-area">
          {activeTab === 'dashboard' && renderOverview()}
          {/*ส่วนกรอก ลบ เเก้ไข ข้อมูลลูกค้า*/}
          {activeTab === 'customers' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b' }}> ตารางข้อมูลลูกค้า (Customers)</h2>
              <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#f0f0f0', textAlign: 'center' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa', color: '#555' }}>
                    <th>ชื่อลูกค้า</th>
                    <th>เลขผู้เสียภาษี</th>
                    <th>ที่อยู่</th>
                    <th>เบอร์โทร</th>
                    <th>อีเมล</th>
                    <th>ชื่อผู้ติดต่อ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>

                  {Array.isArray(customers) && customers.map(c => (
                    <tr key={c.customer_id}>
                      <td>
                        {editingCustomerId === c.customer_id ? (
                          <input type="text" value={editCustomerData.customer_name} onChange={e => setEditCustomerData({ ...editCustomerData, customer_name: e.target.value })} />
                        ) : (
                          c.customer_name
                        )}
                      </td>
                      <td>
                        {editingCustomerId === c.customer_id ? (
                          <input type="text" value={editCustomerData.tax_id || ''} onChange={e => setEditCustomerData({ ...editCustomerData, tax_id: e.target.value })} />
                        ) : (
                          c.tax_id || '-'
                        )}
                      </td>

                      <td>
                        {editingCustomerId === c.customer_id ? (
                          <input type="text" value={editCustomerData.address || ''} onChange={e => setEditCustomerData({ ...editCustomerData, address: e.target.value })} />
                        ) : (
                          c.address || '-'
                        )}
                      </td>

                      <td>
                        {editingCustomerId === c.customer_id ? (
                          <input type="text" value={editCustomerData.phone} onChange={e => setEditCustomerData({ ...editCustomerData, phone: e.target.value })} />
                        ) : (
                          c.phone
                        )}
                      </td>

                      <td>
                        {editingCustomerId === c.customer_id ? (
                          <input type="text" value={editCustomerData.email} onChange={e => setEditCustomerData({ ...editCustomerData, email: e.target.value })} />
                        ) : (
                          c.email
                        )}
                      </td>

                      <td>
                        {editingCustomerId === c.customer_id ? (
                          <input type="text" value={editCustomerData.contact_person || ''} onChange={e => setEditCustomerData({ ...editCustomerData, contact_person: e.target.value })} />
                        ) : (
                          c.contact_person || '-'
                        )}
                      </td>

                      <td>
                        {editingCustomerId === c.customer_id ? (
                          <>
                            <button onClick={() => handleSaveCustomerEdit(c.customer_id)}>💾</button>
                            <button onClick={() => setEditingCustomerId(null)}>❌</button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingCustomerId(c.customer_id);
                                setEditCustomerData({
                                  customer_name: c.customer_name,
                                  tax_id: c.tax_id || '',
                                  address: c.address || '',
                                  phone: c.phone,
                                  email: c.email,
                                  contact_person: c.contact_person || ''
                                });
                              }}
                              style={{ marginRight: '5px', cursor: 'pointer' }}
                            >
                              ✏️
                            </button>

                            <button onClick={() => handleDeleteCustomer(c.customer_id)} style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* 2. แถวสีเหลืองสำหรับกรอกข้อมูลและปุ่มบันทึก (ใส่กลับคืนมาให้แล้วครับ) */}
                  <tr style={{ backgroundColor: '#fffbe6' }}>
                    <td><input type="text" placeholder="ชื่อลูกค้า" value={newCustomer.customer_name} onChange={e => setNewCustomer({ ...newCustomer, customer_name: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><input type="text" placeholder="เลขผู้เสียภาษี" value={newCustomer.tax_id || ''} onChange={e => setNewCustomer({ ...newCustomer, tax_id: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><input type="text" placeholder="ที่อยู่" value={newCustomer.address || ''} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><input type="text" placeholder="เบอร์โทร" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><input type="text" placeholder="อีเมล" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><input type="text" placeholder="ชื่อผู้ติดต่อ" value={newCustomer.contact_person || ''} onChange={e => setNewCustomer({ ...newCustomer, contact_person: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><button onClick={handleAddCustomer} style={{ backgroundColor: '#1890ff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>➕ บันทึก</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {/*ส่วนรถ*/}
          {activeTab === 'trucks' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b' }}>ตารางข้อมูลยานพาหนะ (Cars)</h2>
              <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#f0f0f0', textAlign: 'center' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e6f7ff', color: '#555' }}>
                    <th>ทะเบียนรถ</th><th>ประเภทรถ</th><th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.length === 0 ? null : (
                    cars.map(car => (
                      <tr key={car.car_id}>
                        <td>{editingCarId === car.car_id ? <input type="text" value={editCarData.car_number} onChange={e => setEditCarData({ ...editCarData, car_number: e.target.value })} /> : car.car_number}</td>
                        <td>{editingCarId === car.car_id ? <input type="text" value={editCarData.car_type} onChange={e => setEditCarData({ ...editCarData, car_type: e.target.value })} /> : car.car_type}</td>
                        <td>
                          {editingCarId === car.car_id ? (
                            <><button onClick={() => handleSaveCarEdit(car.car_id)}>💾</button> <button onClick={() => setEditingCarId(null)}>❌</button></>
                          ) : (
                            <>
                              <button onClick={() => { setEditingCarId(car.car_id); setEditCarData({ ...car }); }}>✏️</button>
                              <button onClick={() => handleDeleteCar(car.car_id)} style={{ marginLeft: '5px', color: 'red' }}>🗑️</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr style={{ backgroundColor: '#f0f5ff' }}>
                    <td><input type="text" placeholder="ทะเบียนรถ" value={newCar.car_number} onChange={e => setNewCar({ ...newCar, car_number: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><input type="text" placeholder="ประเภทรถ" value={newCar.car_type} onChange={e => setNewCar({ ...newCar, car_type: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><button onClick={handleAddCar} style={{ backgroundColor: '#52c41a', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>➕ บันทึก</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {/*ส่วนคนขับ*/}
          {activeTab === 'driver' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b' }}> ตารางข้อมูลพนักงานขับรถ (Drivers)</h2>
              <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#f0f0f0', textAlign: 'center' }}>
                <thead>
                  <tr style={{ backgroundColor: '#feffe6', color: '#555' }}>
                    <th>ชื่อ-นามสกุล (Full Name)</th><th>เบอร์โทรศัพท์ (Phone)</th><th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>

                  {
                    Array.isArray(drivers) && drivers.map(d => (
                      <tr key={d.driver_id}>
                        <td>{editingDriverId === d.driver_id ? <input type="text" value={editDriverData.full_name} onChange={e => setEditDriverData({ ...editDriverData, full_name: e.target.value })} /> : d.full_name}</td>
                        <td>{editingDriverId === d.driver_id ? <input type="text" value={editDriverData.phone} onChange={e => setEditDriverData({ ...editDriverData, phone: e.target.value })} /> : d.phone}</td>
                        <td>
                          {editingDriverId === d.driver_id ? (
                            <><button onClick={() => handleSaveDriverEdit(d.driver_id)}>💾</button> <button onClick={() => setEditingDriverId(null)}>❌</button></>
                          ) : (
                            <>
                              <button onClick={() => { setEditingDriverId(d.driver_id); setEditDriverData({ ...d }); }}>✏️</button>
                              <button onClick={() => handleDeleteDriver(d.driver_id)} style={{ marginLeft: '5px', color: 'red' }}>🗑️</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  }

                  <tr style={{ backgroundColor: '#fff7e6' }}>
                    <td><input type="text" placeholder="ชื่อคนขับ" value={newDriver.full_name} onChange={e => setNewDriver({ ...newDriver, full_name: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><input type="text" placeholder="เบอร์โทร" value={newDriver.phone} onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })} style={{ width: '90%' }} /></td>
                    <td><button onClick={handleAddDriver} style={{ backgroundColor: '#faad14', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>➕ บันทึก</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'document' && (
            <GenericTable
              tableName="document"
              title="📄 เอกสารทั้งหมด (Documents)"
              hiddenFields={['remark']}
              labels={{
                document_id: 'รหัส',
                document_type: 'ประเภท',
                document_no: 'เลขที่เอกสาร',
                document_date: 'วันที่',
                account_no: 'เลขที่บัญชี',
                customer_id: 'รหัสลูกค้า',
                st_no: 'เลขที่ ST',
                st_date: 'วันที่ ST',
                re_no: 'เลขที่ RE',
                re_date: 'วันที่ RE',
                withholding_percent: 'หัก ณ ที่จ่าย %',
                withholding_amount: 'จำนวนเงินหัก',
                grand_total: 'รวมทั้งสิ้น',
                net_total: 'สุทธิ',
                status: 'สถานะ',
                driver_id: 'รหัสคนขับ',
                car_id: 'รหัสรถ',
                do_no: 'เลขที่ DO',
                do_date: 'วันที่ DO',
                consigner_id: 'รหัสผู้ส่ง',
                consignee_id: 'รหัสผู้รับ'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;