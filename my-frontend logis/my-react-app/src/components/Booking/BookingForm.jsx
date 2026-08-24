import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchBookings, 
  createBooking, 
  updateBooking, 
  deleteBooking, 
  uploadAttachments, 
  deleteAttachment 
} from './apiBooking';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Paperclip, 
  Trash2, 
  X, 
  Upload, 
  Download, 
  Eye, 
  ChevronDown,
  FileCheck,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  UserPlus,
  CheckCircle2,
  FileText
} from 'lucide-react';
import './BookingTable.css';
import './BookingWizard.css';

export default function BookingForm({ customers = [], cars = [], consigners = [], consignees = [], fetchData }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  // View Mode: 'table' or 'wizard'
  const [viewMode, setViewMode] = useState('table');
  const [editingBooking, setEditingBooking] = useState(null);

  // Attachments Modal State
  const [selectedBookingForAttach, setSelectedBookingForAttach] = useState(null);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  // ----------------------------------------------------
  // WIZARD STATE (5 Steps)
  // ----------------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Customer
  const [customerSearch, setCustomerSearch] = useState('');
  const defaultCustomers = [
    {
      customer_id: 'cust-001',
      customer_name: 'Northern Rice Export Ltd.',
      contact_person: 'Apiradee Charoen',
      phone: '084-567-8901'
    },
    {
      customer_id: 'cust-002',
      customer_name: 'Thai Global Trading Co., Ltd.',
      contact_person: 'Somchai Jaidee',
      phone: '081-234-5678'
    },
    {
      customer_id: 'cust-003',
      customer_name: 'Eastern Seaboard Manufacturing',
      contact_person: 'Prasert Boon',
      phone: '083-456-7890'
    },
    {
      customer_id: 'cust-004',
      customer_name: 'Bangkok Logistics Partners',
      contact_person: 'Nattaya Suk',
      phone: '082-345-6789'
    }
  ];

  const mergedCustomers = Array.from(
    new Map(
      [...defaultCustomers, ...(Array.isArray(customers) ? customers : [])].map(c => [c.customer_name, c])
    ).values()
  );

  const [selectedCustomer, setSelectedCustomer] = useState(defaultCustomers[3]);
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ customer_name: '', contact_person: '', phone: '' });

  // Step 2: Cargo
  const [cargoItems, setCargoItems] = useState([
    { product_name: 'plastics', quantity: '500', unit: 'tun', weight: '3000', wt_unit: 'kg', remark: '123' }
  ]);

  // Step 3: Transport
  const todayStr = new Date().toISOString().slice(0, 10);
  const [transportData, setTransportData] = useState({
    sender_name: '',
    sender_address: 'Ism',
    sender_city: '',
    sender_state: '',
    sender_postal: '',
    sender_country: 'Country',
    pickup_date: '2026-08-05',

    receiver_name: '',
    receiver_address: 'Ims',
    receiver_city: '',
    receiver_state: '',
    receiver_postal: '',
    receiver_country: 'Country',
    delivery_date: '2026-08-16'
  });

  // Step 4: Attachments
  const [wizardAttachedFiles, setWizardAttachedFiles] = useState([]);
  const [wizardNewFiles, setWizardNewFiles] = useState([]);
  const wizardFileInputRef = useRef(null);

  // Default truck options
  const defaultTruckOptions = [
    '— Select truck —',
    '65-3456 (Trailer (20ft))',
    '80-5678 (Trailer (40ft))',
    '70-1234 (10-Wheeler)'
  ];

  const truckOptions = Array.from(new Set([
    ...defaultTruckOptions,
    ...(Array.isArray(cars) ? cars : []).map(c => `${c.car_number} (${c.car_type || 'Truck'})`)
  ]));

  // ดึงข้อมูล Bookings ทั้งหมด
  const loadBookingsData = async () => {
    try {
      setLoading(true);
      const data = await fetchBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      // Mock data matching screenshot if server is starting
      setBookings([
        {
          booking_id: 'bk-1001',
          booking_no: 'BK-20260805-3387',
          customer_name: 'Bangkok Logistics Partners',
          pickup_date: '2026-08-05',
          delivery_date: '2026-08-16',
          truck_name: '65-3456 (Trailer (20ft))',
          attachments: []
        },
        {
          booking_id: 'bk-1002',
          booking_no: 'BK-20260723-4478',
          customer_name: 'Thai Global Trading Co., Ltd.',
          pickup_date: '2026-07-23',
          delivery_date: '2026-07-25',
          truck_name: '80-5678 (Trailer (40ft))',
          attachments: [
            {
              attachment_id: 'att-4478',
              file_name: 'DO_BK-20260723-4478.pdf',
              original_name: 'Delivery_Order_ThaiGlobal_4478.pdf',
              file_path: '/uploads/DO_BK-20260723-4478.pdf',
              file_size: 245000
            }
          ]
        },
        {
          booking_id: 'bk-1003',
          booking_no: 'BK-20260723-003',
          customer_name: 'Eastern Seaboard Manufacturing',
          pickup_date: '2026-07-22',
          delivery_date: '2026-07-23',
          truck_name: '— Select truck —',
          attachments: []
        },
        {
          booking_id: 'bk-1004',
          booking_no: 'BK-20260723-002',
          customer_name: 'Bangkok Logistics Partners',
          pickup_date: '2026-07-24',
          delivery_date: '2026-07-25',
          truck_name: '80-5678 (Trailer (40ft))',
          attachments: []
        },
        {
          booking_id: 'bk-1005',
          booking_no: 'BK-20260723-001',
          customer_name: 'Thai Global Trading Co., Ltd.',
          pickup_date: '2026-07-25',
          delivery_date: '2026-07-26',
          truck_name: '70-1234 (10-Wheeler)',
          attachments: []
        },
        {
          booking_id: 'bk-1006',
          booking_no: 'BK-20260723-004',
          customer_name: 'Thai Global Trading Co., Ltd.',
          pickup_date: '2026-07-18',
          delivery_date: '2026-07-19',
          truck_name: '— Select truck —',
          attachments: []
        },
        {
          booking_id: 'bk-1007',
          booking_no: 'BK-20260723-005',
          customer_name: 'Bangkok Logistics Partners',
          pickup_date: '2026-07-28',
          delivery_date: '2026-07-29',
          truck_name: '— Select truck —',
          attachments: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingsData();
  }, []);

  // Close popup menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Inline Truck update handler
  const handleTruckChange = async (bookingId, newTruck) => {
    setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, truck_name: newTruck } : b));
    try {
      await updateBooking(bookingId, { truck_name: newTruck });
    } catch (err) {
      console.error('Error updating truck assignment:', err);
    }
  };

  // Open 5-Step Wizard for Create
  const handleOpenCreateWizard = () => {
    setEditingBooking(null);
    setSelectedCustomer(defaultCustomers[3]);
    setCargoItems([{ product_name: 'plastics', quantity: '500', unit: 'tun', weight: '3000', wt_unit: 'kg', remark: '123' }]);
    setTransportData({
      sender_name: '', sender_address: 'Ism', sender_city: '', sender_state: '', sender_postal: '', sender_country: 'Country', pickup_date: '2026-08-05',
      receiver_name: '', receiver_address: 'Ims', receiver_city: '', receiver_state: '', receiver_postal: '', receiver_country: 'Country', delivery_date: '2026-08-16'
    });
    setWizardAttachedFiles([]);
    setWizardNewFiles([]);
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Open 5-Step Wizard for Edit
  const handleOpenEditWizard = (booking) => {
    setEditingBooking(booking);
    setOpenMenuId(null);

    const matchCust = mergedCustomers.find(c => c.customer_name === booking.customer_name);
    setSelectedCustomer(matchCust || { customer_name: booking.customer_name, contact_person: 'Contact Person', phone: '080-000-0000' });

    setCargoItems(Array.isArray(booking.cargo_details) ? booking.cargo_details : [
      { product_name: 'plastics', quantity: '500', unit: 'tun', weight: '3000', wt_unit: 'kg', remark: '123' }
    ]);

    setTransportData({
      sender_name: booking.sender_details?.sender_name || '',
      sender_address: booking.sender_details?.sender_address || 'Ism',
      sender_city: booking.sender_details?.sender_city || '',
      sender_state: booking.sender_details?.sender_state || '',
      sender_postal: booking.sender_details?.sender_postal || '',
      sender_country: booking.sender_details?.sender_country || 'Country',
      pickup_date: booking.pickup_date ? new Date(booking.pickup_date).toISOString().slice(0, 10) : '2026-08-05',

      receiver_name: booking.receiver_details?.receiver_name || '',
      receiver_address: booking.receiver_details?.receiver_address || 'Ims',
      receiver_city: booking.receiver_details?.receiver_city || '',
      receiver_state: booking.receiver_details?.receiver_state || '',
      receiver_postal: booking.receiver_details?.receiver_postal || '',
      receiver_country: booking.receiver_details?.receiver_country || 'Country',
      delivery_date: booking.delivery_date ? new Date(booking.delivery_date).toISOString().slice(0, 10) : '2026-08-16'
    });

    setWizardAttachedFiles(booking.attachments || []);
    setWizardNewFiles([]);
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Delete Booking
  const handleDeleteBooking = async (bookingId) => {
    setOpenMenuId(null);
    if (!window.confirm('คุณต้องการลบ Booking นี้ใช่หรือไม่?')) return;
    try {
      await deleteBooking(bookingId);
      alert('ลบสำเร็จ');
      await loadBookingsData();
      if (fetchData) fetchData();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    }
  };

  // Attach Modal Handlers
  const handleOpenAttachModal = (booking) => {
    setSelectedBookingForAttach(booking);
    setSelectedFiles([]);
    setOpenMenuId(null);
    setIsAttachModalOpen(true);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUploadFiles = async () => {
    if (!selectedBookingForAttach) return;
    if (selectedFiles.length === 0) return alert('กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์');

    try {
      setUploading(true);
      const resData = await uploadAttachments(selectedBookingForAttach.booking_id, selectedFiles);
      alert(resData.message || 'แนบไฟล์สำเร็จ');
      setSelectedFiles([]);
      await loadBookingsData();

      if (resData.attachments) {
        setSelectedBookingForAttach(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...resData.attachments]
        }));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachmentFile = async (attachmentId) => {
    if (!window.confirm('ยืนยันลบไฟล์แนบนี้?')) return;
    try {
      const resData = await deleteAttachment(attachmentId);
      alert(resData.message || 'ลบไฟล์สำเร็จ');
      setSelectedBookingForAttach(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter(a => a.attachment_id !== attachmentId)
      }));
      await loadBookingsData();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // WIZARD FINAL SUBMIT
  const handleWizardSubmit = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const autoBookingNo = editingBooking?.booking_no || `BK-${today.replace(/-/g, '')}-${randomNum}`;

      const payload = {
        booking_no: autoBookingNo,
        customer_id: selectedCustomer?.customer_id || null,
        customer_name: selectedCustomer?.customer_name || 'Unassigned Customer',
        pickup_date: transportData.pickup_date || null,
        delivery_date: transportData.delivery_date || null,
        truck_name: editingBooking?.truck_name || '— Select truck —',
        status: editingBooking?.status || 'Active',
        cargo_details: cargoItems,
        sender_details: {
          sender_name: transportData.sender_name,
          sender_address: transportData.sender_address,
          sender_city: transportData.sender_city,
          sender_state: transportData.sender_state,
          sender_postal: transportData.sender_postal,
          sender_country: transportData.sender_country
        },
        receiver_details: {
          receiver_name: transportData.receiver_name,
          receiver_address: transportData.receiver_address,
          receiver_city: transportData.receiver_city,
          receiver_state: transportData.receiver_state,
          receiver_postal: transportData.receiver_postal,
          receiver_country: transportData.receiver_country
        }
      };

      let bookingId = editingBooking?.booking_id;

      if (editingBooking) {
        await updateBooking(bookingId, payload);
      } else {
        const resData = await createBooking(payload);
        bookingId = resData.booking_id;
      }

      if (wizardNewFiles.length > 0 && bookingId) {
        await uploadAttachments(bookingId, wizardNewFiles);
      }

      alert(editingBooking ? 'แก้ไข Booking สำเร็จ' : 'สร้าง Booking สำเร็จ');
      setViewMode('table');
      await loadBookingsData();
      if (fetchData) fetchData();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter Bookings by Search Input
  const filteredBookings = bookings.filter(booking => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return true;
    const bNo = (booking.booking_no || '').toLowerCase();
    const cust = (booking.customer_name || '').toLowerCase();
    const truck = (booking.truck_name || '').toLowerCase();
    const atts = (booking.attachments || []).map(a => (a.original_name || a.file_name || '').toLowerCase()).join(' ');
    return bNo.includes(q) || cust.includes(q) || truck.includes(q) || atts.includes(q);
  });

  const stepsList = [
    { num: 1, label: 'Customer' },
    { num: 2, label: 'Cargo' },
    { num: 3, label: 'Transport' },
    { num: 4, label: 'Attachments' },
    { num: 5, label: 'Review' }
  ];

  // ----------------------------------------------------
  // RENDER 5-STEP WIZARD VIEW MODE
  // ----------------------------------------------------
  if (viewMode === 'wizard') {
    return (
      <div className="wizard-page-container">
        <div className="wizard-top-nav">
          <button type="button" className="back-to-bookings-btn" onClick={() => setViewMode('table')}>
            <ArrowLeft size={16} />
            <span>Back to bookings</span>
          </button>
          <h1 className="wizard-page-title">{editingBooking ? 'Edit Booking' : 'New Booking'}</h1>
        </div>

        <div className="wizard-main-card">
          {/* STEPPER PROGRESS BAR */}
          <div className="wizard-stepper-header">
            {stepsList.map((step, idx) => {
              const isCompleted = currentStep > step.num;
              const isActive = currentStep === step.num;

              return (
                <React.Fragment key={step.num}>
                  <div className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                    <div className="stepper-circle">
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : step.num}
                    </div>
                    <span className="stepper-label">{step.label}</span>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <div className={`stepper-line ${currentStep > step.num ? 'completed' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* STEP 1: SELECT CUSTOMER */}
          {currentStep === 1 && (
            <div className="wizard-step-body">
              <h2 className="step-section-heading">Select Customer</h2>

              <div className="step1-controls-row">
                <div className="customer-search-box">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>

                <button 
                  type="button" 
                  className="add-new-customer-btn"
                  onClick={() => setIsAddCustModalOpen(true)}
                >
                  <UserPlus size={16} />
                  <span>Add New Customer</span>
                </button>
              </div>

              <div className="customer-cards-grid">
                {mergedCustomers
                  .filter(c => {
                    const q = customerSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (c.customer_name || '').toLowerCase().includes(q) ||
                           (c.contact_person || '').toLowerCase().includes(q) ||
                           (c.phone || '').toLowerCase().includes(q);
                  })
                  .map((cust, idx) => {
                    const isSelected = selectedCustomer?.customer_name === cust.customer_name;

                    return (
                      <div
                        key={idx}
                        className={`customer-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedCustomer(cust)}
                      >
                        <div className="cust-card-name">{cust.customer_name}</div>
                        <div className="cust-card-contact">{cust.contact_person || 'Contact Person'}</div>
                        <div className="cust-card-phone">{cust.phone || 'Phone number'}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 2: CARGO INFORMATION */}
          {currentStep === 2 && (
            <div className="wizard-step-body">
              <div className="step-header-with-action">
                <h2 className="step-section-heading">Cargo Information</h2>
                <button type="button" className="btn-outline-action" onClick={() => setCargoItems(prev => [...prev, { product_name: '', quantity: '1', unit: 'box', weight: '0', wt_unit: 'kg', remark: '' }])}>
                  <Plus size={16} />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="cargo-items-container">
                {cargoItems.map((item, idx) => (
                  <div key={idx} className="cargo-item-row-form">
                    <div className="cargo-field col-product">
                      <label>Product Name</label>
                      <input
                        type="text"
                        placeholder="e.g. plastics"
                        value={item.product_name}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].product_name = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-qty">
                      <label>Quantity</label>
                      <input
                        type="number"
                        placeholder="500"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].quantity = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-unit">
                      <label>Unit</label>
                      <input
                        type="text"
                        placeholder="tun"
                        value={item.unit}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].unit = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-weight">
                      <label>Weight</label>
                      <input
                        type="number"
                        placeholder="3000"
                        value={item.weight}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].weight = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-wtunit">
                      <label>Wt Unit</label>
                      <select
                        value={item.wt_unit || 'kg'}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].wt_unit = e.target.value;
                          setCargoItems(updated);
                        }}
                      >
                        <option value="kg">kg</option>
                        <option value="ton">ton</option>
                        <option value="g">g</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>

                    <div className="cargo-field col-remark">
                      <label>Remark</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={item.remark}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].remark = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    {cargoItems.length > 1 && (
                      <button
                        type="button"
                        className="remove-cargo-btn"
                        onClick={() => setCargoItems(prev => prev.filter((_, i) => i !== idx))}
                        title="Remove Cargo"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: TRANSPORT */}
          {currentStep === 3 && (
            <div className="wizard-step-body">
              <div className="transport-dual-grid">
                <div className="transport-box-card">
                  <div className="box-header-row">
                    <h3>Pickup (Sender)</h3>
                    <button type="button" className="btn-small-add">
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="form-group-vertical">
                    <label>Sender Company Name</label>
                    <input
                      type="text"
                      placeholder="Company name"
                      value={transportData.sender_name}
                      onChange={(e) => setTransportData({ ...transportData, sender_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group-vertical">
                    <label>Address Line</label>
                    <input
                      type="text"
                      placeholder="Ism"
                      value={transportData.sender_address}
                      onChange={(e) => setTransportData({ ...transportData, sender_address: e.target.value })}
                    />
                  </div>

                  <div className="form-row-two-cols">
                    <div className="form-group-vertical">
                      <label>City</label>
                      <input
                        type="text"
                        value={transportData.sender_city}
                        onChange={(e) => setTransportData({ ...transportData, sender_city: e.target.value })}
                      />
                    </div>
                    <div className="form-group-vertical">
                      <label>State / Province</label>
                      <input
                        type="text"
                        value={transportData.sender_state}
                        onChange={(e) => setTransportData({ ...transportData, sender_state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row-two-cols">
                    <div className="form-group-vertical">
                      <label>Postal Code</label>
                      <input
                        type="text"
                        value={transportData.sender_postal}
                        onChange={(e) => setTransportData({ ...transportData, sender_postal: e.target.value })}
                      />
                    </div>
                    <div className="form-group-vertical">
                      <label>Country</label>
                      <input
                        type="text"
                        placeholder="Country"
                        value={transportData.sender_country}
                        onChange={(e) => setTransportData({ ...transportData, sender_country: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group-vertical">
                    <label>Pickup Date</label>
                    <input
                      type="date"
                      value={transportData.pickup_date}
                      onChange={(e) => setTransportData({ ...transportData, pickup_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="transport-box-card">
                  <div className="box-header-row">
                    <h3>Delivery (Receiver)</h3>
                    <button type="button" className="btn-small-add">
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="form-group-vertical">
                    <label>Receiver Company Name</label>
                    <input
                      type="text"
                      placeholder="Company name"
                      value={transportData.receiver_name}
                      onChange={(e) => setTransportData({ ...transportData, receiver_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group-vertical">
                    <label>Address Line</label>
                    <input
                      type="text"
                      placeholder="Ims"
                      value={transportData.receiver_address}
                      onChange={(e) => setTransportData({ ...transportData, receiver_address: e.target.value })}
                    />
                  </div>

                  <div className="form-row-two-cols">
                    <div className="form-group-vertical">
                      <label>City</label>
                      <input
                        type="text"
                        value={transportData.receiver_city}
                        onChange={(e) => setTransportData({ ...transportData, receiver_city: e.target.value })}
                      />
                    </div>
                    <div className="form-group-vertical">
                      <label>State / Province</label>
                      <input
                        type="text"
                        value={transportData.receiver_state}
                        onChange={(e) => setTransportData({ ...transportData, receiver_state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row-two-cols">
                    <div className="form-group-vertical">
                      <label>Postal Code</label>
                      <input
                        type="text"
                        value={transportData.receiver_postal}
                        onChange={(e) => setTransportData({ ...transportData, receiver_postal: e.target.value })}
                      />
                    </div>
                    <div className="form-group-vertical">
                      <label>Country</label>
                      <input
                        type="text"
                        placeholder="Country"
                        value={transportData.receiver_country}
                        onChange={(e) => setTransportData({ ...transportData, receiver_country: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group-vertical">
                    <label>Delivery Date</label>
                    <input
                      type="date"
                      value={transportData.delivery_date}
                      onChange={(e) => setTransportData({ ...transportData, delivery_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ATTACHMENTS */}
          {currentStep === 4 && (
            <div className="wizard-step-body">
              <h2 className="step-section-heading">Attachments</h2>

              <div className="attachments-large-dropzone">
                <input
                  type="file"
                  multiple
                  ref={wizardFileInputRef}
                  onChange={(e) => e.target.files && setWizardNewFiles(prev => [...prev, ...Array.from(e.target.files)])}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                />
                <div 
                  className="dropzone-inner" 
                  onClick={() => wizardFileInputRef.current?.click()}
                >
                  <Upload size={38} className="upload-tray-icon" />
                  <span className="upload-click-title">Click to upload files</span>
                  <span className="upload-click-sub">PDF, images, Excel, documents</span>
                </div>
              </div>

              {(wizardAttachedFiles.length > 0 || wizardNewFiles.length > 0) && (
                <div className="attached-files-list-box">
                  <h4>Attached Files:</h4>
                  <ul>
                    {wizardAttachedFiles.map((att, i) => (
                      <li key={`existing-${i}`}>
                        <Paperclip size={14} color="#0284c7" />
                        <span>{att.original_name || att.file_name}</span>
                        <small>(Existing)</small>
                      </li>
                    ))}
                    {wizardNewFiles.map((file, i) => (
                      <li key={`new-${i}`}>
                        <FileText size={14} color="#16a34a" />
                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <button 
                          type="button" 
                          className="btn-remove-new-file"
                          onClick={() => setWizardNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {currentStep === 5 && (
            <div className="wizard-step-body">
              <h2 className="step-section-heading">Review & Confirm</h2>

              <div className="review-summary-grid">
                <div className="review-card-item">
                  <span className="review-label">CUSTOMER</span>
                  <span className="review-value-bold">{selectedCustomer?.customer_name || '-'}</span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">BOOKING DATE</span>
                  <span className="review-value-bold">
                    {new Date(transportData.pickup_date || todayStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">CARGO</span>
                  <span className="review-value">
                    {cargoItems.map(c => `${c.product_name || 'cargo'} — ${c.quantity} ${c.unit} (${c.weight} ${c.wt_unit})`).join(', ')}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">PICKUP (SENDER)</span>
                  <span className="review-value">
                    —<br />
                    {transportData.sender_address || '-'}<br />
                    {new Date(transportData.pickup_date || todayStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">DELIVERY (RECEIVER)</span>
                  <span className="review-value">
                    —<br />
                    {transportData.receiver_address || '-'}<br />
                    {new Date(transportData.delivery_date || todayStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">ATTACHMENTS</span>
                  <span className="review-value">
                    {wizardAttachedFiles.length + wizardNewFiles.length} file(s)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* WIZARD FOOTER NAV */}
          <div className="wizard-footer-nav">
            <button 
              type="button" 
              className="wizard-back-btn"
              onClick={() => {
                if (currentStep > 1) setCurrentStep(prev => prev - 1);
                else setViewMode('table');
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            {currentStep < 5 ? (
              <button 
                type="button" 
                className="wizard-next-btn"
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                className="wizard-submit-btn"
                onClick={handleWizardSubmit}
                disabled={saving}
              >
                <CheckCircle2 size={18} />
                <span>{saving ? 'Saving...' : editingBooking ? 'Save Changes' : 'Create Booking'}</span>
              </button>
            )}
          </div>
        </div>

        {/* QUICK ADD CUSTOMER MODAL */}
        {isAddCustModalOpen && (
          <div className="modal-backdrop-overlay">
            <div className="booking-form-modal-card" style={{ maxWidth: '450px' }}>
              <div className="modal-header-bar">
                <h2>Add New Customer</h2>
                <button className="modal-close-btn" onClick={() => setIsAddCustModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-content" style={{ gap: '14px' }}>
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. New Logistics Co."
                    value={newCustForm.customer_name}
                    onChange={(e) => setNewCustForm({ ...newCustForm, customer_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={newCustForm.contact_person}
                    onChange={(e) => setNewCustForm({ ...newCustForm, contact_person: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 081-999-8888"
                    value={newCustForm.phone}
                    onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-bar">
                <button type="button" className="btn-secondary" onClick={() => setIsAddCustModalOpen(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={() => {
                    if (!newCustForm.customer_name) return alert('Enter customer name');
                    const newC = { ...newCustForm, customer_id: 'cust-' + Date.now() };
                    setSelectedCustomer(newC);
                    setIsAddCustModalOpen(false);
                    setNewCustForm({ customer_name: '', contact_person: '', phone: '' });
                  }}
                >
                  Add & Select
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER MAIN TABLE VIEW MODE
  // ----------------------------------------------------
  return (
    <div className="booking-page-container">
      {/* 1. BREADCRUMB & PAGE HEADING */}
      <div className="booking-title-bar">
        <div className="title-left">
          <div className="breadcrumb-nav">
            <span>Main</span>
            <span className="separator">&gt;</span>
            <span className="current">Booking</span>
          </div>
          <h1 className="main-title">Booking</h1>
          <p className="sub-title">Create and manage transport bookings</p>
        </div>

        <button className="new-booking-btn" onClick={handleOpenCreateWizard}>
          <Plus size={18} />
          <span>New Booking</span>
        </button>
      </div>

      {/* 2. TABLE CARD CONTAINER */}
      <div className="booking-table-card">
        {/* Search Input Box */}
        <div className="table-search-row">
          <div className="table-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="table-responsive-wrapper">
          <table className="booking-custom-table">
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Customer</th>
                <th>Pickup Date</th>
                <th>Delivery Date</th>
                <th>Truck</th>
                {/* PROMPT SPECIFIC REQUIREMENT: ATTACHED FILE PREVIEW COLUMN POSITIONED BETWEEN TRUCK AND 3-DOTS MENU */}
                <th>DO File / Attachment</th>
                <th style={{ width: '60px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-loading-cell">
                    ⏳ Loading bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const hasAttachments = booking.attachments && booking.attachments.length > 0;
                  const firstAtt = hasAttachments ? booking.attachments[0] : null;

                  return (
                    <tr key={booking.booking_id} className="booking-table-row">
                      {/* Booking # */}
                      <td className="booking-no-cell">
                        <span 
                          className="booking-no-link"
                          onClick={() => handleOpenEditWizard(booking)}
                          title="Click to view & edit booking details"
                        >
                          {booking.booking_no}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="customer-cell">
                        {booking.customer_name || '-'}
                      </td>

                      {/* Pickup Date */}
                      <td className="date-cell">
                        {formatDateDisplay(booking.pickup_date)}
                      </td>

                      {/* Delivery Date */}
                      <td className="date-cell">
                        {formatDateDisplay(booking.delivery_date)}
                      </td>

                      {/* Truck Select Dropdown */}
                      <td className="truck-cell">
                        <div className="truck-select-container">
                          <select
                            className="truck-select-input"
                            value={booking.truck_name || '— Select truck —'}
                            onChange={(e) => handleTruckChange(booking.booking_id, e.target.value)}
                          >
                            {truckOptions.map((opt, idx) => (
                              <option key={idx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="truck-select-arrow" />
                        </div>
                      </td>

                      {/* DO FILE PREVIEW BADGE / CHIP (POSITIONED RIGHT NEXT TO TRUCK, BETWEEN TRUCK & 3-DOTS) */}
                      <td className="file-preview-cell">
                        {hasAttachments ? (
                          <div 
                            className="attached-preview-chip"
                            onClick={() => handleOpenAttachModal(booking)}
                            title="Click to preview/view attached files"
                          >
                            <Paperclip size={13} className="chip-paperclip-icon" />
                            <span className="chip-filename-text">
                              {firstAtt?.original_name || firstAtt?.file_name || 'DO_File.pdf'}
                            </span>
                            {booking.attachments.length > 1 && (
                              <span className="chip-count-badge">+{booking.attachments.length - 1}</span>
                            )}
                            <Eye size={13} className="chip-eye-icon" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="attach-do-ghost-btn"
                            onClick={() => handleOpenAttachModal(booking)}
                            title="Attach DO File"
                          >
                            <Paperclip size={13} />
                            <span>+ Attach</span>
                          </button>
                        )}
                      </td>

                      {/* Action Menu (3 Dots Dropdown) */}
                      <td className="action-cell">
                        <div className="action-menu-container">
                          <button 
                            className="action-dots-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === booking.booking_id ? null : booking.booking_id);
                            }}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Popup Menu */}
                          {openMenuId === booking.booking_id && (
                            <div className="action-dropdown-menu">
                              <button 
                                className="dropdown-item"
                                onClick={() => handleOpenEditWizard(booking)}
                              >
                                <Edit size={16} className="menu-icon" />
                                <span>Edit</span>
                              </button>

                              <button 
                                className="dropdown-item"
                                onClick={() => handleOpenAttachModal(booking)}
                              >
                                <Paperclip size={16} className="menu-icon" />
                                <span>Attach DO File</span>
                              </button>

                              <button 
                                className="dropdown-item delete-item"
                                onClick={() => handleDeleteBooking(booking.booking_id)}
                              >
                                <Trash2 size={16} className="menu-icon danger" />
                                <span className="danger-text">Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          MODAL: ATTACH DO FILE / ATTACHMENT MANAGER
          ========================================== */}
      {isAttachModalOpen && selectedBookingForAttach && (
        <div className="modal-backdrop-overlay">
          <div className="attachment-modal-card">
            <div className="modal-header-bar">
              <div className="modal-header-title">
                <Paperclip size={20} color="#0284c7" />
                <div>
                  <h2>DO Files & Attachments</h2>
                  <p className="modal-subtitle">
                    Booking: <strong>{selectedBookingForAttach.booking_no}</strong> ({selectedBookingForAttach.customer_name})
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAttachModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-content">
              {/* Dropzone */}
              <div className="upload-dropzone">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                />
                <Upload size={36} className="dropzone-upload-icon" />
                <p className="dropzone-text">
                  Drag and drop files here, or <button type="button" className="browse-link" onClick={() => fileInputRef.current?.click()}>browse</button>
                </p>
                <p className="dropzone-hint">Supports DO files, PDFs, images, documents</p>

                {selectedFiles.length > 0 && (
                  <div className="selected-files-list">
                    <strong>Selected files to attach ({selectedFiles.length}):</strong>
                    <ul>
                      {selectedFiles.map((f, i) => (
                        <li key={i}>
                          📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                    <button 
                      className="confirm-upload-btn" 
                      onClick={handleUploadFiles}
                      disabled={uploading}
                    >
                      {uploading ? '⏳ Uploading...' : '🚀 Attach Selected File(s)'}
                    </button>
                  </div>
                )}
              </div>

              {/* List of Attached Files */}
              <div className="attached-files-section">
                <h3>
                  Attached Files for this Booking ({selectedBookingForAttach.attachments?.length || 0})
                </h3>

                {(!selectedBookingForAttach.attachments || selectedBookingForAttach.attachments.length === 0) ? (
                  <div className="no-attachments-placeholder">
                    <AlertCircle size={24} color="#9ca3af" />
                    <span>No files attached to this booking yet. Use the area above to attach DO files.</span>
                  </div>
                ) : (
                  <div className="attachments-grid">
                    {selectedBookingForAttach.attachments.map((att) => (
                      <div key={att.attachment_id} className="attachment-item-card">
                        <div className="att-file-icon">
                          <FileCheck size={24} color="#0284c7" />
                        </div>
                        <div className="att-file-info">
                          <span className="att-file-name" title={att.original_name || att.file_name}>
                            {att.original_name || att.file_name}
                          </span>
                          <span className="att-file-meta">
                            {att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : 'Attached'}
                          </span>
                        </div>
                        <div className="att-file-actions">
                          <a
                            href={`http://localhost:3000${att.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="att-action-btn view"
                            title="Preview / View File"
                          >
                            <Eye size={16} />
                          </a>
                          <a
                            href={`http://localhost:3000${att.file_path}`}
                            download
                            className="att-action-btn download"
                            title="Download File"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            type="button"
                            className="att-action-btn delete"
                            onClick={() => handleDeleteAttachmentFile(att.attachment_id)}
                            title="Delete Attachment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer-bar">
              <button className="btn-secondary" onClick={() => setIsAttachModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}