import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  FileText,
  Printer,
  Trash2,
  Edit,
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Truck,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  FileCheck,
  Landmark
} from 'lucide-react';
import {
  fetchInvoices,
  fetchInvoiceById,
  fetchEligibleBookings,
  fetchAccounts,
  fetchBanks,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from './apiInvoice';
import InvoicePreview from './InvoicePreview';
import ActionDropdown from '../Common/ActionDropdown';
// รันเลขที่ใบแจ้งหนี้ใหม่ทุกวัน โดยใช้วันที่เป็น prefix และเลขลำดับต่อท้าย (เช่น INV-20260928-0001)
const generateInvoiceNo = (dateStr, invoicesList = []) => {
  let d = new Date();
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const datePrefix = `INV-${year}${month}${day}-`;
  const maxSeq = (Array.isArray(invoicesList) ? invoicesList : []).reduce((max, inv) => {
    const no = inv && inv.invoice_no ? String(inv.invoice_no) : '';
    if (!no.startsWith(datePrefix)) return max;
    const m = /^INV-\d{8}-(\d{4})$/.exec(no);
    if (!m) return max;
    const seq = parseInt(m[1], 10);
    return isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  return `${datePrefix}${String(maxSeq + 1).padStart(4, '0')}`;
};

export default function InvoiceTable({
  customers = [],
  bookings = [],
  documents = [],
  accounts: propAccounts = [],
  banks: propBanks = [],
  fetchData
}) {
  const [invoices, setInvoices] = useState([]);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [accounts, setAccounts] = useState(propAccounts);
  const [banks, setBanks] = useState(propBanks);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // View Mode: 'list' or 'wizard'
  const [viewMode, setViewMode] = useState('list');
  const [currentStep, setCurrentStep] = useState(1);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { number: 1, title: 'Document Info' },
    { number: 2, title: 'Customer & Terms' },
    { number: 3, title: 'Service Items' },
    { number: 4, title: 'Bank Account' },
    { number: 5, title: 'Review & Summary' }
  ];

  // Form State
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    invoice_no: '',
    invoice_date: todayStr,
    due_date: defaultDueDate,
    credit_term: 30,
    customer_id: '',
    booking_id: '',
    quotation_id: '',
    do_no: '',
    remark: '',
    account_no: '',
    account_name: '',
    bank_name: '',
    bank_branch: '',
    items: [
      {
        service_id: '',
        description: 'ค่าขนส่ง',
        quantity: 1,
        unit: 'คันรถ',
        unit_price: 0,
        total_amount: 0
      }
    ]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invList, eligList, accList, bankList] = await Promise.all([
        fetchInvoices(),
        fetchEligibleBookings(),
        fetchAccounts().catch(() => []),
        fetchBanks().catch(() => [])
      ]);
      setInvoices(Array.isArray(invList) ? invList : []);
      setEligibleBookings(Array.isArray(eligList) ? eligList : []);
      setAccounts(Array.isArray(accList) ? accList : []);
      setBanks(Array.isArray(bankList) ? bankList : []);
      setFormData(prev => {
        if (!editingInvoiceId && (!prev.invoice_no || prev.invoice_no.startsWith('INV-'))) {
          return {
            ...prev,
            invoice_no: generateInvoiceNo(prev.invoice_date || todayStr, invList)
          };
        }
        return prev;
      });
    } catch (err) {
      console.error('Error loading invoices data:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (Array.isArray(propAccounts) && propAccounts.length > 0) {
      setAccounts(propAccounts);
    }
  }, [propAccounts]);

  useEffect(() => {
    if (Array.isArray(propBanks) && propBanks.length > 0) {
      setBanks(propBanks);
    }
  }, [propBanks]);

  const handleCreditTermChange = (term) => {
    const days = parseInt(term, 10);
    const baseDate = formData.invoice_date ? new Date(formData.invoice_date) : new Date();
    let newDueDate = formData.due_date;
    if (!isNaN(days) && !isNaN(baseDate.getTime())) {
      const calculated = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      newDueDate = calculated.toISOString().slice(0, 10);
    }
    setFormData(prev => ({
      ...prev,
      credit_term: term,
      due_date: newDueDate
    }));
  };

  const handleInvoiceDateChange = (newDate) => {
    const days = parseInt(formData.credit_term, 10);
    const baseDate = new Date(newDate);
    let newDueDate = formData.due_date;
    if (!isNaN(days) && !isNaN(baseDate.getTime())) {
      const calculated = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      newDueDate = calculated.toISOString().slice(0, 10);
    }
    setFormData(prev => ({
      ...prev,
      invoice_no: editingInvoiceId ? prev.invoice_no : generateInvoiceNo(newDate, invoices),
      invoice_date: newDate,
      due_date: newDueDate
    }));
  };

  const handleOpenCreate = () => {
    setEditingInvoiceId(null);
    setCurrentStep(1);
    const defaultAcc = accounts.length > 0 ? accounts[0] : null;
    const autoInvNo = generateInvoiceNo(todayStr, invoices);
    setFormData({
      invoice_no: autoInvNo,
      invoice_date: todayStr,
      due_date: defaultDueDate,
      credit_term: 30,
      customer_id: '',
      booking_id: '',
      quotation_id: '',
      do_no: '',
      remark: '',
      account_no: defaultAcc?.account_no || '',
      account_name: defaultAcc?.account_name || '',
      bank_name: defaultAcc?.bank_name || '',
      bank_branch: defaultAcc?.bank_branch || '',
      items: [
        {
          service_id: '',
          description: 'ค่าขนส่ง',
          quantity: 1,
          unit: 'คัน',
          unit_price: 0,
          total_amount: 0
        }
      ]
    });
    setViewMode('wizard');
  };

  const handleSelectAccount = (accNo) => {
    if (!accNo) {
      setFormData(prev => ({
        ...prev,
        account_no: '',
        account_name: '',
        bank_name: '',
        bank_branch: ''
      }));
      return;
    }
    const acc = accounts.find(a => a.account_no === accNo);
    if (acc) {
      setFormData(prev => ({
        ...prev,
        account_no: acc.account_no,
        account_name: acc.account_name || '',
        bank_name: acc.bank_name || '',
        bank_branch: acc.bank_branch || ''
      }));
    }
  };

  const handleSelectBookingToInvoice = (bookingId) => {
    if (!bookingId) return;
    const bk = eligibleBookings.find(b => b.booking_id === bookingId);
    if (!bk) return;

    // Compose description: e.g. "ค่าขนส่ง เม็ดพลาสติก"
    const serviceName = bk.service_typename || bk.service_name || 'ค่าขนส่ง';
    const cargoNames = bk.cargo_product_names ? ` ${bk.cargo_product_names}` : '';
    const fullDesc = `${serviceName}${cargoNames}`.trim();

    const unitPrice = parseFloat(bk.default_price) || 0;
    const qty = parseFloat(bk.service_qty) || 1;
    const unit = bk.unit_quantity || 'คัน';

    setFormData(prev => ({
      ...prev,
      booking_id: bk.booking_id,
      customer_id: bk.customer_id || prev.customer_id,
      quotation_id: bk.quotation_id || '',
      do_no: bk.do_no || '',
      items: [
        {
          service_id: bk.service_id || '',
          description: fullDesc || 'ค่าขนส่งสินค้า',
          quantity: qty,
          unit: unit || 'คัน',
          unit_price: unitPrice,
          total_amount: qty * unitPrice
        }
      ]
    }));
  };

  const handleItemChange = (index, field, val) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index], [field]: val };

      if (field === 'quantity' || field === 'unit_price') {
        const qty = parseFloat(field === 'quantity' ? val : item.quantity) || 0;
        const price = parseFloat(field === 'unit_price' ? val : item.unit_price) || 0;
        item.total_amount = qty * price;
      }

      updatedItems[index] = item;
      return { ...prev, items: updatedItems };
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          service_id: '',
          description: 'ค่าบริการเพิ่มเติม',
          quantity: 1,
          unit: 'คันรถ',
          unit_price: 0,
          total_amount: 0
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.customer_id) {
      alert('กรุณาเลือกลูกค้าในขั้นตอนที่ 2 (Customer & Terms)');
      setCurrentStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingInvoiceId) {
        await updateInvoice(editingInvoiceId, formData);
        alert('แก้ไขใบแจ้งหนี้สำเร็จ');
      } else {
        await createInvoice(formData);
        alert('สร้างใบแจ้งหนี้สำเร็จ');
      }
      setViewMode('list');
      await loadData();
      if (fetchData) fetchData();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = async (inv) => {
    try {
      const detail = await fetchInvoiceById(inv.invoice_id);
      setEditingInvoiceId(detail.invoice_id);
      setCurrentStep(1);
      setFormData({
        invoice_no: detail.invoice_no,
        invoice_date: detail.invoice_date ? new Date(detail.invoice_date).toISOString().slice(0, 10) : todayStr,
        due_date: detail.due_date ? new Date(detail.due_date).toISOString().slice(0, 10) : '',
        credit_term: detail.credit_term || 30,
        customer_id: detail.customer_id || '',
        booking_id: detail.booking_id || '',
        quotation_id: detail.quotation_id || '',
        do_no: detail.do_no || '',
        remark: detail.remark || '',
        account_no: detail.account_no || '',
        account_name: detail.account_name || '',
        bank_name: detail.bank_name || '',
        bank_branch: detail.bank_branch || '',
        items: Array.isArray(detail.items) && detail.items.length > 0 ? detail.items.map(it => ({
          service_id: it.service_id || '',
          description: it.description || '',
          quantity: parseFloat(it.quantity) || 1,
          unit: it.unit || 'คันรถ',
          unit_price: parseFloat(it.unit_price) || 0,
          total_amount: parseFloat(it.total_amount) || 0
        })) : [
          { service_id: '', description: 'ค่าขนส่ง', quantity: 1, unit: 'คันรถ', unit_price: 0, total_amount: 0 }
        ]
      });
      setViewMode('wizard');
    } catch (err) {
      alert('ไม่สามารถดึงข้อมูลสำหรับแก้ไขได้: ' + err.message);
    }
  };

  const handleOpenPreview = async (inv) => {
    try {
      const detail = await fetchInvoiceById(inv.invoice_id);
      setPreviewInvoice(detail);
    } catch (err) {
      alert('ไม่สามารถเปิดดูตัวอย่างได้: ' + err.message);
    }
  };

  const handleDelete = async (inv) => {
    if (!window.confirm(`ยืนยันการลบใบแจ้งหนี้เลขที่ ${inv.invoice_no}?`)) return;
    try {
      await deleteInvoice(inv.invoice_id);
      alert('ลบใบแจ้งหนี้สำเร็จ');
      await loadData();
      if (fetchData) fetchData();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    }
  };

  // Filter Invoices
  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const invNo = (inv.invoice_no || '').toLowerCase();
    const cust = (inv.customer_name || '').toLowerCase();
    const bkNo = (inv.booking_no || '').toLowerCase();
    const doNo = (inv.do_no || '').toLowerCase();
    const qtNo = (inv.quotation_no || '').toLowerCase();
    return invNo.includes(q) || cust.includes(q) || bkNo.includes(q) || doNo.includes(q) || qtNo.includes(q);
  });

  const totalCalculatedAmount = formData.items.reduce((acc, it) => acc + (parseFloat(it.total_amount) || 0), 0);

  // RENDER CREATE / EDIT INVOICE MULTI-STEP WIZARD (Image 2 style)
  if (viewMode === 'wizard') {
    const selectedCustomer = (Array.isArray(customers) ? customers : []).find(c => c.customer_id === formData.customer_id);

    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Back link */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0 }}
          >
            <ArrowLeft size={16} />
            <span>Back to invoices</span>
          </button>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '24px', textAlign: 'left' }}>
          {editingInvoiceId ? 'Edit Invoice' : 'Create New Invoice'}
        </h2>

        {/* Main Card Panel */}
        <div className="dashboard-card-panel" style={{ padding: '32px' }}>

          {/* Stepper Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', overflowX: 'auto', paddingBottom: '8px' }}>
            {steps.map((step, idx) => {
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;

              return (
                <div
                  key={step.number}
                  onClick={() => setCurrentStep(step.number)}
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
                      {isCompleted ? <Check size={18} /> : step.number}
                    </div>
                    {/* Step Label */}
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#0f172a' : isCompleted ? '#334155' : '#94a3b8',
                      whiteSpace: 'nowrap'
                    }}>
                      {step.title}
                    </span>
                  </div>

                  {/* Line connector between steps */}
                  {idx < steps.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: step.number < currentStep ? '#0284c7' : '#e2e8f0',
                      margin: '0 12px',
                      minWidth: '20px'
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* STEP 1: Document Info */}
          {currentStep === 1 && (
            <div style={{ textAlign: 'left' }}>
              {/* Eligible Booking Fast Selector */}
              {!editingInvoiceId && (
                <div style={{
                  marginBottom: '28px',
                  padding: '20px 22px',
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  borderLeft: '4px solid #0284c7',
                  boxShadow: '0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Truck size={18} />
                      </div>
                      <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14.5px' }}>
                        เลือกจากงานจองที่ส่งของ (DO) เรียบร้อยแล้ว
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '600',
                      color: '#0284c7',
                      backgroundColor: '#eff6ff',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      border: '1px solid #bfdbfe'
                    }}>
                      นำเข้าข้อมูลอัตโนมัติ
                    </span>
                  </div>

                  <select
                    className="form-select"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '13px',
                      color: '#0f172a'
                    }}
                    value={formData.booking_id}
                    onChange={(e) => handleSelectBookingToInvoice(e.target.value)}
                  >
                    <option value="">— เลือกรอบการส่งสินค้า เพื่อดึงข้อมูลบริการ ราคา และ DO อัตโนมัติ —</option>
                    {eligibleBookings.map((bk) => (
                      <option key={bk.booking_id} value={bk.booking_id}>
                        {bk.booking_no} — {bk.customer_name} | DO: {bk.do_no || 'มีไฟล์แนบ'} | สินค้า: {bk.cargo_product_names || 'สินค้าทั่วไป'} | ราคา: {Number(bk.default_price || 0).toLocaleString()} บ.
                      </option>
                    ))}
                  </select>
                  <small style={{ display: 'block', marginTop: '8px', color: '#64748b', fontSize: '12px' }}>
                    * เมื่อเลือก ระบบจะดึงชื่อบริการ + ชื่อสินค้า (เช่น "ค่าขนส่ง เม็ดพลาสติก"), หน่วยเป็น "คันรถ", และราคาค่าบริการจากใบเสนอราคามาให้ทันที
                  </small>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Invoice No. (auto)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.invoice_no || ''}
                    disabled
                    style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed', fontWeight: '600' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ระบบสร้างเลขที่ใบแจ้งหนี้ให้อัตโนมัติ (Auto-generated)
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">วันที่ออกใบแจ้งหนี้ (Invoice Date)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.invoice_date}
                    onChange={(e) => handleInvoiceDateChange(e.target.value)}
                  />
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Customer & Terms */}
          {currentStep === 2 && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">
                    เลือกลูกค้า (Customer) <span className="form-label-required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    required
                  >
                    <option value="">— เลือกลูกค้า —</option>
                    {(Array.isArray(customers) ? customers : []).map(c => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.customer_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">เครดิตเทอม (Credit Term - วัน)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="เช่น 30 หรือ 49"
                    value={formData.credit_term}
                    onChange={(e) => handleCreditTermChange(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">วันครบกำหนดชำระ (Due Date)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    คำนวณอัตโนมัติตามวันที่ออกเอกสารและเครดิตเทอม
                  </small>
                </div>
              </div>

              {/* Selected Customer Information Preview Card */}
              {selectedCustomer && (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0f172a', fontWeight: 600 }}>
                    <Building2 size={16} color="#0284c7" />
                    <span>ข้อมูลลูกค้า: {selectedCustomer.customer_name}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px', color: '#475569' }}>
                    <div><strong>เลขประจำตัวผู้เสียภาษี:</strong> {selectedCustomer.tax_id || '-'}</div>
                    <div><strong>ผู้ติดต่อ:</strong> {selectedCustomer.contact_person || '-'}</div>
                    <div><strong>เบอร์โทรศัพท์:</strong> {selectedCustomer.phone || '-'}</div>
                    <div><strong>ที่อยู่:</strong> {selectedCustomer.address || '-'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Service Items */}
          {currentStep === 3 && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                    รายการค่าบริการ (Service Items)
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    กำหนดรายละเอียดบริการ จำนวน หน่วย และราคาต่อหน่วย
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: '#0284c7',
                    color: '#0284c7',
                    fontWeight: 600
                  }}
                >
                  <Plus size={16} />
                  <span>เพิ่มรายการ</span>
                </button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', width: '38%' }}>รายการ (Description)</th>
                      <th style={{ padding: '12px 14px', width: '12%', textAlign: 'center' }}>จำนวน</th>
                      <th style={{ padding: '12px 14px', width: '14%', textAlign: 'center' }}>หน่วย</th>
                      <th style={{ padding: '12px 14px', width: '16%', textAlign: 'right' }}>ราคา/หน่วย (บาท)</th>
                      <th style={{ padding: '12px 14px', width: '14%', textAlign: 'right' }}>รวม (บาท)</th>
                      <th style={{ padding: '12px 14px', width: '6%', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={item.description}
                            placeholder="เช่น ค่าขนส่ง เม็ดพลาสติก"
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            required
                            className="form-input"
                            style={{ padding: '8px 10px' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="form-input"
                            style={{ padding: '8px 10px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="form-input"
                            style={{ padding: '8px 10px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            step="any"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="form-input"
                            style={{ padding: '8px 10px', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                          {(parseFloat(item.total_amount) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={formData.items.length <= 1}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: formData.items.length <= 1 ? 'not-allowed' : 'pointer',
                              opacity: formData.items.length <= 1 ? 0.3 : 1
                            }}
                            title="ลบรายการ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Card */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '16px 20px',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#475569', marginRight: '20px' }}>ยอดรวมสุทธิทั้งสิ้น:</span>
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#0284c7' }}>
                  {totalCalculatedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Bank Account */}
          {currentStep === 4 && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={20} color="#0284c7" />
                  <span>เลือกบัญชีธนาคารสำหรับรับชำระเงิน (Select Bank Account)</span>
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  เลือกบัญชีธนาคารจากระบบ Master Data เพื่อระบุข้อมูลการโอนเงินในใบแจ้งหนี้อย่างถูกต้อง
                </p>
              </div>

              {/* Fast Account Selector */}
              <div style={{
                marginBottom: '20px',
                padding: '18px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  บัญชีธนาคารรับชำระเงิน <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.account_no || ''}
                  onChange={(e) => handleSelectAccount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    fontSize: '13.5px',
                    fontWeight: '500',
                    color: '#0f172a'
                  }}
                >
                  <option value="">— กรุณาเลือกบัญชีธนาคาร —</option>
                  {accounts.map(acc => (
                    <option key={acc.account_no} value={acc.account_no}>
                      {acc.bank_name || 'ธนาคาร'} | เลขที่: {acc.account_no} | {acc.account_name} ({acc.bank_branch || 'สำนักงานใหญ่'})
                    </option>
                  ))}
                </select>

                {accounts.length === 0 && (
                  <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
                    ⚠️ ยังไม่มีข้อมูลบัญชีธนาคารในระบบ กรุณาไปเพิ่มข้อมูลบัญชีธนาคารในเมนู <strong>MASTER DATA &gt; Bank Accounts</strong> ก่อน
                  </div>
                )}
              </div>

              {/* Selected Account Information Card */}
              {formData.account_no ? (
                <div style={{
                  padding: '20px 24px',
                  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  borderLeft: '4px solid #0284c7',
                  boxShadow: '0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Landmark size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                          {formData.bank_name || 'ธนาคาร'}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                          สาขา: {formData.bank_branch || 'สำนักงานใหญ่'}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '600',
                      color: '#0284c7',
                      backgroundColor: '#eff6ff',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      border: '1px solid #bfdbfe'
                    }}>
                      ✓ บัญชีที่เลือกสำหรับใบแจ้งหนี้นี้
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '3px' }}>เลขที่บัญชี (Account No.):</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>
                        {formData.account_no}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '3px' }}>ชื่อบัญชี (Account Name):</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                        {formData.account_name || '-'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
                    ℹ️ บัญชีนี้จะถูกพิมพ์ลงในส่วนคำแนะนำการชำระเงินของใบแจ้งหนี้ เพื่อให้ลูกค้าโอนเงินเข้าบัญชีนี้
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '36px 20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <Landmark size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>
                    ยังไม่ได้เลือกบัญชีธนาคาร
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    กรุณาเลือกบัญชีธนาคารจากรายการด้านบนเพื่อใช้สำหรับใบแจ้งหนี้นี้
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                * หากต้องการเพิ่มหรือแก้ไขข้อมูลบัญชีธนาคาร สามารถไปจัดการได้ที่เมนู <strong>MASTER DATA &gt; Bank Accounts</strong>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Summary */}
          {currentStep === 5 && (
            <div style={{ textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">หมายเหตุ (Remark / เงื่อนไขเพิ่มเติม)</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="ระบุข้อความ เงื่อนไขการชำระเงิน หรือหมายเหตุเพิ่มเติม..."
                />
              </div>

              {/* Summary Card */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#0f172a', fontWeight: '700', fontSize: '16px' }}>
                  <FileCheck size={20} color="#0284c7" />
                  <span>สรุปรายละเอียดใบแจ้งหนี้ (Invoice Summary)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px', fontSize: '13px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>เลขที่ใบแจ้งหนี้:</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{formData.invoice_no || '(สร้างอัตโนมัติ)'}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>ลูกค้า:</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedCustomer?.customer_name || '-'}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>วันที่ออก / ครบกำหนด:</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{formData.invoice_date} ถึง {formData.due_date}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>DO No. / เครดิตเทอม:</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{formData.do_no || '-'} ({formData.credit_term} วัน)</div>
                  </div>
                </div>

                {/* Items Mini Table */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>รายการ</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>จำนวน</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>ราคา/หน่วย</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((it, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px' }}>{it.description}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{it.quantity} {it.unit}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(it.unit_price || 0).toLocaleString()}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{Number(it.total_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bank Account Summary Card */}
                <div style={{
                  padding: '14px 16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Landmark size={16} />
                    <span>ข้อมูลบัญชีรับชำระเงิน (Bank Account)</span>
                  </div>
                  {formData.account_no ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                      <div><span style={{ color: '#64748b' }}>ธนาคาร: </span><strong>{formData.bank_name || '-'}</strong></div>
                      <div><span style={{ color: '#64748b' }}>เลขที่บัญชี: </span><strong style={{ color: '#0284c7', fontWeight: 700 }}>{formData.account_no}</strong></div>
                      <div><span style={{ color: '#64748b' }}>ชื่อบัญชี: </span><strong>{formData.account_name || '-'}</strong></div>
                      <div><span style={{ color: '#64748b' }}>สาขา: </span><strong>{formData.bank_branch || '-'}</strong></div>
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>ไม่ได้ระบุบัญชีธนาคาร (เว้นว่างไว้)</div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#475569', marginRight: '16px' }}>ยอดรวมสุทธิทั้งสิ้น:</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7' }}>
                    {totalCalculatedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div>
              <button
                type="button"
                className="btn-secondary"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
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
                  onClick={() => {
                    if (currentStep === 2 && !formData.customer_id) {
                      alert('กรุณาเลือกลูกค้าก่อนดำเนินการต่อ');
                      return;
                    }
                    if (currentStep === 4 && !formData.account_no) {
                      alert('กรุณาเลือกบัญชีธนาคารสำหรับรับชำระเงินก่อนดำเนินการต่อ');
                      return;
                    }
                    setCurrentStep(prev => Math.min(5, prev + 1));
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  style={{
                    backgroundColor: '#16a34a',
                    borderColor: '#16a34a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : (editingInvoiceId ? 'บันทึกการแก้ไข' : 'ยืนยันและสร้างใบแจ้งหนี้')}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>ใบแจ้งหนี้ (Invoice)</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>
            ออกใบแจ้งหนี้สำหรับงานขนส่งที่จัดส่งสินค้า (DO) เรียบร้อยแล้ว โดยอิงราคาค่าบริการตามใบเสนอราคา
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} />
          <span>สร้างใบแจ้งหนี้ใหม่</span>
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="dashboard-card-panel" style={{ padding: '24px 0 0 0' }}>
        <div style={{ padding: '0 24px' }}>
          <div className="panel-search-bar">
            <Search size={16} className="panel-search-icon" />
            <input
              type="text"
              placeholder="ค้นหาตามเลขที่ใบแจ้งหนี้, ลูกค้า, เลขที่ DO, หรือ Booking #..."
              className="panel-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="custom-clean-table">
            <thead>
              <tr>
                <th style={{ width: '20%', paddingLeft: '24px', whiteSpace: 'nowrap' }}>Invoice #</th>
                <th style={{ width: '30%', whiteSpace: 'nowrap' }}>ลูกค้า (Customer)</th>
                <th style={{ width: '18%', whiteSpace: 'nowrap' }}>วันที่ออกเอกสาร</th>
                <th style={{ width: '18%', textAlign: 'right', whiteSpace: 'nowrap' }}>ยอดเงินรวม (บาท)</th>
                <th style={{ width: '14%', textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    ⏳ กำลังโหลดข้อมูลใบแจ้งหนี้...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    ยังไม่มีข้อมูลใบแจ้งหนี้ คลิก "สร้างใบแจ้งหนี้ใหม่" เพื่อเริ่มต้น
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.invoice_id}>
                    {/* Invoice # */}
                    <td style={{ paddingLeft: '24px', fontWeight: '700', color: '#0284c7', whiteSpace: 'nowrap' }}>
                      <span
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleOpenPreview(inv)}
                        title="คลิกเพื่อดูตัวอย่าง/พิมพ์ใบแจ้งหนี้"
                      >
                        <FileText size={15} />
                        {inv.invoice_no}
                      </span>
                    </td>

                    {/* Customer */}
                    <td style={{ color: '#1e293b', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {inv.customer_name || inv.customer_id || '-'}
                    </td>

                    {/* Invoice Date */}
                    <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                      {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('th-TH') : '-'}
                    </td>

                    {/* Total Amount */}
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#0284c7', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      {Number(inv.total_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>
                      <ActionDropdown
                        items={[
                          {
                            label: 'ดูตัวอย่าง / พิมพ์',
                            icon: <Printer size={16} className="menu-icon" />,
                            onClick: () => handleOpenPreview(inv)
                          },
                          {
                            label: 'แก้ไข',
                            icon: <Edit size={16} className="menu-icon" />,
                            onClick: () => handleOpenEdit(inv)
                          },
                          {
                            label: 'ลบ',
                            icon: <Trash2 size={16} className="menu-icon danger" />,
                            danger: true,
                            onClick: () => handleDelete(inv)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* INVOICE PREVIEW / PRINT MODAL */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  );
}
