// 

import { useState, useEffect } from 'react';
import { fetchBookings, createBooking, updateBooking, deleteBooking } from './apiBooking';
import { Plus, Pencil, Trash2 } from 'lucide-react';

// สร้างเลข booking_no อัตโนมัติ BK-YYYYMMDD-XXXX
const generateBookingNo = (dateStr, bookings = []) => {
  let d = new Date();
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const datePrefix = `BK-${year}${month}${day}-`;
  const maxSeq = (Array.isArray(bookings) ? bookings : []).reduce((max, b) => {
    const no = b && b.booking_no ? String(b.booking_no) : '';
    if (!no.startsWith(datePrefix)) return max;
    const m = /^BK-\d{8}-(\d{4})$/.exec(no);
    if (!m) return max;
    const seq = parseInt(m[1], 10);
    return isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  return `${datePrefix}${String(maxSeq + 1).padStart(4, '0')}`;
};

export default function BookingForm({ customers, cars, consigners, consignees, fetchData }) {
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emptyForm = { booking_no: '', customer_id: '', consigner_id: '', consignee_id: '', car_id: '', remark: '' };
  const [form, setForm] = useState(emptyForm);

  // ดึงข้อมูล
  const loadBookings = async () => {
    try {
      const data = await fetchBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadBookings(); }, []);

  // เปิดฟอร์มเพิ่มใหม่
  const openAdd = () => {
    const newNo = generateBookingNo(null, bookings);
    setForm({ ...emptyForm, booking_no: newNo });
    setEditId(null);
    setShowForm(true);
  };

  // เปิดฟอร์มแก้ไข — โหลดข้อมูลเดิมมาใส่
  const openEdit = (b) => {
    setForm({
      booking_no: b.booking_no || '',
      customer_id: b.customer_id || '',
      consigner_id: b.consigner_id || '',
      consignee_id: b.consignee_id || '',
      car_id: b.car_id || '',
      remark: b.remark || ''
    });
    setEditId(b.booking_id);
    setShowForm(true);
  };

  // บันทึก (เพิ่มหรือแก้ไข)
  const handleSubmit = async () => {
    if (!form.customer_id) { alert('กรุณาเลือกลูกค้า'); return; }
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateBooking(editId, form);
        alert('แก้ไขสำเร็จ!');
      } else {
        await createBooking(form);
        alert('บันทึกสำเร็จ!');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      await loadBookings();
      if (fetchData) fetchData();
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ลบ
  const handleDelete = async (id) => {
    if (!confirm('ยืนยันการลบ booking นี้?')) return;
    try {
      await deleteBooking(id);
      alert('ลบสำเร็จ!');
      await loadBookings();
      if (fetchData) fetchData();
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Booking</h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Manage delivery bookings</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
          <Plus size={16} /> เพิ่ม Booking
        </button>
      </div>

      {/* ===== กล่องฟอร์ม (เพิ่ม/แก้ไข) ===== */}
      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>{editId ? 'แก้ไข Booking ' + form.booking_no : 'เพิ่ม Booking ใหม่'}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* เลขที่ booking */}
            <div>
              <label style={labelStyle}>เลขที่ Booking</label>
              <input
                type="text"
                style={{ ...inputStyle, background: '#f1f5f9' }}
                value={form.booking_no}
                readOnly
              />
            </div>

            {/* ลูกค้า */}
            <div>
              <label style={labelStyle}>ลูกค้า *</label>
              <select style={inputStyle} value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">-- เลือกลูกค้า --</option>
                {(Array.isArray(customers) ? customers : []).map(c => (
                  <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
                ))}
              </select>
            </div>

            {/* รถ */}
            <div>
              <label style={labelStyle}>รถ (เลขทะเบียน)</label>
              <select style={inputStyle} value={form.car_id} onChange={e => setForm({ ...form, car_id: e.target.value })}>
                <option value="">-- เลือกรถ --</option>
                {(Array.isArray(cars) ? cars : []).map(car => (
                  <option key={car.car_id} value={car.car_id}>{car.car_number} ({car.car_type})</option>
                ))}
              </select>
            </div>

            {/* ต้นทาง */}
            <div>
              <label style={labelStyle}>ต้นทาง (Consigner)</label>
              <select style={inputStyle} value={form.consigner_id} onChange={e => setForm({ ...form, consigner_id: e.target.value })}>
                <option value="">-- เลือกต้นทาง --</option>
                {(Array.isArray(consigners) ? consigners : []).map(c => (
                  <option key={c.consigner_id} value={c.consigner_id}>{c.consigner_name || c.address || c.consigner_id}</option>
                ))}
              </select>
            </div>

            {/* ปลายทาง */}
            <div>
              <label style={labelStyle}>ปลายทาง (Consignee)</label>
              <select style={inputStyle} value={form.consignee_id} onChange={e => setForm({ ...form, consignee_id: e.target.value })}>
                <option value="">-- เลือกปลายทาง --</option>
                {(Array.isArray(consignees) ? consignees : []).map(c => (
                  <option key={c.consignee_id} value={c.consignee_id}>{c.consignee_name || c.address || c.consignee_id}</option>
                ))}
              </select>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>หมายเหตุ</label>
            <textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} placeholder="กรอกหมายเหตุ (ถ้ามี)" />
          </div>

          {/* ปุ่ม */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={handleSubmit} disabled={isSubmitting} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: editId ? '#f59e0b' : '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: isSubmitting ? 0.6 : 1 }}>
              {isSubmitting ? 'กำลังบันทึก...' : editId ? 'แก้ไข' : 'บันทึก'}
            </button>
            <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(false); }} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ===== ตาราง ===== */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={thStyle}>เลขที่</th>
              <th style={thStyle}>วันที่สร้าง</th>
              <th style={thStyle}>ลูกค้า</th>
              <th style={thStyle}>รถ</th>
              <th style={thStyle}>ต้นทาง</th>
              <th style={thStyle}>ปลายทาง</th>
              <th style={thStyle}>หมายเหตุ</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>ยังไม่มี booking</td></tr>
            ) : (
              bookings.map(b => (
                <tr key={b.booking_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>{b.booking_no || b.booking_id}</td>
                  <td style={tdStyle}>{b.booking_date}</td>
                  <td style={tdStyle}>{b.customer_name || '-'}</td>
                  <td style={tdStyle}>{b.car_number || <span style={{ color: '#f59e0b' }}>ยังไม่ระบุ</span>}</td>
                  <td style={tdStyle}>{b.consigner_name || b.consigner_address || '-'}</td>
                  <td style={tdStyle}>{b.consignee_name || b.consignee_address || '-'}</td>
                  <td style={tdStyle}>{b.remark || '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => openEdit(b)} title="แก้ไข" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '4px' }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(b.booking_id)} title="ลบ" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569' };
const tdStyle = { padding: '10px 16px', color: '#1e293b' };