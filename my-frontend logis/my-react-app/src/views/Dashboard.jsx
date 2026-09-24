import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  MapPin,
  Truck,
  User,
  Package,
  FileText,
  ArrowRight,
  Plus
} from 'lucide-react';
import './Dashboard.css';

function Dashboard({
  bookings = [],
  deliveryOrders = [],
  invoices = [],
  receipts = [],
  documents = [],
  documentItems = [],
  customers = [],
  cars = [],
  drivers = [],
  setActiveTab
}) {
  // Local states with fallback API fetch if props were empty initially
  const [localDOs, setLocalDOs] = useState(deliveryOrders);
  const [localInvoices, setLocalInvoices] = useState(invoices);
  const [localReceipts, setLocalReceipts] = useState(receipts);

  useEffect(() => {
    if (Array.isArray(deliveryOrders) && deliveryOrders.length > 0) setLocalDOs(deliveryOrders);
  }, [deliveryOrders]);

  useEffect(() => {
    if (Array.isArray(invoices) && invoices.length > 0) setLocalInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    if (Array.isArray(receipts) && receipts.length > 0) setLocalReceipts(receipts);
  }, [receipts]);

  useEffect(() => {
    if (!deliveryOrders || deliveryOrders.length === 0) {
      fetch('http://localhost:3000/api/delivery-orders')
        .then(r => r.ok ? r.json() : [])
        .then(data => setLocalDOs(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
    if (!invoices || invoices.length === 0) {
      fetch('http://localhost:3000/api/invoices')
        .then(r => r.ok ? r.json() : [])
        .then(data => setLocalInvoices(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
    if (!receipts || receipts.length === 0) {
      fetch('http://localhost:3000/api/receipts')
        .then(r => r.ok ? r.json() : [])
        .then(data => setLocalReceipts(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, []);

  // ----------------------------------------------------
  // DATE HELPERS & CURRENT STATS
  // ----------------------------------------------------
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 to 11

  // Format YYYY-MM-DD
  const formatYMD = (d) => {
    if (!d || isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatYMD(today);

  // Helper to extract booking's primary date (YYYY-MM-DD)
  const getBookingDateStr = (b) => {
    const dateVal = b.pickup_date || b.delivery_date || b.created_at;
    if (!dateVal) return null;
    if (typeof dateVal === 'string' && dateVal.length >= 10) {
      const sub = dateVal.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(sub)) return sub;
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : formatYMD(d);
  };

  // 1. Booking ในเดือนนี้
  const bookingsThisMonth = useMemo(() => {
    return bookings.filter(b => {
      const dStr = getBookingDateStr(b);
      if (!dStr) return false;
      const [y, m] = dStr.split('-').map(Number);
      return y === currentYear && m === (currentMonth + 1);
    });
  }, [bookings, currentYear, currentMonth]);

  const totalBookingsThisMonth = bookingsThisMonth.length;

  // ----------------------------------------------------
  // LOGISTICS WORKFLOW LIFECYCLE (DO -> Invoice -> Receipt)
  // - "งานที่กำลังทำ": เริ่มนับตอนมีใบ DO จนถึงใบแจ้งหนี้ (ยังไม่ออกใบเสร็จ)
  // - "งานที่เสร็จแล้ว": เมื่อออกใบเสร็จรับเงินแล้ว สรุปเป็นงานที่เสร็จแล้วทันที
  // ----------------------------------------------------
  const bookingLifecycleMap = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const bId = String(b.booking_id || '');
      const bNo = String(b.booking_no || '');

      // Check DO: direct booking_id or matching do
      const hasDO = localDOs.some(d => 
        (d.booking_id && String(d.booking_id) === bId) ||
        (d.booking_no && bNo && String(d.booking_no) === bNo)
      );

      // Check Invoice: direct booking_id or booking_no
      const invList = localInvoices.filter(i => 
        (i.booking_id && String(i.booking_id) === bId) ||
        (i.booking_no && bNo && String(i.booking_no) === bNo)
      );
      const hasInvoice = invList.length > 0;

      // Check Receipt: from any matched invoice
      const hasReceipt = invList.some(inv => 
        localReceipts.some(r => 
          (r.invoice_id && inv.invoice_id && String(r.invoice_id) === String(inv.invoice_id)) ||
          (r.invoice_no && inv.invoice_no && String(r.invoice_no).trim().toLowerCase() === String(inv.invoice_no).trim().toLowerCase())
        )
      );

      if (hasReceipt) {
        map[bId] = 'completed';
      } else if (hasDO || hasInvoice) {
        map[bId] = 'in_progress';
      } else {
        map[bId] = 'new';
      }
    });
    return map;
  }, [bookings, localDOs, localInvoices, localReceipts]);

  // 2. งานที่กำลังทำ (เริ่มทำใบ DO จนถึงใบแจ้งหนี้ แต่ยังไม่ออกใบเสร็จ)
  const inProgressJobs = useMemo(() => {
    return bookings.filter(b => bookingLifecycleMap[String(b.booking_id)] === 'in_progress');
  }, [bookings, bookingLifecycleMap]);

  // 3. งานที่เสร็จแล้ว (เมื่อออกใบเสร็จรับเงินแล้ว สรุปเป็นงานที่เสร็จแล้ว)
  const completedJobs = useMemo(() => {
    const fromBookings = bookings.filter(b => bookingLifecycleMap[String(b.booking_id)] === 'completed');
    // หากมีใบเสร็จรับเงินในระบบ แต่ booking เก่าอาจไม่ได้เชื่อมครบ ให้ยึดจำนวนงานที่ออกใบเสร็จแล้วเป็นอย่างน้อย
    return fromBookings.length > 0 ? fromBookings : localReceipts;
  }, [bookings, bookingLifecycleMap, localReceipts]);

  // 4. ยอดรวมในเดือนนี้ (ดึงข้อมูลจากใบเสร็จรับเงินที่ทำในแต่ละเดือน)
  const monthlyRevenue = useMemo(() => {
    return localReceipts.filter(r => {
      const dVal = r.payment_date || r.created_at;
      if (!dVal) return false;
      const dt = new Date(dVal);
      if (isNaN(dt.getTime())) return false;
      return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
    }).reduce((sum, r) => {
      const amt = Number(r.amount_paid || r.total_amount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [localReceipts, currentYear, currentMonth]);

  // ----------------------------------------------------
  // INTERACTIVE CALENDAR STATE & LOGIC
  // ----------------------------------------------------
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD' or null
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState(null);

  const viewYear = calendarDate.getFullYear();
  const viewMonth = calendarDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthTitle = `${monthNames[viewMonth]} ${viewYear}`;

  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedDate(formatYMD(now));
  };

  // Map bookings by date string
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const dStr = getBookingDateStr(b);
      if (dStr) {
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(b);
      }
    });
    return map;
  }, [bookings]);

  // Calendar cells generation
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        isMuted: true,
        dateStr: null
      });
    }

    // Days in current viewing month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = bookingsByDate[dStr] ? bookingsByDate[dStr].length : 0;
      cells.push({
        day: d,
        isMuted: false,
        dateStr: dStr,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
        hasBookings: count > 0,
        count
      });
    }

    // Leading days from next month to complete weeks
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        isMuted: true,
        dateStr: null
      });
    }

    return cells;
  }, [viewYear, viewMonth, todayStr, selectedDate, bookingsByDate]);

  // Filtered bookings to show in the table
  const displayedBookings = useMemo(() => {
    if (selectedDate) {
      return bookings.filter(b => getBookingDateStr(b) === selectedDate);
    }
    // If no specific date selected, show bookings in this calendar month
    const monthFiltered = bookings.filter(b => {
      const dStr = getBookingDateStr(b);
      if (!dStr) return false;
      const [y, m] = dStr.split('-').map(Number);
      return y === viewYear && m === (viewMonth + 1);
    });
    // Fallback: If current calendar month has none, show all recent bookings
    return monthFiltered.length > 0 ? monthFiltered : bookings;
  }, [bookings, selectedDate, viewYear, viewMonth]);


  return (
    <div>

      {/* Header Title */}
      <h2 className="dashboard-view-title">Dashboard</h2>
      <p className="dashboard-view-subtitle">ภาพรวมการดำเนินงานขนส่งและการจองรถ (Logistics Overview)</p>

      {/* Stat Cards Grid (4 Cards from user requirement) */}
      <div className="dashboard-stats-grid">
        {/* 1. Booking ในเดือนนี้ */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-left">
            <div className="dashboard-stat-icon-wrapper" style={{ backgroundColor: '#eff6ff' }}>
              <ClipboardList size={20} color="#2563eb" />
            </div>
            <div>
              <span className="dashboard-stat-value">{totalBookingsThisMonth}</span>
              <div className="dashboard-stat-label">Booking ในเดือนนี้</div>
            </div>
          </div>
          <div className="dashboard-stat-right">
            <span className="dashboard-stat-trend up">
              <TrendingUp size={14} />
              <span>{bookings.length} รวม</span>
            </span>
          </div>
        </div>

        {/* 2. งานที่กำลังทำ */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-left">
            <div className="dashboard-stat-icon-wrapper" style={{ backgroundColor: '#fffbeb' }}>
              <Clock size={20} color="#d97706" />
            </div>
            <div>
              <span className="dashboard-stat-value">{inProgressJobs.length}</span>
              <div className="dashboard-stat-label">งานที่กำลังทำ</div>
            </div>
          </div>
          <div className="dashboard-stat-right">
            <span className="dashboard-stat-trend up" style={{ color: '#d97706', backgroundColor: '#fef3c7' }}>
              Active
            </span>
          </div>
        </div>

        {/* 3. งานที่เสร็จแล้ว */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-left">
            <div className="dashboard-stat-icon-wrapper" style={{ backgroundColor: '#f0fdf4' }}>
              <CheckCircle2 size={20} color="#16a34a" />
            </div>
            <div>
              <span className="dashboard-stat-value">{completedJobs.length}</span>
              <div className="dashboard-stat-label">งานที่เสร็จแล้ว</div>
            </div>
          </div>
          <div className="dashboard-stat-right">
            <span className="dashboard-stat-trend up">
              <TrendingUp size={14} />
              <span>Done</span>
            </span>
          </div>
        </div>

        {/* 4. ยอดรวมในเดือนนี้ */}
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-left">
            <div className="dashboard-stat-icon-wrapper" style={{ backgroundColor: '#f0fdfa' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>฿</span>
            </div>
            <div>
              <span className="dashboard-stat-value">฿{Number(monthlyRevenue).toLocaleString()}</span>
              <div className="dashboard-stat-label">ยอดรวมในเดือนนี้</div>
            </div>
          </div>
          <div className="dashboard-stat-right">
            <span className="dashboard-stat-trend up">
              <span>THB</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Calendar + Booking Schedule Table */}
      <div className="dashboard-main-grid">
        {/* LEFT: Calendar Panel */}
        <div className="dashboard-card-panel">
          <div className="dashboard-card-header" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#0284c7" />
              <h3 className="dashboard-card-title">ปฏิทินงาน (Schedule)</h3>
            </div>
          </div>
          
          <div className="calendar-container">
            {/* Header Navigation: Prev, Month/Year, Next, Today */}
            <div className="calendar-header-nav">
              <span className="calendar-month-title">{monthTitle}</span>
              <div className="calendar-nav-buttons">
                <button 
                  className="calendar-nav-btn" 
                  onClick={handlePrevMonth}
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  className="calendar-nav-btn calendar-today-btn" 
                  onClick={handleToday}
                  title="กลับไปวันนี้"
                >
                  Today
                </button>
                <button 
                  className="calendar-nav-btn" 
                  onClick={handleNextMonth}
                  title="เดือนถัดไป"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="calendar-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                <div key={idx} className="calendar-day-label">{label}</div>
              ))}
              
              {/* Day Cells */}
              {calendarCells.map((item, idx) => {
                let cellClass = 'calendar-day-cell';
                if (item.isMuted) cellClass += ' muted';
                if (item.isToday) cellClass += ' today';
                if (item.isSelected) cellClass += ' selected';
                if (item.hasBookings) cellClass += ' has-bookings';

                return (
                  <div key={idx} className="calendar-day-cell-wrapper">
                    <div 
                      className={cellClass}
                      onClick={() => {
                        if (!item.isMuted && item.dateStr) {
                          setSelectedDate(prev => prev === item.dateStr ? null : item.dateStr);
                        }
                      }}
                      title={item.dateStr ? `${item.dateStr}${item.hasBookings ? ` (${item.count} งาน)` : ''}` : ''}
                    >
                      <span>{item.day}</span>
                      {item.hasBookings && <span className="calendar-event-dot" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Summary & Filter Clear */}
          <div className="calendar-selected-summary">
            <div className="calendar-selected-info">
              <span className="calendar-selected-label">วันที่กำลังเลือกดู:</span>
              <span className="calendar-selected-value">
                {selectedDate ? (
                  <>
                    📅 {selectedDate} 
                    <span style={{ fontSize: '0.8rem', color: '#0284c7', marginLeft: '6px' }}>
                      ({bookingsByDate[selectedDate]?.length || 0} งาน)
                    </span>
                  </>
                ) : (
                  `ทั้งเดือน ${monthTitle}`
                )}
              </span>
            </div>
            {selectedDate && (
              <button 
                type="button" 
                className="calendar-clear-btn"
                onClick={() => setSelectedDate(null)}
              >
                ดูทั้งเดือน
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Booking Schedule Table */}
        <div className="dashboard-table-card">
          <div className="dashboard-table-header">
            <div className="table-header-left">
              <ClipboardList size={20} color="#0284c7" />
              <h3 className="dashboard-card-title">รายการ Booking</h3>
              <span className="table-header-badge">
                {selectedDate ? `วันที่ ${selectedDate}` : `เดือน ${monthTitle}`}
                {' · '}
                {displayedBookings.length} รายการ
              </span>
            </div>

            <div className="table-header-actions">
              {setActiveTab && (
                <button 
                  className="btn-view-all-link"
                  onClick={() => setActiveTab('booking')}
                  title="ไปที่ระบบจัดการ Booking เต็ม"
                >
                  <span>จัดการ Booking ทั้งหมด</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="dashboard-table-wrap">
            {displayedBookings.length > 0 ? (
              <table className="dash-schedule-table">
                <thead>
                  <tr>
                    <th>เลข Booking</th>
                    <th>ลูกค้า</th>
                    <th>เส้นทาง (ต้นทาง ➔ ปลายทาง)</th>
                    <th>รถ / ทะเบียน</th>
                    <th>วันที่</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBookings.map((b) => {
                    const origin = b.consigner_city || b.consigner_province || b.consigner_name || 'ต้นทาง';
                    const dest = b.consignee_city || b.consignee_province || b.consignee_name || 'ปลายทาง';
                    const truckDisplay = b.car_number || b.truck_name || '—';
                    const bookingDate = b.pickup_date ? String(b.pickup_date).slice(0, 10) : (b.created_at ? String(b.created_at).slice(0, 10) : '—');

                    return (
                      <tr key={b.booking_id} onClick={() => setSelectedBookingForDetail(b)}>
                        <td>
                          <span className="dash-booking-no">
                            {b.booking_no || b.booking_id}
                          </span>
                        </td>
                        <td>
                          <span className="dash-customer-name">
                            {b.customer_name || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="dash-route-text">
                            <span>{origin}</span>
                            <ArrowRight size={13} className="dash-route-arrow" />
                            <span>{dest}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                            {truckDisplay}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                            {bookingDate}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="dash-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookingForDetail(b);
                            }}
                            title="ดูรายละเอียด Booking"
                          >
                            <Eye size={14} />
                            <span>ดู</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="dash-table-empty">
                <div className="dash-table-empty-icon">
                  <ClipboardList size={26} />
                </div>
                <div className="dash-table-empty-text">ไม่มีรายการ Booking ในช่วงเวลานี้</div>
                <div className="dash-table-empty-subtext">
                  {selectedDate 
                    ? `ไม่มีงานในวันที่ ${selectedDate} ลองคลิกเลือกวันอื่นหรือดูงานทั้งเดือน` 
                    : 'ยังไม่มีประวัติการจองรถในเดือนนี้ สามารถกดสร้าง Booking ใหม่ได้ทันที'}
                </div>
                {setActiveTab && (
                  <button 
                    type="button" 
                    className="btn-primary-action"
                    style={{ marginTop: '8px' }}
                    onClick={() => setActiveTab('booking')}
                  >
                    <Plus size={16} />
                    <span>สร้าง Booking ใหม่</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          BOOKING DETAILS POPUP MODAL (เมื่อกดดูรายละเอียด)
          ======================================================== */}
      {selectedBookingForDetail && (
        <div className="dash-modal-overlay" onClick={() => setSelectedBookingForDetail(null)}>
          <div className="dash-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="dash-modal-header">
              <div className="dash-modal-header-title">
                <ClipboardList size={22} color="#0284c7" />
                <span className="dash-modal-booking-title">
                  {selectedBookingForDetail.booking_no || selectedBookingForDetail.booking_id}
                </span>
              </div>
              <button 
                type="button" 
                className="dash-modal-close-btn"
                onClick={() => setSelectedBookingForDetail(null)}
                title="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="dash-modal-body">
              {/* Customer & General Info */}
              <div className="dash-detail-section">
                <div className="dash-section-title">
                  <User size={15} color="#0284c7" />
                  <span>ข้อมูลลูกค้าและการจอง</span>
                </div>
                <div className="dash-info-grid">
                  <div className="dash-info-item">
                    <span className="dash-info-label">ลูกค้า:</span>
                    <span className="dash-info-value">{selectedBookingForDetail.customer_name || '—'}</span>
                  </div>
                  <div className="dash-info-item">
                    <span className="dash-info-label">วันที่เข้ารับของ (Pickup):</span>
                    <span className="dash-info-value">{selectedBookingForDetail.pickup_date ? String(selectedBookingForDetail.pickup_date).slice(0, 10) : '—'}</span>
                  </div>
                  <div className="dash-info-item">
                    <span className="dash-info-label">วันที่ส่งมอบ (Delivery):</span>
                    <span className="dash-info-value">{selectedBookingForDetail.delivery_date ? String(selectedBookingForDetail.delivery_date).slice(0, 10) : '—'}</span>
                  </div>
                  <div className="dash-info-item">
                    <span className="dash-info-label">ใบเสนอราคาอ้างอิง:</span>
                    <span className="dash-info-value">
                      {selectedBookingForDetail.quotation_no || selectedBookingForDetail.quotation_id || 'ไม่มี (กำหนดราคาเอง)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Truck & Transport Info */}
              <div className="dash-detail-section">
                <div className="dash-section-title">
                  <Truck size={15} color="#0284c7" />
                  <span>ยานพาหนะและการจัดส่ง</span>
                </div>
                <div className="dash-info-grid">
                  <div className="dash-info-item">
                    <span className="dash-info-label">ทะเบียนรถ:</span>
                    <span className="dash-info-value">{selectedBookingForDetail.car_number || selectedBookingForDetail.truck_name || 'ยังไม่กำหนด'}</span>
                  </div>
                  <div className="dash-info-item">
                    <span className="dash-info-label">ประเภทรถ:</span>
                    <span className="dash-info-value">{selectedBookingForDetail.car_type || '—'}</span>
                  </div>
                  <div className="dash-info-item">
                    <span className="dash-info-label">ประเภทบริการ:</span>
                    <span className="dash-info-value">{selectedBookingForDetail.service_name || selectedBookingForDetail.service_typename || 'บริการขนส่งมาตรฐาน'}</span>
                  </div>
                  <div className="dash-info-item">
                    <span className="dash-info-label">หมายเหตุ:</span>
                    <span className="dash-info-value">{selectedBookingForDetail.remark || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Route: Consigner & Consignee */}
              <div className="dash-detail-section">
                <div className="dash-section-title">
                  <MapPin size={15} color="#0284c7" />
                  <span>เส้นทางการขนส่ง</span>
                </div>
                <div className="dash-route-card-grid">
                  <div className="dash-route-box">
                    <span className="dash-route-box-title">ต้นทาง (ผู้ส่ง / Sender)</span>
                    <span className="dash-route-box-company">{selectedBookingForDetail.consigner_name || 'ไม่ระบุผู้ส่ง'}</span>
                    <span className="dash-route-box-addr">
                      {[
                        selectedBookingForDetail.consigner_address,
                        selectedBookingForDetail.consigner_city,
                        selectedBookingForDetail.consigner_province
                      ].filter(Boolean).join(', ') || 'ไม่มีที่อยู่ต้นทาง'}
                    </span>
                  </div>
                  <div className="dash-route-box">
                    <span className="dash-route-box-title">ปลายทาง (ผู้รับ / Receiver)</span>
                    <span className="dash-route-box-company">{selectedBookingForDetail.consignee_name || 'ไม่ระบุผู้รับ'}</span>
                    <span className="dash-route-box-addr">
                      {[
                        selectedBookingForDetail.consignee_address,
                        selectedBookingForDetail.consignee_city,
                        selectedBookingForDetail.consignee_province
                      ].filter(Boolean).join(', ') || 'ไม่มีที่อยู่ปลายทาง'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cargo Details */}
              {Array.isArray(selectedBookingForDetail.cargo_details) && selectedBookingForDetail.cargo_details.length > 0 && (
                <div className="dash-detail-section">
                  <div className="dash-section-title">
                    <Package size={15} color="#0284c7" />
                    <span>รายการสินค้า ({selectedBookingForDetail.cargo_details.length} รายการ)</span>
                  </div>
                  <div className="dash-cargo-pill-list">
                    {selectedBookingForDetail.cargo_details.map((cg, cIdx) => (
                      <div key={cg.cargo_id || cIdx} className="dash-cargo-pill">
                        <strong>{cg.product_name || 'สินค้า'}</strong>
                        {cg.quantity && ` · ${cg.quantity} ${cg.unit || 'ชิ้น'}`}
                        {cg.weight && ` (${cg.weight} ${cg.wt_unit || 'กก.'})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="dash-modal-footer">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setSelectedBookingForDetail(null)}
              >
                ปิด
              </button>
              {setActiveTab && (
                <button 
                  type="button" 
                  className="btn-primary-action"
                  onClick={() => {
                    setSelectedBookingForDetail(null);
                    setActiveTab('booking');
                  }}
                >
                  <span>เปิดดูในระบบ Booking</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;