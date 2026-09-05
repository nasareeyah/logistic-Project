
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
  FileText,
  FolderOpen,
  Pencil
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
  const mergedCustomers = Array.isArray(customers) ? customers : [];

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ customer_name: '', contact_person: '', phone: '' });

  // Step 2: Cargo
  const [cargoItems, setCargoItems] = useState([
    { product_name: '', quantity: '1', unit: 'box', weight: '0', wt_unit: 'kg', remark: '' }
  ]);

  // Step 3: Transport (Multiple Senders & Receivers)
  const todayStr = new Date().toISOString().slice(0, 10);

  const emptySender = { company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', pickup_date: todayStr };
  const emptyReceiver = { company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', delivery_date: todayStr };

  const [sendersList, setSendersList] = useState([{ ...emptySender }]);
  const [receiversList, setReceiversList] = useState([{ ...emptyReceiver }]);

  const handleAddSender = () => {
    setSendersList(prev => [...prev, { ...emptySender }]);
  };

  const handleRemoveSender = (index) => {
    if (sendersList.length <= 1) return;
    setSendersList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSenderChange = (index, field, value) => {
    setSendersList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddReceiver = () => {
    setReceiversList(prev => [...prev, { ...emptyReceiver }]);
  };

  const handleRemoveReceiver = (index) => {
    if (receiversList.length <= 1) return;
    setReceiversList(prev => prev.filter((_, i) => i !== index));
  };

  const handleReceiverChange = (index, field, value) => {
    setReceiversList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Step 4: Attachments
  const [wizardAttachedFiles, setWizardAttachedFiles] = useState([]);
  const [wizardNewFiles, setWizardNewFiles] = useState([]);
  const wizardFileInputRef = useRef(null);

  // Truck options derived from DB cars
  const truckOptions = [
    '— Select truck —',
    ...(Array.isArray(cars) ? cars : []).map(c => `${c.car_number} (${c.car_type || 'Truck'})`)
  ];

  // ดึงข้อมูล Bookings ทั้งหมดจากฐานข้อมูลจริง
  const loadBookingsData = async () => {
    try {
      setLoading(true);
      const data = await fetchBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookings([]);
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

  const getEffectivePickupDate = (booking) => {
    if (booking.pickup_date) return booking.pickup_date;
    const senders = booking.sender_details;
    if (Array.isArray(senders) && senders.length > 0) {
      return senders[0]?.pickup_date || senders[0]?.sender_date || senders[0]?.date;
    }
    if (senders && typeof senders === 'object') {
      return senders.pickup_date || senders.sender_date || senders.date;
    }
    return null;
  };

  const getEffectiveDeliveryDate = (booking) => {
    if (booking.delivery_date) return booking.delivery_date;
    const receivers = booking.receiver_details;
    if (Array.isArray(receivers) && receivers.length > 0) {
      return receivers[0]?.delivery_date || receivers[0]?.receiver_date || receivers[0]?.date;
    }
    if (receivers && typeof receivers === 'object') {
      return receivers.delivery_date || receivers.receiver_date || receivers.date;
    }
    return null;
  };

  // Inline Truck update handler
  const handleTruckChange = async (bookingId, selectedCarId) => {
    const selectedCar = (Array.isArray(cars) ? cars : []).find(c => c.car_id === selectedCarId);
    const carNumber = selectedCar ? selectedCar.car_number : '';

    setBookings(prev => prev.map(b => b.booking_id === bookingId ? {
      ...b,
      car_id: selectedCarId || null,
      car_number: carNumber || null
    } : b));

    try {
      await updateBooking(bookingId, {
        car_id: selectedCarId || null,
        truck_name: carNumber || null
      });
    } catch (err) {
      console.error('Error updating truck assignment:', err);
    }
  };

  // Open 5-Step Wizard for Create
  const handleOpenCreateWizard = () => {
    setEditingBooking(null);
    setSelectedCustomer(null);
    setCargoItems([{ product_name: '', quantity: '1', unit: 'box', weight: '0', wt_unit: 'kg', remark: '' }]);
    setSendersList([{ company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', pickup_date: todayStr }]);
    setReceiversList([{ company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', delivery_date: todayStr }]);
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
    setSelectedCustomer(matchCust || { customer_name: booking.customer_name || '', contact_person: '', phone: '' });

    setCargoItems(Array.isArray(booking.cargo_details) ? booking.cargo_details : [
      { product_name: '', quantity: '1', unit: 'box', weight: '0', wt_unit: 'kg', remark: '' }
    ]);

    // Parse sender_details if array or single object
    if (Array.isArray(booking.sender_details) && booking.sender_details.length > 0) {
      setSendersList(booking.sender_details);
    } else if (booking.sender_details && typeof booking.sender_details === 'object') {
      setSendersList([{
        company_name: booking.sender_details.sender_name || booking.sender_details.company_name || '',
        address_line: booking.sender_details.sender_address || booking.sender_details.address_line || '',
        city: booking.sender_details.sender_city || booking.sender_details.city || '',
        state: booking.sender_details.sender_state || booking.sender_details.state || '',
        postal_code: booking.sender_details.sender_postal || booking.sender_details.postal_code || '',
        country: booking.sender_details.sender_country || booking.sender_details.country || '',
        pickup_date: booking.pickup_date ? new Date(booking.pickup_date).toISOString().slice(0, 10) : todayStr
      }]);
    } else {
      setSendersList([{ company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', pickup_date: todayStr }]);
    }

    // Parse receiver_details if array or single object
    if (Array.isArray(booking.receiver_details) && booking.receiver_details.length > 0) {
      setReceiversList(booking.receiver_details);
    } else if (booking.receiver_details && typeof booking.receiver_details === 'object') {
      setReceiversList([{
        company_name: booking.receiver_details.receiver_name || booking.receiver_details.company_name || '',
        address_line: booking.receiver_details.receiver_address || booking.receiver_details.address_line || '',
        city: booking.receiver_details.receiver_city || booking.receiver_details.city || '',
        state: booking.receiver_details.receiver_state || booking.receiver_details.state || '',
        postal_code: booking.receiver_details.receiver_postal || booking.receiver_details.postal_code || '',
        country: booking.receiver_details.receiver_country || booking.receiver_details.country || '',
        delivery_date: booking.delivery_date ? new Date(booking.delivery_date).toISOString().slice(0, 10) : todayStr
      }]);
    } else {
      setReceiversList([{ company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', delivery_date: todayStr }]);
    }

    setWizardAttachedFiles(booking.attachments || []);
    setWizardNewFiles([]);
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Open Summary View (Read Only Details) when clicking Booking # link
  const handleOpenSummaryView = (booking) => {
    handleOpenEditWizard(booking);
    setCurrentStep(5);
    setViewMode('summary');
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

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (!selectedBookingForAttach) return;

      try {
        setUploading(true);
        const resData = await uploadAttachments(selectedBookingForAttach.booking_id, files);
        alert(resData.message || 'แนบไฟล์สำเร็จ');
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
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (!selectedBookingForAttach) return;

      try {
        setUploading(true);
        const resData = await uploadAttachments(selectedBookingForAttach.booking_id, files);
        alert(resData.message || 'แนบไฟล์สำเร็จ');
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
      const autoBookingNo = editingBooking?.booking_no || '';

      const payload = {
        booking_no: autoBookingNo,
        customer_id: selectedCustomer?.customer_id || null,
        customer_name: selectedCustomer?.customer_name || 'Unassigned Customer',
        pickup_date: sendersList[0]?.pickup_date || todayStr,
        delivery_date: receiversList[0]?.delivery_date || todayStr,
        truck_name: editingBooking?.truck_name || '— Select truck —',
        status: editingBooking?.status || 'Active',
        cargo_details: cargoItems,
        sender_details: sendersList,
        receiver_details: receiversList
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
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Back link */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Back to bookings</span>
          </button>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '24px', textAlign: 'left' }}>
          {editingBooking ? 'Edit Booking' : 'Create New Booking'}
        </h2>

        {/* Main Card Panel */}
        <div className="dashboard-card-panel" style={{ padding: '32px' }}>

          {/* Stepper Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', overflowX: 'auto', paddingBottom: '8px' }}>
            {stepsList.map((step, idx) => {
              const isCompleted = step.num < currentStep;
              const isActive = step.num === currentStep;

              return (
                <div
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '160px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Step Circle */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      backgroundColor: isCompleted || isActive ? '#0284c7' : '#f1f5f9',
                      color: isCompleted || isActive ? '#ffffff' : '#64748b',
                      border: isCompleted || isActive ? 'none' : '1px solid #cbd5e1'
                    }}>
                      {isCompleted ? <Check size={18} /> : step.num}
                    </div>
                    {/* Step Label */}
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#0f172a' : isCompleted ? '#334155' : '#94a3b8',
                      whiteSpace: 'nowrap'
                    }}>
                      {step.label}
                    </span>
                  </div>

                  {/* Line connector between steps */}
                  {idx < stepsList.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: step.num < currentStep ? '#0284c7' : '#e2e8f0',
                      margin: '0 12px',
                      minWidth: '20px'
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* STEP 1: SELECT CUSTOMER */}
          {currentStep === 1 && (
            <div className="wizard-step-body">
              <h2 className="step-section-heading">Select Customer</h2>

              <div className="step1-controls-row">
                <div className="customer-search-box" style={{ width: '100%' }}>
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
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
                {/* PICKUP (SENDER) COLUMN */}
                <div className="transport-box-card">
                  <div className="box-header-row">
                    <h3>Pickup (Sender)</h3>
                    <button type="button" className="btn-small-add" onClick={handleAddSender}>
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  {sendersList.map((sender, idx) => (
                    <div key={idx} className="location-block-card">
                      <div className="location-block-header">
                        <span className="location-block-index">Pickup Location #{idx + 1}</span>
                      </div>

                      <div className="form-group-vertical">
                        <label>Sender Company Name</label>
                        <input
                          type="text"
                          placeholder="Company name"
                          value={sender.company_name}
                          onChange={(e) => handleSenderChange(idx, 'company_name', e.target.value)}
                        />
                      </div>

                      <div className="form-group-vertical">
                        <label>Address Line</label>
                        <input
                          type="text"
                          placeholder="Street address / Location"
                          value={sender.address_line}
                          onChange={(e) => handleSenderChange(idx, 'address_line', e.target.value)}
                        />
                      </div>

                      <div className="form-row-two-cols">
                        <div className="form-group-vertical">
                          <label>City</label>
                          <input
                            type="text"
                            placeholder="City"
                            value={sender.city}
                            onChange={(e) => handleSenderChange(idx, 'city', e.target.value)}
                          />
                        </div>
                        <div className="form-group-vertical">
                          <label>State / Province</label>
                          <input
                            type="text"
                            placeholder="State / Province"
                            value={sender.state}
                            onChange={(e) => handleSenderChange(idx, 'state', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row-two-cols">
                        <div className="form-group-vertical">
                          <label>Postal Code</label>
                          <input
                            type="text"
                            placeholder="Postal code"
                            value={sender.postal_code}
                            onChange={(e) => handleSenderChange(idx, 'postal_code', e.target.value)}
                          />
                        </div>
                        <div className="form-group-vertical">
                          <label>Country</label>
                          <input
                            type="text"
                            placeholder="Country"
                            value={sender.country}
                            onChange={(e) => handleSenderChange(idx, 'country', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group-vertical">
                        <label>Pickup Date</label>
                        <input
                          type="date"
                          value={sender.pickup_date || todayStr}
                          onChange={(e) => handleSenderChange(idx, 'pickup_date', e.target.value)}
                        />
                      </div>

                      {sendersList.length > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn-remove-location"
                            onClick={() => handleRemoveSender(idx)}
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* DELIVERY (RECEIVER) COLUMN */}
                <div className="transport-box-card">
                  <div className="box-header-row">
                    <h3>Delivery (Receiver)</h3>
                    <button type="button" className="btn-small-add" onClick={handleAddReceiver}>
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  {receiversList.map((receiver, idx) => (
                    <div key={idx} className="location-block-card">
                      <div className="location-block-header">
                        <span className="location-block-index">Delivery Location #{idx + 1}</span>
                      </div>

                      <div className="form-group-vertical">
                        <label>Receiver Company Name</label>
                        <input
                          type="text"
                          placeholder="Company name"
                          value={receiver.company_name}
                          onChange={(e) => handleReceiverChange(idx, 'company_name', e.target.value)}
                        />
                      </div>

                      <div className="form-group-vertical">
                        <label>Address Line</label>
                        <input
                          type="text"
                          placeholder="Street address / Location"
                          value={receiver.address_line}
                          onChange={(e) => handleReceiverChange(idx, 'address_line', e.target.value)}
                        />
                      </div>

                      <div className="form-row-two-cols">
                        <div className="form-group-vertical">
                          <label>City</label>
                          <input
                            type="text"
                            placeholder="City"
                            value={receiver.city}
                            onChange={(e) => handleReceiverChange(idx, 'city', e.target.value)}
                          />
                        </div>
                        <div className="form-group-vertical">
                          <label>State / Province</label>
                          <input
                            type="text"
                            placeholder="State / Province"
                            value={receiver.state}
                            onChange={(e) => handleReceiverChange(idx, 'state', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row-two-cols">
                        <div className="form-group-vertical">
                          <label>Postal Code</label>
                          <input
                            type="text"
                            placeholder="Postal code"
                            value={receiver.postal_code}
                            onChange={(e) => handleReceiverChange(idx, 'postal_code', e.target.value)}
                          />
                        </div>
                        <div className="form-group-vertical">
                          <label>Country</label>
                          <input
                            type="text"
                            placeholder="Country"
                            value={receiver.country}
                            onChange={(e) => handleReceiverChange(idx, 'country', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group-vertical">
                        <label>Delivery Date</label>
                        <input
                          type="date"
                          value={receiver.delivery_date || todayStr}
                          onChange={(e) => handleReceiverChange(idx, 'delivery_date', e.target.value)}
                        />
                      </div>

                      {receiversList.length > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn-remove-location"
                            onClick={() => handleRemoveReceiver(idx)}
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
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
                    {new Date(sendersList[0]?.pickup_date || todayStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">CARGO</span>
                  <span className="review-value">
                    {cargoItems.map(c => `${c.product_name || 'cargo'} — ${c.quantity} ${c.unit} (${c.weight} ${c.wt_unit})`).join(', ')}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">PICKUP (SENDER - {sendersList.length} Location(s))</span>
                  <span className="review-value">
                    {sendersList.map((s, i) => (
                      <div key={i} style={{ marginBottom: '6px' }}>
                        <strong>#{i + 1} {s.company_name || 'Sender'}</strong><br />
                        {s.address_line || '-'}<br />
                        Date: {s.pickup_date ? new Date(s.pickup_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </div>
                    ))}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">DELIVERY (RECEIVER - {receiversList.length} Location(s))</span>
                  <span className="review-value">
                    {receiversList.map((r, i) => (
                      <div key={i} style={{ marginBottom: '6px' }}>
                        <strong>#{i + 1} {r.company_name || 'Receiver'}</strong><br />
                        {r.address_line || '-'}<br />
                        Date: {r.delivery_date ? new Date(r.delivery_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </div>
                    ))}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div>
              <button
                type="button"
                className="btn-secondary"
                disabled={currentStep === 1}
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(prev => prev - 1);
                  else setViewMode('table');
                }}
                style={{
                  opacity: currentStep === 1 ? 0.5 : 1,
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>

            <div>
              {currentStep < 5 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={handleWizardSubmit}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>{saving ? 'Saving...' : editingBooking ? 'Save Changes' : 'Create Booking'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER BOOKING SUMMARY / DETAILS VIEW MODE
  // ----------------------------------------------------
  if (viewMode === 'summary') {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Back link */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Back to bookings</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0, textAlign: 'left' }}>
            Booking Summary: {editingBooking?.booking_no}
          </h2>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setCurrentStep(1);
              setViewMode('wizard');
            }}
          >
            <Pencil size={16} />
            <span>Edit Booking</span>
          </button>
        </div>

        {/* SUMMARY DETAILS CARD */}
        <div className="dashboard-card-panel" style={{ padding: '32px' }}>
          <div className="wizard-step-body">
            <h2 className="step-section-heading">Transport Booking Details</h2>

            <div className="review-summary-grid">
              <div className="review-card-item">
                <span className="review-label">BOOKING NUMBER</span>
                <span className="review-value-bold">{editingBooking?.booking_no || '-'}</span>
              </div>

              <div className="review-card-item">
                <span className="review-label">CUSTOMER</span>
                <span className="review-value-bold">{selectedCustomer?.customer_name || editingBooking?.customer_name || '-'}</span>
              </div>

              <div className="review-card-item">
                <span className="review-label">ASSIGNED TRUCK</span>
                <span className="review-value-bold">{editingBooking?.truck_name || '— Select truck —'}</span>
              </div>

              <div className="review-card-item">
                <span className="review-label">BOOKING DATE</span>
                <span className="review-value-bold">
                  {new Date(sendersList[0]?.pickup_date || todayStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="review-card-item" style={{ gridColumn: 'span 2' }}>
                <span className="review-label">CARGO DETAILS</span>
                <span className="review-value">
                  {cargoItems.map((c, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      📦 <strong>{c.product_name || 'Cargo'}</strong> — Quantity: {c.quantity} {c.unit} | Weight: {c.weight} {c.wt_unit} {c.remark ? `(Remark: ${c.remark})` : ''}
                    </div>
                  ))}
                </span>
              </div>

              <div className="review-card-item">
                <span className="review-label">PICKUP LOCATIONS (SENDER - {sendersList.length})</span>
                <span className="review-value">
                  {sendersList.map((s, i) => (
                    <div key={i} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: i < sendersList.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                      <strong>#{i + 1} {s.company_name || 'Sender Company'}</strong><br />
                      {s.address_line || '-'}<br />
                      {s.city ? `${s.city}, ` : ''}{s.state ? `${s.state} ` : ''}{s.postal_code || ''} {s.country || ''}<br />
                      Pickup Date: {s.pickup_date ? new Date(s.pickup_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                  ))}
                </span>
              </div>

              <div className="review-card-item">
                <span className="review-label">DELIVERY LOCATIONS (RECEIVER - {receiversList.length})</span>
                <span className="review-value">
                  {receiversList.map((r, i) => (
                    <div key={i} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: i < receiversList.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                      <strong>#{i + 1} {r.company_name || 'Receiver Company'}</strong><br />
                      {r.address_line || '-'}<br />
                      {r.city ? `${r.city}, ` : ''}{r.state ? `${r.state} ` : ''}{r.postal_code || ''} {r.country || ''}<br />
                      Delivery Date: {r.delivery_date ? new Date(r.delivery_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                  ))}
                </span>
              </div>

              <div className="review-card-item" style={{ gridColumn: 'span 2' }}>
                <span className="review-label">ATTACHED DO FILES & DOCUMENTS ({wizardAttachedFiles.length})</span>
                <span className="review-value">
                  {wizardAttachedFiles.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>No attached files for this booking.</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                      {wizardAttachedFiles.map((att, i) => (
                        <a
                          key={i}
                          href={`http://localhost:3000${att.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attached-preview-chip"
                          style={{ textDecoration: 'none' }}
                        >
                          <Paperclip size={13} className="chip-paperclip-icon" />
                          <span>{att.original_name || att.file_name}</span>
                          <Eye size={13} className="chip-eye-icon" />
                        </a>
                      ))}
                    </div>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #e2e8f0', marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('table')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} />
              <span>Back to bookings</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setCurrentStep(1);
                setViewMode('wizard');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Pencil size={16} />
              <span>Edit Booking</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER MAIN TABLE VIEW MODE
  // ----------------------------------------------------
  return (
    <div>
      {/* Breadcrumb */}
      <div className="dashboard-breadcrumb">
        <span>Main</span>
        <span className="dashboard-breadcrumb-separator">&gt;</span>
        <span>Document Center</span>
        <span className="dashboard-breadcrumb-separator">&gt;</span>
        <span style={{ color: '#64748b' }}>Booking</span>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>Booking</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>Create and manage transport bookings</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateWizard}>
          <Plus size={16} />
          <span>Create New Booking</span>
        </button>
      </div>

      {/* Table Panel */}
      <div className="dashboard-card-panel" style={{ padding: '24px 0 0 0' }}>
        <div style={{ padding: '0 24px' }}>
          <div className="panel-search-bar">
            <Search size={16} className="panel-search-icon" />
            <input
              type="text"
              placeholder="Search bookings..."
              className="panel-search-input"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-clean-table">
            <thead>
              <tr>
                <th style={{ width: '16%', paddingLeft: '24px', whiteSpace: 'nowrap' }}>Booking #</th>
                <th style={{ width: '17%', whiteSpace: 'nowrap' }}>Customer</th>
                <th style={{ width: '13%', whiteSpace: 'nowrap' }}>Pickup Date</th>
                <th style={{ width: '13%', whiteSpace: 'nowrap' }}>Delivery Date</th>
                <th style={{ width: '20%', whiteSpace: 'nowrap' }}>Truck</th>
                <th style={{ width: '14%', whiteSpace: 'nowrap' }}>DO File / Attachment</th>
                <th style={{ width: '7%', textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    ⏳ Loading bookings...
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const hasAttachments = booking.attachments && booking.attachments.length > 0;
                  const firstAtt = hasAttachments ? booking.attachments[0] : null;

                  return (
                    <tr key={booking.booking_id}>
                      {/* Booking # */}
                      <td style={{ paddingLeft: '24px', fontWeight: '600', color: '#0284c7', whiteSpace: 'nowrap' }}>
                        <span
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenSummaryView(booking)}
                          title="Click to view booking summary"
                        >
                          {booking.booking_no}
                        </span>
                      </td>

                      {/* Customer */}
                      <td style={{ color: '#334155', whiteSpace: 'nowrap' }}>
                        {booking.customer_name || '-'}
                      </td>

                      {/* Pickup Date */}
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDateDisplay(getEffectivePickupDate(booking))}
                      </td>

                      {/* Delivery Date */}
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDateDisplay(getEffectiveDeliveryDate(booking))}
                      </td>

                      {/* Truck Select Dropdown */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="truck-select-container">
                          <select
                            className="truck-select-input"
                            value={booking.car_id || ''}
                            onChange={(e) => handleTruckChange(booking.booking_id, e.target.value)}
                          >
                            <option value="">— Select truck —</option>
                            {(Array.isArray(cars) ? cars : []).map((car) => (
                              <option key={car.car_id} value={car.car_id}>
                                {car.car_number}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="truck-select-arrow" />
                        </div>
                      </td>

                      {/* DO FILE PREVIEW BADGE / CHIP */}
                      <td style={{ whiteSpace: 'nowrap' }}>
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
                      <td style={{ textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>
                        <div className="action-menu-container">
                          <button
                            className="action-dots-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === booking.booking_id ? null : booking.booking_id);
                            }}
                            title="Actions"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Popup Menu */}
                          {openMenuId === booking.booking_id && (
                            <div className="action-dropdown-menu">
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenEditWizard(booking);
                                }}
                              >
                                <Edit size={16} className="menu-icon" />
                                <span>Edit</span>
                              </button>

                              <button
                                className="dropdown-item delete-item"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteBooking(booking.booking_id);
                                }}
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

        {filteredBookings.length === 0 && !loading && (
          <div className="empty-state-wrapper">
            <FolderOpen size={48} className="empty-state-icon" />
            <p className="empty-state-text">No bookings found. Click 'Create New Booking' to generate one.</p>
          </div>
        )}
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
              <div
                className="upload-dropzone"
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  disabled={uploading}
                />
                {uploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                    <span style={{ fontSize: '24px' }}>⏳</span>
                    <p style={{ margin: 0, fontWeight: 600, color: '#0284c7' }}>Uploading files, please wait...</p>
                  </div>
                ) : (
                  <>
                    <Upload size={36} className="dropzone-upload-icon" />
                    <p className="dropzone-text">
                      Drag and drop files here, or <span className="browse-link">browse</span>
                    </p>
                    <p className="dropzone-hint">Supports DO files, PDFs, images, documents</p>
                  </>
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