import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import CustomerTable from './components/MasterData/CustomerTable';
import CarTable from './components/MasterData/CarTable';
import DriverTable from './components/MasterData/DriverTable';
import QuotationForm from './components/Quotation/QuotationForm';
import BookingForm from './components/Booking/BookingForm';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentItems, setDocumentItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [consigners, setConsigners] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [bookings, setBookings] = useState([]);

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
      fetch('http://localhost:3000/api/customers').then(r => r.json()),     // [0] ลูกค้า
      fetch('http://localhost:3000/api/cars').then(r => r.json()),          // [1] รถ
      fetch('http://localhost:3000/api/driver').then(r => r.json()),        // [2] คนขับ
      fetch('http://localhost:3000/api/document').then(r => r.json()),      // [3] เอกสาร
      fetch('http://localhost:3000/api/document_items').then(r => r.json()), // [4] ไอเทมเอกสาร
      fetch('http://localhost:3000/api/service').then(r => r.json()),       // [5] บริการ
      fetch('http://localhost:3000/api/service_type').then(r => r.json()),
      fetch('http://localhost:3000/api/consigner').then(r => r.json()),     // [7] ผู้ส่ง
      fetch('http://localhost:3000/api/consignee').then(r => r.json()),      // [8] ผู้รับ
      fetch('http://localhost:3000/api/bookings').then(r => r.json())   // [9]

    ])
      .then(([c, carsData, d, docData, itemsData, serviceData, typeData, consignerData, consigneeData]) => {
        setCustomers(Array.isArray(c) ? c : []);
        setCars(Array.isArray(carsData) ? carsData : []);
        setDrivers(Array.isArray(d) ? d : []);
        setDocuments(Array.isArray(docData) ? docData : []);
        setDocumentItems(Array.isArray(itemsData) ? itemsData : []);
        setServices(Array.isArray(serviceData) ? serviceData : []);
        setServiceTypes(Array.isArray(typeData) ? typeData : []);
        setConsigners(Array.isArray(consignerData) ? consignerData : []);
        setConsignees(Array.isArray(consigneeData) ? consigneeData : []);
        setLoading(false);
      })
      .catch(err => {
        setError('ไม่สามารถโหลดข้อมูลได้: ' + err.message);
        setLoading(false);
      });
  };

  const quotations = Array.isArray(documents) ? documents.filter(doc => doc.document_type === 'Quotation') : [];
  // const invoices = Array.isArray(documents) ? documents.filter(doc => doc.document_type === 'Invoice') : [];
  // const receipts = Array.isArray(documents) ? documents.filter(doc => doc.document_type === 'Receipt') : [];

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  // ==========================================
  // CUSTOMER ACTIONS
  // ==========================================
  //เพิ่มลูกค้าใหม่
  const handleAddCustomer = (newCustomerData, resetForm) => {
    const dataToSend = { ...newCustomerData };

    fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    })
      .then(async (res) => {
        // เช็คว่า response ที่ตอบกลับมาเป็นสถานะ OK (200-299) หรือไม่
        if (!res.ok) {
          const errorText = await res.text(); // อ่านข้อความจาก HTML หรือ Text Error ที่ส่งกลับมา
          throw new Error(`Server ตอบกลับสถานะ ${res.status}: ${errorText.slice(0, 100)}...`);
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          alert('บันทึกไม่สำเร็จ: ' + data.error);
        } else {
          alert(data.message || 'บันทึกสำเร็จ');
          resetForm();
          fetchData();
        }
      })
      .catch(err => {
        console.error('Add Customer Error:', err);
        alert('เกิดข้อผิดพลาด: ' + err.message);
      });
  };
  //บันทึกการเเก้ไขข้อมูลลูกค้า

  const handleSaveCustomerEdit = (id, editCustomerData, successCallback) => {
    fetch(`http://localhost:3000/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editCustomerData)
    }).then(() => {
      successCallback();
      fetchData();
    });
  };
  //ลบข้อมูลลูกค้า

  const handleDeleteCustomer = (id) => {
    if (!confirm('ยืนยันการลบลูกค้านี้?')) return;
    fetch(`http://localhost:3000/api/customers/${id}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };


  // ==========================================
  // CAR ACTIONS
  // ==========================================
  //เพิ่มข้อมูลรถใหม่
  const handleAddCar = (newCarData, resetForm) => {
    const dataToSend = { ...newCarData };

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
  //บันทึกการเเก้ไขข้อมูลรถ
  const handleSaveCarEdit = (id, editCarData, successCallback) => {
    fetch(`http://localhost:3000/api/cars/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCarData) })
      .then(() => { successCallback(); fetchData(); });
  };

  //ลบข้อมูลรถ
  const handleDeleteCar = (id) => {
    if (!confirm('ยืนยันการลบรถคันนี้?')) return;
    fetch(`http://localhost:3000/api/cars/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  // ==========================================
  // DRIVER ACTIONS
  // ==========================================
  //เพิ่มข้อมูลคนขับใหม่
  const handleAddDriver = (newDriverData, resetForm) => {
    const dataToSend = { ...newDriverData };

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
  //บันทึกการเเก้ไขข้อมูลคนขับ

  const handleSaveDriverEdit = (id, editDriverData, successCallback) => {
    fetch(`http://localhost:3000/api/driver/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDriverData) })
      .then(() => { successCallback(); fetchData(); });
  };
  //ลบข้อมูลคนขับ
  const handleDeleteDriver = (id) => {
    if (!confirm('ยืนยันการลบคนขับคนนี้?')) return;
    fetch(`http://localhost:3000/api/driver/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  // ==========================================
  // DOCUMENT ACTIONS
  // ==========================================
  //เพิ่มเอกสารใหม่
  const handleAddDocument = (docType, newDocData, resetForm) => {
    const dataToSend = {
      ...newDocData,
      document_type: docType
    };

    fetch('http://localhost:3000/api/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('บันทึกไม่สำเร็จ: ' + data.error);
        } else {
          alert(data.message);
          resetForm();
          fetchData();
        }
      })
      .catch(err => alert('เกิดข้อผิดพลาด: ' + err.message));
  };

  const handleSaveDocumentEdit = (id, editDocData, successCallback) => {
    fetch(`http://localhost:3000/api/document/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDocData)
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'แก้ไขสำเร็จ');
        successCallback();
        fetchData();
      }).catch(err => alert('แก้ไขไม่สำเร็จ: ' + err.message));
  };

  const handleDeleteDocument = (id) => {
    if (!confirm('ยืนยันการลบเอกสารนี้?')) return;
    fetch(`http://localhost:3000/api/document/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => { alert(data.message); fetchData(); })
      .catch(err => alert('ลบไม่สำเร็จ: ' + err.message));
  };

  // ==========================================
  // RENDER SECTIONS
  // ==========================================
  // Check if user is logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} loginError={loginError} />;
  }

  if (loading) return <div style={{ padding: '30px', textAlign: 'center', fontSize: '20px' }}> กำลังโหลดข้อมูล...</div>;
  if (error) return <div style={{ padding: '30px', textAlign: 'center', color: 'red', fontSize: '18px' }}>{error}</div>;

  return (
    <div className="dashboard-layout-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} pendingBadge="5" />
      <div className="dashboard-main-content">
        <Header />
        <div className="dashboard-content-area">
          {activeTab === 'dashboard' && <Dashboard customersCount={customers.length} carsCount={cars.length} driversCount={drivers.length} />}
          {activeTab === 'customers' && <CustomerTable customers={customers} onAdd={handleAddCustomer} onUpdate={handleSaveCustomerEdit} onDelete={handleDeleteCustomer} documents={documents} />}
          {activeTab === 'trucks' && (
            <CarTable
              cars={cars}
              drivers={drivers}
              onAdd={handleAddCar}
              onUpdate={handleSaveCarEdit}
              onDelete={handleDeleteCar}
            />
          )}
          {activeTab === 'driver' && (
            <DriverTable
              drivers={drivers}
              cars={cars}
              onAdd={handleAddDriver}
              onUpdate={handleSaveDriverEdit}
              onDelete={handleDeleteDriver}
            />
          )}

          {activeTab === 'quotation' && (
            <QuotationForm
              customers={customers}
              documents={documents}
              fetchData={fetchData}
              consigners={consigners}
              consignees={consignees}
              serviceTypes={serviceTypes}
            />
          )}
          {activeTab === 'booking' && (
            <BookingForm
              customers={customers}
              cars={cars}
              consigners={consigners}
              consignees={consignees}
              bookings={bookings}
              fetchData={fetchData}
            />
          )}
          {/* {activeTab === 'invoice' && (
            <DocumentTable
              title="เอกสารใบแจ้งหนี้ (Invoice)"
              documents={invoices}
              customers={customers}
              services={services}
              serviceTypes={serviceTypes}
              onAddDocument={(data, reset) => handleAddDocument('Invoice', data, reset)}
              onUpdateDocument={handleSaveDocumentEdit}
              onDeleteDocument={handleDeleteDocument}
            />
          )}
          {activeTab === 'receipt' && (
            <DocumentTable
              title="เอกสารใบเสร็จรับเงิน (Receipt)"
              documents={receipts}
              customers={customers}
              services={services}
              serviceTypes={serviceTypes}
              onAddDocument={(data, reset) => handleAddDocument('Receipt', data, reset)}
              onUpdateDocument={handleSaveDocumentEdit}
              onDeleteDocument={handleDeleteDocument}
            />
          )} */}
        </div>
      </div>
    </div>
  );
}

export default App;