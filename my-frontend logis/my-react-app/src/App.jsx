import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import CustomerTable from './components/MasterData/CustomerTable';
import CarTable from './components/MasterData/CarTable';
import DriverTable from './components/MasterData/DriverTable';
import DocumentTable from './components/Document/DocumentTable';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('customers');

  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentItems, setDocumentItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogin = (email, password) => {
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
  };

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('http://localhost:3000/api/customers').then(r => r.json()),
      fetch('http://localhost:3000/api/cars').then(r => r.json()),
      fetch('http://localhost:3000/api/driver').then(r => r.json()),
      fetch('http://localhost:3000/api/document').then(r => r.json()),
      fetch('http://localhost:3000/api/document_items').then(r => r.json())
    ])
      .then(([c, carsData, d, docData, itemsData]) => {
        setCustomers(c);
        setCars(carsData);
        setDrivers(d);
        setDocuments(docData);
        setDocumentItems(itemsData);
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

  // Customer Actions
  const handleAddCustomer = (newCustomerData, resetForm) => {
    const autoCustomerId = 'c-' + Math.floor(1000000 + Math.random() * 9000000);
    const dataToSend = { ...newCustomerData, customer_id: autoCustomerId };

    fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert('บันทึกไม่สำเร็จ: ' + data.error);
        else {
          alert(data.message);
          resetForm();
          fetchData();
        }
      }).catch(err => alert('เกิดข้อผิดพลาด: ' + err.message));
  };

  const handleSaveCustomerEdit = (id, editCustomerData, successCallback) => {
    fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editCustomerData)
    }).then(() => {
      successCallback();
      fetchData();
    });
  };

  const handleDeleteCustomer = (id) => {
    if (!confirm('ยืนยันการลบลูกค้านี้?')) return;
    fetch(`/api/customers/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  // Car Actions
  const handleAddCar = (newCarData, resetForm) => {
    const autoCarId = 'car-' + Math.floor(10000 + Math.random() * 90000);
    const dataToSend = { ...newCarData, car_id: autoCarId };

    fetch('http://localhost:3000/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert('บันทึกไม่สำเร็จ: ' + data.error);
        else {
          alert(data.message);
          resetForm();
          fetchData();
        }
      }).catch(err => alert('เกิดข้อผิดพลาด: ' + err.message));
  };

  const handleSaveCarEdit = (id, editCarData, successCallback) => {
    fetch(`/api/cars/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCarData) })
      .then(() => { successCallback(); fetchData(); });
  };

  const handleDeleteCar = (id) => {
    if (!confirm('ยืนยันการลบรถคันนี้?')) return;
    fetch(`/api/cars/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  // Driver Actions
  const handleAddDriver = (newDriverData, resetForm) => {
    const autoDriverId = 'd-' + Math.floor(100000 + Math.random() * 900000);
    const dataToSend = { ...newDriverData, driver_id: autoDriverId };

    fetch('http://localhost:3000/api/driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert('บันทึกไม่สำเร็จ: ' + data.error);
        else {
          alert(data.message);
          resetForm();
          fetchData();
        }
      }).catch(err => alert('เกิดข้อผิดพลาด: ' + err.message));
  };

  const handleSaveDriverEdit = (id, editDriverData, successCallback) => {
    fetch(`/api/driver/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDriverData) })
      .then(() => { successCallback(); fetchData(); });
  };

  const handleDeleteDriver = (id) => {
    if (!confirm('ยืนยันการลบคนขับคนนี้?')) return;
    fetch(`/api/driver/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} loginError={loginError} />;
  }

  if (loading) return <div style={{ padding: '30px', textAlign: 'center', fontSize: '20px' }}>⏳ กำลังโหลดข้อมูล...</div>;
  if (error) return <div style={{ padding: '30px', textAlign: 'center', color: 'red', fontSize: '18px' }}>{error}</div>;

  const quotations = Array.isArray(documents) ? documents.filter(doc => doc.document_type === 'Quotation') : [];
  const invoices = Array.isArray(documents) ? documents.filter(doc => doc.document_type === 'Invoice') : [];
  const receipts = Array.isArray(documents) ? documents.filter(doc => doc.document_type === 'Receipt') : [];

  return (
    <div className="dashboard-layout-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} pendingBadge="5" />
      <div className="dashboard-main-content">
        <Header />
        <div className="dashboard-content-area">
          {activeTab === 'dashboard' && <Dashboard customersCount={customers.length} carsCount={cars.length} driversCount={drivers.length} />}
          {activeTab === 'customers' && <CustomerTable customers={customers} onAdd={handleAddCustomer} onUpdate={handleSaveCustomerEdit} onDelete={handleDeleteCustomer} />}
          {activeTab === 'trucks' && <CarTable cars={cars} onAdd={handleAddCar} onUpdate={handleSaveCarEdit} onDelete={handleDeleteCar} />}
          {activeTab === 'driver' && <DriverTable drivers={drivers} onAdd={handleAddDriver} onUpdate={handleSaveDriverEdit} onDelete={handleDeleteDriver} />}
          {activeTab === 'quotation' && <DocumentTable title="เอกสารใบเสนอราคา (Quotation)" documents={quotations} />}
          {activeTab === 'invoice' && <DocumentTable title="เอกสารใบแจ้งหนี้ (Invoice)" documents={invoices} />}
          {activeTab === 'receipt' && <DocumentTable title="เอกสารใบเสร็จรับเงิน (Receipt)" documents={receipts} />}
        </div>
      </div>
    </div>
  );
}

export default App;