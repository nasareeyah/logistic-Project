import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Printer,
  FileText,
  Truck as TruckIcon,
  Calendar,
  Building,
  MapPin,
  Package,
  Inbox,
  ArrowLeft,
  ArrowRight,
  Check,
  Pencil
} from 'lucide-react';

export default function DeliveryOrderTable({
  customers = [],
  cars = [],
  drivers = [],
  bookings = []
}) {
  // viewMode: 'table' | 'wizard' | 'summary'
  const [viewMode, setViewMode] = useState('table');
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingDoId, setEditingDoId] = useState(null);

  // Delivery Orders list
  const [deliveryOrders, setDeliveryOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('local_delivery_orders_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedDoForView, setSelectedDoForView] = useState(null);

  // Step 1 Booking Search
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // 6-step form data
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatInputDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const generateDoNumber = (existingList = deliveryOrders) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `DO-${yyyy}${mm}${dd}-`;

    let maxSeq = 0;
    if (Array.isArray(existingList)) {
      existingList.forEach((item) => {
        if (item.do_no && item.do_no.startsWith(prefix)) {
          const parts = item.do_no.split('-');
          const seq = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      });
    }
    const nextSeq = String(maxSeq + 1).padStart(4, '0');
    return `${prefix}${nextSeq}`;
  };

  const initialFormData = {
    // Step 1
    booking_id: '',
    booking_no: '',
    cargo_id: '',
    consigner_id: '',
    consignee_id: '',
    car_id: '',
    driver_id: '',

    // Step 2: Parties
    consignor_name: '',
    consignor_address: '',
    consignor_city: '',
    consignor_state: '',
    consignor_postal_code: '',
    consignor_country: 'Thailand',

    consignee_name: '',
    consignee_address: '',
    consignee_city: '',
    consignee_state: '',
    consignee_postal_code: '',
    consignee_country: 'Thailand',

    customer_name: '',

    // Step 3: Transport & Document Info
    do_no: '',
    invoice_no: '',
    date_of_load: getTodayStr(),
    eta: getTomorrowStr(),
    truck_number: '',
    driver_name: '',
    driver_phone: '',

    // Step 4: Goods
    goods_items: [
      { description: '', quantity: '1', load_from: '', destination: '' }
    ],

    // Step 5: Shipping, Warehouse & Remark
    shipping: '',
    warehouse: '',
    remark: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const [bookingsList, setBookingsList] = useState(bookings);

  useEffect(() => {
    if (Array.isArray(bookings) && bookings.length > 0) {
      setBookingsList(bookings);
    }
  }, [bookings]);

  const fetchBookingsList = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/bookings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBookingsList(data);
        }
      }
    } catch {
      // ignore
    }
  };

  // Fetch Delivery Orders from backend
  const fetchDeliveryOrders = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/delivery-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDeliveryOrders(data);
          localStorage.setItem('local_delivery_orders_v2', JSON.stringify(data));
        }
      }
    } catch {
      // Backend offline or error
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
    fetchBookingsList();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Format date helper: "22 Jul 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // 6 Steps List
  const stepsList = [
    { num: 1, label: 'Select Booking' },
    { num: 2, label: 'Parties' },
    { num: 3, label: 'Transport' },
    { num: 4, label: 'Goods' },
    { num: 5, label: 'Shipping & Remark' },
    { num: 6, label: 'Review' }
  ];

  // Open Create Wizard
  const handleOpenCreateWizard = async () => {
    fetchBookingsList();
    setEditingDoId(null);
    setSelectedBooking(null);
    setBookingSearchQuery('');

    let nextDo = generateDoNumber(deliveryOrders);
    try {
      const res = await fetch('http://localhost:3000/api/delivery-orders/next-no');
      if (res.ok) {
        const data = await res.json();
        if (data.next_do_no) {
          nextDo = data.next_do_no;
        }
      }
    } catch {
      // fallback to local sequence
    }

    setFormData({
      ...initialFormData,
      do_no: nextDo,
      date_of_load: getTodayStr(),
      eta: getTomorrowStr()
    });
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Open Edit Wizard
  const handleOpenEditWizard = (item) => {
    fetchBookingsList();
    setEditingDoId(item.do_id || item.do_no);
    setBookingSearchQuery('');
    
    // Check if matched booking exists
    const matchedBooking = bookingsList.find(b => b.booking_id === item.booking_id || b.booking_no === item.booking_id) || bookings.find(b => b.booking_id === item.booking_id || b.booking_no === item.booking_id);
    setSelectedBooking(matchedBooking || null);

    // Resolve goods_items for Edit mode:
    let editGoods = [];
    if (Array.isArray(item.goods_items) && item.goods_items.length > 0) {
      editGoods = item.goods_items;
    } else if (item.product_name) {
      editGoods = [
        {
          description: item.product_name || '',
          quantity: String(item.quantity !== null && item.quantity !== undefined ? item.quantity : '1'),
          unit: item.unit || 'box',
          weight: item.weight || '0',
          wt_unit: item.wt_unit || 'kg',
          load_from: item.load_from || item.consignor_address || '',
          destination: item.destination || item.consignee_address || '',
          cargo_id: item.cargo_id || ''
        }
      ];
    } else if (matchedBooking && Array.isArray(matchedBooking.cargo_details) && matchedBooking.cargo_details.length > 0) {
      editGoods = matchedBooking.cargo_details.map((c) => ({
        description: c.product_name || '',
        quantity: String(c.quantity !== null && c.quantity !== undefined ? c.quantity : '1'),
        unit: c.unit || 'box',
        weight: c.weight || '0',
        wt_unit: c.wt_unit || 'kg',
        load_from: c.load_from || item.consignor_address || '',
        destination: c.destination || item.consignee_address || '',
        cargo_id: c.cargo_id || ''
      }));
    } else {
      editGoods = [{ description: '', quantity: '1', load_from: '', destination: '' }];
    }

    setFormData({
      booking_id: item.booking_id || '',
      booking_no: item.booking_no || (matchedBooking?.booking_no || ''),
      cargo_id: item.cargo_id || (matchedBooking?.cargo_details?.[0]?.cargo_id || ''),
      consigner_id: item.consigner_id || '',
      consignee_id: item.consignee_id || '',
      car_id: item.car_id || '',
      driver_id: item.driver_id || '',
      consignor_name: item.consignor_name || '',
      consignor_address: item.consignor_address || '',
      consignor_city: item.consignor_city || '',
      consignor_state: item.consignor_state || '',
      consignor_postal_code: item.consignor_postal_code || '',
      consignor_country: item.consignor_country || 'Thailand',
      consignee_name: item.consignee_name || '',
      consignee_address: item.consignee_address || '',
      consignee_city: item.consignee_city || '',
      consignee_state: item.consignee_state || '',
      consignee_postal_code: item.consignee_postal_code || '',
      consignee_country: item.consignee_country || 'Thailand',
      customer_name: item.customer_name || '',
      do_no: item.do_no || '',
      invoice_no: item.invoice_no || (matchedBooking?.cargo_details?.[0]?.inv_no || ''),
      date_of_load: formatInputDate(item.date_of_load) || formatInputDate(matchedBooking?.pickup_date) || getTodayStr(),
      eta: formatInputDate(item.eta) || formatInputDate(matchedBooking?.delivery_date) || getTomorrowStr(),
      truck_number: item.truck_number || '',
      driver_name: item.driver_name || '',
      driver_phone: item.driver_phone || '',
      goods_items: editGoods,
      shipping: item.shipping || '',
      warehouse: item.warehouse || '',
      remark: item.remark || ''
    });
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // When a booking card is clicked in Step 1
  const handleSelectBooking = (bk) => {
    setSelectedBooking(bk);

    const sender = bk.sender_details?.[0] || {};
    const receiver = bk.receiver_details?.[0] || {};

    let resolvedCarId = bk.car_id || '';
    let resolvedDriverId = '';
    let resolvedTruck = '';
    let resolvedDriver = '';
    let resolvedDriverPhone = '';

    if (!resolvedCarId && bk.truck_name) {
      const matchedCar = cars.find((c) => c.car_number === bk.truck_name);
      if (matchedCar) {
        resolvedCarId = matchedCar.car_id;
      }
    }

    if (resolvedCarId) {
      const carObj = cars.find((c) => c.car_id === resolvedCarId);
      if (carObj) {
        resolvedTruck = carObj.car_number || '';
        if (carObj.assigned_driver_id) {
          resolvedDriverId = carObj.assigned_driver_id;
          const dObj = drivers.find((d) => d.driver_id === carObj.assigned_driver_id);
          if (dObj) {
            resolvedDriver = dObj.full_name || '';
            resolvedDriverPhone = dObj.phone || '';
          }
        }
      } else {
        resolvedTruck = bk.truck_name || '';
      }
    } else if (bk.truck_name) {
      resolvedTruck = bk.truck_name;
    }

    // Cargo ID and Invoice number from cargo_details
    const primaryCargo = (Array.isArray(bk.cargo_details) && bk.cargo_details.length > 0)
      ? bk.cargo_details[0]
      : null;
    const resolvedCargoId = primaryCargo?.cargo_id || bk.cargo_id || '';
    const resolvedInvoiceNo = (Array.isArray(bk.cargo_details) && bk.cargo_details.length > 0)
      ? bk.cargo_details.map((c) => c.inv_no).filter(Boolean).join(', ')
      : (primaryCargo?.inv_no || '');

    // Goods items from cargo_details (Sync description = product_name, quantity = quantity; load_from & destination start blank for fresh input)
    let goods = [];
    if (Array.isArray(bk.cargo_details) && bk.cargo_details.length > 0) {
      goods = bk.cargo_details.map((c) => ({
        description: c.product_name || '',
        quantity: String(c.quantity !== null && c.quantity !== undefined ? c.quantity : '1'),
        unit: c.unit || 'box',
        weight: c.weight || '0',
        wt_unit: c.wt_unit || 'kg',
        load_from: c.load_from || '',
        destination: c.destination || '',
        cargo_id: c.cargo_id || ''
      }));
    } else {
      goods = [
        {
          description: bk.product_name || '',
          quantity: String(bk.quantity || '1'),
          unit: 'box',
          weight: '0',
          wt_unit: 'kg',
          load_from: '',
          destination: '',
          cargo_id: ''
        }
      ];
    }

    const rawPickup = bk.pickup_date || sender.pickup_date || sender.sender_date || sender.date || '';
    const rawDelivery = bk.delivery_date || receiver.delivery_date || receiver.receiver_date || receiver.date || '';
    const loadDate = formatInputDate(rawPickup) || getTodayStr();
    const etaDate = formatInputDate(rawDelivery) || getTomorrowStr();

    setFormData((prev) => ({
      ...prev,
      booking_id: bk.booking_id || '',
      booking_no: bk.booking_no || '',
      cargo_id: resolvedCargoId || prev.cargo_id,
      consigner_id: bk.consigner_id || prev.consigner_id,
      consignee_id: bk.consignee_id || prev.consignee_id,
      car_id: resolvedCarId,
      driver_id: resolvedDriverId,
      invoice_no: resolvedInvoiceNo || prev.invoice_no,
      customer_name: bk.customer_name || '',
      consignor_name: sender.company_name || '',
      consignor_address: sender.address_line || '',
      consignor_city: sender.city || '',
      consignor_state: sender.state || '',
      consignor_postal_code: sender.postal_code || '',
      consignor_country: sender.country || 'Thailand',
      consignee_name: receiver.company_name || '',
      consignee_address: receiver.address_line || '',
      consignee_city: receiver.city || '',
      consignee_state: receiver.state || '',
      consignee_postal_code: receiver.postal_code || '',
      consignee_country: receiver.country || 'Thailand',
      truck_number: resolvedTruck,
      driver_name: resolvedDriver,
      driver_phone: resolvedDriverPhone,
      date_of_load: loadDate || prev.date_of_load,
      eta: etaDate || prev.eta,
      goods_items: goods
    }));
  };

  // Goods item handlers (Step 4)
  const handleAddGoodsItem = () => {
    setFormData((prev) => ({
      ...prev,
      goods_items: [
        ...prev.goods_items,
        { description: '', quantity: '1', load_from: '', destination: '' }
      ]
    }));
  };

  const handleRemoveGoodsItem = (index) => {
    if (formData.goods_items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      goods_items: prev.goods_items.filter((_, i) => i !== index)
    }));
  };

  const handleGoodsChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.goods_items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, goods_items: updated };
    });
  };

  // Step 6 Final Submit
  const handleWizardSubmit = async () => {
    setSaving(true);
    try {
      const destinationSummary = formData.goods_items?.[0]?.destination || formData.consignee_address || '';
      const cargoSummary = formData.goods_items?.map(g => `${g.description} (${g.quantity})`).join(', ') || '';

      const payload = {
        ...formData,
        destination: destinationSummary,
        cargo_details: cargoSummary
      };

      if (editingDoId) {
        // Update
        try {
          const res = await fetch(`http://localhost:3000/api/delivery-orders/${editingDoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            await fetchDeliveryOrders();
          }
        } catch {
          // ignore
        }

        const updatedList = deliveryOrders.map((d) =>
          d.do_id === editingDoId || d.delivery_orders_id === editingDoId || d.do_no === editingDoId ? { ...d, ...payload } : d
        );
        setDeliveryOrders(updatedList);
        localStorage.setItem('local_delivery_orders_v2', JSON.stringify(updatedList));
        alert('แก้ไข Delivery Order สำเร็จ');
      } else {
        // Create
        let savedDo = null;
        try {
          const res = await fetch('http://localhost:3000/api/delivery-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            savedDo = data.data || { ...payload, do_id: data.do_id, delivery_orders_id: data.do_id, do_no: data.do_no };
            await fetchDeliveryOrders();
          }
        } catch {
          // ignore
        }

        if (!savedDo) {
          savedDo = {
            do_id: `do-${Date.now()}`,
            delivery_orders_id: `do-${Date.now()}`,
            ...payload
          };
        }

        const updatedList = [savedDo, ...deliveryOrders.filter(d => (d.do_id || d.delivery_orders_id) !== (savedDo.do_id || savedDo.delivery_orders_id))];
        setDeliveryOrders(updatedList);
        localStorage.setItem('local_delivery_orders_v2', JSON.stringify(updatedList));
        alert('สร้างเอกสาร Delivery Order สำเร็จ');
      }

      setViewMode('table');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete DO
  const handleDeleteDo = async (id, doNo) => {
    if (!confirm(`ยืนยันการลบ Delivery Order เลขที่ ${doNo}?`)) return;

    try {
      await fetch(`http://localhost:3000/api/delivery-orders/${id || doNo}`, {
        method: 'DELETE'
      });
      await fetchDeliveryOrders();
    } catch {
      // ignore
    }

    const updatedList = deliveryOrders.filter((d) => d.do_id !== id && d.delivery_orders_id !== id && d.do_no !== doNo);
    setDeliveryOrders(updatedList);
    localStorage.setItem('local_delivery_orders_v2', JSON.stringify(updatedList));
    setOpenMenuId(null);
  };

  // View Summary
  const handleOpenDetails = (item) => {
    setSelectedDoForView(item);
    setViewMode('summary');
  };

  // Filter Bookings in Step 1
  const effectiveBookings = bookingsList.length > 0 ? bookingsList : bookings;
  const filteredBookings = effectiveBookings.filter((b) => {
    const q = bookingSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const no = (b.booking_no || '').toLowerCase();
    const cust = (b.customer_name || '').toLowerCase();
    const truck = (b.truck_name || b.car_number || '').toLowerCase();
    return no.includes(q) || cust.includes(q) || truck.includes(q);
  });

  // Filter Table Orders
  const filteredOrders = deliveryOrders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const no = (order.do_no || '').toLowerCase();
    const cust = (order.customer_name || '').toLowerCase();
    const truck = (order.truck_number || '').toLowerCase();
    const driver = (order.driver_name || '').toLowerCase();
    return no.includes(q) || cust.includes(q) || truck.includes(q) || driver.includes(q);
  });

  // =========================================================================
  // VIEW MODE: 6-STEP WIZARD
  // =========================================================================
  if (viewMode === 'wizard') {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to delivery orders</span>
          </button>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '24px', textAlign: 'left' }}>
          {editingDoId ? 'Edit Delivery Order' : 'New Delivery Order'}
        </h2>

        {/* Main Card Panel */}
        <div className="dashboard-card-panel" style={{ padding: '32px' }}>
          {/* Stepper Header (6 Steps) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '36px',
              overflowX: 'auto',
              paddingBottom: '12px'
            }}
          >
            {stepsList.map((step, idx) => {
              const isCompleted = step.num < currentStep;
              const isActive = step.num === currentStep;

              return (
                <div
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    minWidth: '150px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Circle */}
                    <div
                      style={{
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
                      }}
                    >
                      {isCompleted ? <Check size={18} /> : step.num}
                    </div>

                    {/* Label */}
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isActive ? '700' : '500',
                        color: isActive ? '#0f172a' : isCompleted ? '#334155' : '#94a3b8',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {idx < stepsList.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: '2px',
                        backgroundColor: step.num < currentStep ? '#0284c7' : '#e2e8f0',
                        margin: '0 8px',
                        minWidth: '16px'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ========================================== */}
          {/* STEP 1: SELECT BOOKING */}
          {/* ========================================== */}
          {currentStep === 1 && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
                Select Booking
              </h3>

              {/* Search Box */}
              <div className="panel-search-bar" style={{ maxWidth: '100%', marginBottom: '20px' }}>
                <Search size={16} className="panel-search-icon" />
                <input
                  type="text"
                  placeholder="Search by booking #, customer, truck, driver..."
                  className="panel-search-input"
                  value={bookingSearchQuery}
                  onChange={(e) => setBookingSearchQuery(e.target.value)}
                />
              </div>

              {/* Booking Cards Grid */}
              {filteredBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                  <Inbox size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>ไม่พบบุคกิ้งในระบบ (สามารถกรอกข้อมูลเองในขั้นตอนถัดไปได้)</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {filteredBookings.map((bk) => {
                    const isSelected = selectedBooking?.booking_id === bk.booking_id || formData.booking_id === bk.booking_id;
                    const origin = bk.sender_details?.[0]?.city || bk.sender_details?.[0]?.company_name || 'Origin';
                    const destination = bk.receiver_details?.[0]?.city || bk.receiver_details?.[0]?.company_name || 'Destination';
                    const displayDate = bk.pickup_date ? formatDate(bk.pickup_date) : '-';

                    return (
                      <div
                        key={bk.booking_id}
                        onClick={() => handleSelectBooking(bk)}
                        style={{
                          backgroundColor: '#ffffff',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '18px 20px',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0284c7' }}>
                            {bk.booking_no}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}
                          >
                            • {bk.status || 'Assigned'}
                          </span>
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                          {bk.customer_name || 'SCG'}
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#94a3b8" />
                          <span>{origin} → {destination}</span>
                        </div>

                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          {displayDate}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 2: PARTIES */}
          {/* ========================================== */}
          {currentStep === 2 && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Consignor / ผู้ส่งสินค้า */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Consignor / ผู้ส่งสินค้า
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Company name..."
                      value={formData.consignor_name}
                      onChange={(e) => setFormData({ ...formData, consignor_name: e.target.value })}
                    />
                  </div>

                  {/* Split Address matching Booking UI */}
                  <div className="form-group">
                    <label className="form-label">Address Line</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Street address / Location"
                      value={formData.consignor_address}
                      onChange={(e) => setFormData({ ...formData, consignor_address: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="City"
                        value={formData.consignor_city}
                        onChange={(e) => setFormData({ ...formData, consignor_city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State / Province</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="State / Province"
                        value={formData.consignor_state}
                        onChange={(e) => setFormData({ ...formData, consignor_state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Postal Code</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Postal code"
                        value={formData.consignor_postal_code}
                        onChange={(e) => setFormData({ ...formData, consignor_postal_code: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Country"
                        value={formData.consignor_country}
                        onChange={(e) => setFormData({ ...formData, consignor_country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Consignee / ผู้รับสินค้า */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Consignee / ผู้รับสินค้า
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Company name..."
                      value={formData.consignee_name}
                      onChange={(e) => setFormData({ ...formData, consignee_name: e.target.value })}
                    />
                  </div>

                  {/* Split Address matching Booking UI */}
                  <div className="form-group">
                    <label className="form-label">Address Line</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Street address / Location"
                      value={formData.consignee_address}
                      onChange={(e) => setFormData({ ...formData, consignee_address: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="City"
                        value={formData.consignee_city}
                        onChange={(e) => setFormData({ ...formData, consignee_city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State / Province</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="State / Province"
                        value={formData.consignee_state}
                        onChange={(e) => setFormData({ ...formData, consignee_state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Postal Code</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Postal code"
                        value={formData.consignee_postal_code}
                        onChange={(e) => setFormData({ ...formData, consignee_postal_code: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Country"
                        value={formData.consignee_country}
                        onChange={(e) => setFormData({ ...formData, consignee_country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer / ลูกค้า */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                  Customer / ลูกค้า
                </h4>
                <div className="form-group" style={{ maxWidth: '480px' }}>
                  <label className="form-label">
                    Customer Name <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Customer Name..."
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 3: TRANSPORT */}
          {/* ========================================== */}
          {currentStep === 3 && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Document Info */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Document Info
                  </h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">D.O. No.</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.do_no}
                        onChange={(e) => setFormData({ ...formData, do_no: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Invoice No. / เลขที่</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="45484466"
                        value={formData.invoice_no}
                        onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date of Load</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Date of Load (ดึงตาม Booking)"
                        value={formatDate(formData.date_of_load)}
                        readOnly
                        style={{ backgroundColor: '#f8fafc', color: '#1e293b', cursor: 'default' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ETA</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ETA (ดึงตาม Booking)"
                        value={formatDate(formData.eta)}
                        readOnly
                        style={{ backgroundColor: '#f8fafc', color: '#1e293b', cursor: 'default' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Transport Assignment (User requirement: plain inputs pulled from booking, not dropdowns) */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Transport Assignment
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Truck No. / ทะเบียนรถ</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ทะเบียนรถ (ดึงตาม Booking)"
                      value={formData.truck_number || ''}
                      readOnly
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Driver Name / พนักงานขับรถ</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ชื่อคนขับ (ดึงตาม Booking)"
                      value={formData.driver_name || ''}
                      readOnly
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Driver Phone / เบอร์โทรคนขับ</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เบอร์โทรคนขับ (ดึงตาม Booking)"
                      value={formData.driver_phone || ''}
                      readOnly
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 4: GOODS */}
          {/* ========================================== */}
          {currentStep === 4 && (
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Goods / Description of Goods
                  </h4>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddGoodsItem}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}
                  >
                    <Plus size={14} />
                    <span>+ Add Item</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {formData.goods_items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1fr 2fr 2fr auto',
                        gap: '12px',
                        alignItems: 'flex-end',
                        backgroundColor: '#f8fafc',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Description of Goods</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Steel Pipes"
                          value={item.description || ''}
                          onChange={(e) => handleGoodsChange(idx, 'description', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Quantity</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="10"
                          value={item.quantity || ''}
                          onChange={(e) => handleGoodsChange(idx, 'quantity', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Load From</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Load From / ต้นทาง"
                          value={item.load_from || ''}
                          onChange={(e) => handleGoodsChange(idx, 'load_from', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Destination</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Destination / ปลายทาง"
                          value={item.destination || ''}
                          onChange={(e) => handleGoodsChange(idx, 'destination', e.target.value)}
                        />
                      </div>

                      {formData.goods_items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGoodsItem(idx)}
                          style={{
                            background: '#fee2e2',
                            border: 'none',
                            color: '#ef4444',
                            borderRadius: '6px',
                            padding: '9px 10px',
                            cursor: 'pointer'
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 5: SHIPPING & REMARK */}
          {/* User requirement: shipping & warehouse in same row, remark below formatted nicely */}
          {/* ========================================== */}
          {currentStep === 5 && (
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}
              >
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Shipping & Warehouse Details
                </h4>

                {/* Shipping & Warehouse in the same row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Shipping</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น KLM, สายเรือ / ขนส่ง"
                      value={formData.shipping}
                      onChange={(e) => setFormData({ ...formData, shipping: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Warehouse</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น BKK, คลังสินค้า"
                      value={formData.warehouse}
                      onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    />
                  </div>
                </div>

                {/* Remark below on full width formatted nicely */}
                <div className="form-group" style={{ marginTop: '4px' }}>
                  <label className="form-label">Remark / หมายเหตุ</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="ข้อความหมายเหตุ เช่น be careful, ระวังแตก..."
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STEP 6: REVIEW */}
          {/* ========================================== */}
          {currentStep === 6 && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                Review & Confirm
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Header Info Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>BOOKING & CUSTOMER</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0284c7', marginTop: '4px' }}>
                      {formData.booking_no || 'Manual Entry'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#1e293b', marginTop: '2px' }}>
                      {formData.customer_name || '-'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>DOCUMENT INFO</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                      D.O. No: {formData.do_no}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      Invoice No: {formData.invoice_no || '-'}
                    </div>
                  </div>
                </div>

                {/* 2. Parties */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                      CONSIGNOR (ผู้ส่ง)
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{formData.consignor_name || '-'}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      {[formData.consignor_address, formData.consignor_city, formData.consignor_state, formData.consignor_postal_code, formData.consignor_country].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                      CONSIGNEE (ผู้รับ)
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{formData.consignee_name || '-'}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      {[formData.consignee_address, formData.consignee_city, formData.consignee_state, formData.consignee_postal_code, formData.consignee_country].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>
                </div>

                {/* 3. Transport & Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>SCHEDULE</div>
                    <div style={{ fontSize: '14px', color: '#166534', marginTop: '4px' }}>
                      <strong>Date of Load:</strong> {formatDate(formData.date_of_load)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#166534', marginTop: '2px' }}>
                      <strong>ETA:</strong> {formatDate(formData.eta)}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>TRANSPORT ASSIGNMENT</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                      Truck: {formData.truck_number || '-'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#0369a1', marginTop: '2px' }}>
                      Driver: {formData.driver_name || '-'} {formData.driver_phone ? `(${formData.driver_phone})` : ''}
                    </div>
                  </div>
                </div>

                {/* 4. Goods items */}
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>GOODS DESCRIPTION</div>
                  {formData.goods_items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < formData.goods_items.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '13px' }}>
                      <div>
                        <strong>#{i + 1} {item.description || 'Goods'}</strong> ({item.quantity || 1} units)
                      </div>
                      <div style={{ color: '#64748b' }}>
                        {item.load_from || '-'} → {item.destination || '-'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 5. Shipping, Warehouse & Remark */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Shipping: </span>
                      <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{formData.shipping || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Warehouse: </span>
                      <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>{formData.warehouse || '-'}</span>
                    </div>
                  </div>
                  {formData.remark && (
                    <div style={{ fontSize: '13px', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                      <strong>Remark:</strong> {formData.remark}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* WIZARD FOOTER NAVIGATION */}
          {/* ========================================== */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '24px',
              borderTop: '1px solid #e2e8f0',
              marginTop: '32px'
            }}
          >
            <div>
              <button
                type="button"
                className="btn-secondary"
                disabled={currentStep === 1}
                onClick={() => {
                  if (currentStep > 1) setCurrentStep((prev) => prev - 1);
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
              {currentStep < 6 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
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
                  <span>{saving ? 'Saving...' : editingDoId ? 'Save Changes' : 'Create D.O.'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: SUMMARY / DETAILS
  // =========================================================================
  if (viewMode === 'summary' && selectedDoForView) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to delivery orders</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0, textAlign: 'left' }}>
            Delivery Order: {selectedDoForView.do_no}
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              <span>Print D.O.</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleOpenEditWizard(selectedDoForView)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Pencil size={16} />
              <span>Edit Delivery Order</span>
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="dashboard-card-panel" style={{ padding: '32px', textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>CUSTOMER</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {selectedDoForView.customer_name || '-'}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TRUCK & DRIVER</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {selectedDoForView.truck_number || '-'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {selectedDoForView.driver_name || '-'} {selectedDoForView.driver_phone ? `(${selectedDoForView.driver_phone})` : ''}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>DATES</div>
              <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                <strong>Load:</strong> {formatDate(selectedDoForView.date_of_load)}
              </div>
              <div style={{ fontSize: '14px', color: '#334155', marginTop: '2px' }}>
                <strong>ETA:</strong> {formatDate(selectedDoForView.eta)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>CONSIGNOR</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedDoForView.consignor_name || '-'}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {[selectedDoForView.consignor_address, selectedDoForView.consignor_city, selectedDoForView.consignor_state, selectedDoForView.consignor_postal_code, selectedDoForView.consignor_country].filter(Boolean).join(', ') || '-'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>CONSIGNEE</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedDoForView.consignee_name || '-'}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {[selectedDoForView.consignee_address, selectedDoForView.consignee_city, selectedDoForView.consignee_state, selectedDoForView.consignee_postal_code, selectedDoForView.consignee_country].filter(Boolean).join(', ') || '-'}
              </div>
            </div>
          </div>

          {selectedDoForView.remark && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>REMARK</div>
              <div style={{ fontSize: '14px', color: '#1e293b', marginTop: '4px' }}>
                {selectedDoForView.remark}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: MAIN TABLE (DEFAULT)
  // =========================================================================
  return (
    <div>
      {/* 1. Breadcrumb */}
      <div className="dashboard-breadcrumb">
        <span>Main</span>
        <span className="dashboard-breadcrumb-separator">&gt;</span>
        <span style={{ color: '#64748b' }}>Delivery Order</span>
      </div>

      {/* 2. Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>Delivery Order (DO)</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>Generate delivery Orders from bookings</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateWizard}>
          <Plus size={16} />
          <span>Create D.O.</span>
        </button>
      </div>

      {/* 3. Card table container */}
      <div className="dashboard-card-panel" style={{ padding: '24px 0 0 0' }}>
        {/* Search bar inside the panel */}
        <div style={{ padding: '0 24px' }}>
          <div className="panel-search-bar">
            <Search size={16} className="panel-search-icon" />
            <input
              type="text"
              placeholder="Search delivery orders..."
              className="panel-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clean UI table */}
        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table className="custom-clean-table">
            <thead>
              <tr>
                <th style={{ width: '20%', paddingLeft: '24px', whiteSpace: 'nowrap' }}>D.O. #</th>
                <th style={{ width: '26%', whiteSpace: 'nowrap' }}>Customer</th>
                <th style={{ width: '22%', whiteSpace: 'nowrap' }}>Truck</th>
                <th style={{ width: '14%', whiteSpace: 'nowrap' }}>Date of Load</th>
                <th style={{ width: '10%', whiteSpace: 'nowrap' }}>ETA</th>
                <th style={{ width: '8%', textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Inbox size={40} style={{ opacity: 0.4 }} />
                      <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#94a3b8' }}>
                        ยังไม่มีรายการ Delivery Order (คลิก 'Create D.O.' เพื่อสร้างเอกสารจาก Booking)
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemKey = order.do_id || order.do_no;
                  const isMenuOpen = openMenuId === itemKey;

                  return (
                    <tr key={itemKey}>
                      {/* D.O. # Link */}
                      <td style={{ paddingLeft: '24px' }}>
                        <button
                          onClick={() => handleOpenDetails(order)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#0284c7',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                        >
                          {order.do_no}
                        </button>
                      </td>

                      {/* Customer */}
                      <td style={{ color: '#1e293b', fontWeight: 500 }}>
                        {order.customer_name || '-'}
                      </td>

                      {/* Truck (Plate on top, Driver underneath) */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{order.truck_number || '-'}</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{order.driver_name || '-'}</span>
                        </div>
                      </td>

                      {/* Date of Load */}
                      <td style={{ color: '#475569' }}>
                        {formatDate(order.date_of_load)}
                      </td>

                      {/* ETA */}
                      <td style={{ color: '#475569' }}>
                        {formatDate(order.eta)}
                      </td>

                      {/* Actions Menu (3 dots) */}
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div className="action-menu-container">
                          <button
                            className="action-dots-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : itemKey);
                            }}
                            title="Actions"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {isMenuOpen && (
                            <div className="action-dropdown-menu">
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenDetails(order);
                                }}
                              >
                                <FileText size={16} className="menu-icon" />
                                <span>View Details</span>
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenEditWizard(order);
                                }}
                              >
                                <Edit size={16} className="menu-icon" />
                                <span>Edit</span>
                              </button>
                              <button
                                className="dropdown-item delete-item"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteDo(order.do_id, order.do_no);
                                }}
                              >
                                <Trash2 size={16} className="menu-icon" />
                                <span>Delete</span>
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
    </div>
  );
}
