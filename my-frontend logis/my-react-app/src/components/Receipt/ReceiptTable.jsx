import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  FileText,
  Printer,
  Trash2,
  Edit,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  Calendar,
  Building2,
  Landmark,
  FileSpreadsheet
} from 'lucide-react';
import {
  fetchReceipts,
  fetchReceiptById,
  fetchInvoices,
  fetchInvoiceById,
  fetchAccounts,
  createReceipt,
  updateReceipt,
  deleteReceipt
} from './apiReceipt';
import ReceiptPreview from './ReceiptPreview';
import ActionDropdown from '../Common/ActionDropdown';
import './ReceiptWizard.css';

const generateReceiptNo = (dateStr, receiptsList = []) => {
  let d = new Date();
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const datePrefix = `RC-${year}${month}${day}-`;
  const maxSeq = (Array.isArray(receiptsList) ? receiptsList : []).reduce((max, rc) => {
    const no = rc && rc.receipt_no ? String(rc.receipt_no) : '';
    if (!no.startsWith(datePrefix)) return max;
    const m = /^RC-\d{8}-(\d{4})$/.exec(no);
    if (!m) return max;
    const seq = parseInt(m[1], 10);
    return isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  return `${datePrefix}${String(maxSeq + 1).padStart(4, '0')}`;
};

export default function ReceiptTable({ customers = [], documents = [], fetchData }) {
  const [receipts, setReceipts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // View Mode: 'list' or 'wizard'
  const [viewMode, setViewMode] = useState('list');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 4 Steps matching Mockup Images 2, 3, 4, 5
  const steps = [
    { number: 1, title: 'Select Invoice' },
    { number: 2, title: 'Receipt Info' },
    { number: 3, title: 'Service Items' },
    { number: 4, title: 'Review' }
  ];

  // Helper date strings
  const todayStr = new Date().toISOString().slice(0, 10);

  const initialFormState = {
    receipt_no: '',
    invoice_id: '',
    invoice_no: '',
    customer_id: '',
    customer_name: '',
    customer_address: '',
    customer_tax_id: '',
    payment_date: todayStr,
    payment_method: 'Transfer',
    account_no: '',
    bank_name: '',
    bank_branch: '',
    amount_paid: 0,
    remark: '',
    items: [
      {
        description: 'Electronic Components',
        item_date: todayStr,
        quantity: 1,
        unit: 'รายการ',
        unit_price: 0,
        total_amount: 0
      }
    ]
  };

  const [formData, setFormData] = useState(initialFormState);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [rcList, invList, accList] = await Promise.all([
        fetchReceipts().catch(() => []),
        fetchInvoices().catch(() => []),
        fetchAccounts().catch(() => [])
      ]);
      setReceipts(Array.isArray(rcList) ? rcList : []);
      setInvoices(Array.isArray(invList) ? invList : []);
      setAccounts(Array.isArray(accList) ? accList : []);
    } catch (err) {
      console.error('Error loading receipts data:', err);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format currency
  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format date display (e.g. 23 Jul 2026)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Format date input value (YYYY-MM-DD)
  const formatDateInput = (dateStr) => {
    if (!dateStr) return todayStr;
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? todayStr : d.toISOString().slice(0, 10);
    } catch {
      return todayStr;
    }
  };

  // Open Create Wizard
  const handleOpenCreate = () => {
    setEditingReceiptId(null);
    setSelectedInvoice(null);
    setCurrentStep(1);
    setInvoiceSearchQuery('');

    const defaultAcc = accounts.length > 0 ? accounts[0] : null;

    setFormData({
      ...initialFormState,
      receipt_no: generateReceiptNo(todayStr, receipts),
      payment_date: todayStr,
      account_no: defaultAcc?.account_no || '',
      bank_name: defaultAcc?.bank_name || 'Kasikorn Bank',
      bank_branch: defaultAcc?.bank_branch || ''
    });

    setViewMode('wizard');
  };

  const handlePaymentDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      payment_date: newDate,
      receipt_no: (!editingReceiptId && (!prev.receipt_no || prev.receipt_no.startsWith('RC-')))
        ? generateReceiptNo(newDate, receipts)
        : prev.receipt_no
    }));
  };

  // Select Invoice Card in Step 1 (Matching Image 2)
  const handleSelectInvoice = async (inv) => {
    if (!inv) return;
    setSelectedInvoice(inv);

    const cust = (Array.isArray(customers) ? customers : []).find(c => c.customer_id === inv.customer_id);
    const invoiceTotal = parseFloat(inv.total_amount) || 0;

    let invoiceItems = [];
    try {
      const fullInv = await fetchInvoiceById(inv.invoice_id);
      if (Array.isArray(fullInv?.items) && fullInv.items.length > 0) {
        invoiceItems = fullInv.items.map(it => ({
          description: it.description || 'ค่าบริการขนส่งตามใบแจ้งหนี้',
          item_date: it.item_date ? formatDateInput(it.item_date) : (fullInv.invoice_date ? formatDateInput(fullInv.invoice_date) : todayStr),
          quantity: parseFloat(it.quantity) || 1,
          unit: it.unit || 'คันรถ',
          unit_price: parseFloat(it.unit_price) || 0,
          total_amount: parseFloat(it.total_amount) || 0
        }));
      }
    } catch (err) {
      console.warn('Could not fetch full invoice detail, using fallback:', err);
    }

    // Build items from invoice or default item if detail fetch returned none
    if (invoiceItems.length === 0) {
      invoiceItems = Array.isArray(inv.items) && inv.items.length > 0
        ? inv.items.map(it => ({
            description: it.description || 'ค่าบริการขนส่งตามใบแจ้งหนี้',
            item_date: it.item_date ? formatDateInput(it.item_date) : (inv.invoice_date ? formatDateInput(inv.invoice_date) : todayStr),
            quantity: parseFloat(it.quantity) || 1,
            unit: it.unit || 'คันรถ',
            unit_price: parseFloat(it.unit_price) || 0,
            total_amount: parseFloat(it.total_amount) || 0
          }))
        : [
            {
              description: inv.service_typename || 'ค่าบริการตามใบแจ้งหนี้ ' + inv.invoice_no,
              item_date: inv.invoice_date ? formatDateInput(inv.invoice_date) : todayStr,
              quantity: 1,
              unit: 'งาน',
              unit_price: invoiceTotal,
              total_amount: invoiceTotal
            }
          ];
    }

    setFormData(prev => ({
      ...prev,
      invoice_id: inv.invoice_id,
      invoice_no: inv.invoice_no,
      customer_id: inv.customer_id || '',
      customer_name: inv.customer_name || cust?.customer_name || '',
      customer_address: inv.customer_address || cust?.address || '',
      customer_tax_id: cust?.tax_id || inv.customer_tax_id || '',
      account_no: inv.account_no || prev.account_no,
      bank_name: inv.bank_name || prev.bank_name,
      amount_paid: invoiceTotal,
      items: invoiceItems
    }));
  };

  // Item Changes
  const handleItemChange = (index, field, val) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[index], [field]: val };

      if (field === 'quantity' || field === 'unit_price') {
        const qty = parseFloat(field === 'quantity' ? val : item.quantity) || 0;
        const price = parseFloat(field === 'unit_price' ? val : item.unit_price) || 0;
        item.total_amount = qty * price;
      }

      updated[index] = item;
      return { ...prev, items: updated };
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: 'บริการเพิ่มเติม',
          item_date: prev.payment_date || todayStr,
          quantity: 1,
          unit: 'รายการ',
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

  // Submit / Save Receipt
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.customer_name && !formData.customer_id) {
      alert('กรุณาระบุข้อมูลลูกค้าในขั้นตอนที่ 2 (Receipt Info)');
      setCurrentStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingReceiptId) {
        await updateReceipt(editingReceiptId, formData);
        alert('แก้ไขใบเสร็จรับเงินสำเร็จ');
      } else {
        await createReceipt(formData);
        alert('สร้างใบเสร็จรับเงินสำเร็จ');
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

  // Open Edit
  const handleOpenEdit = async (rc) => {
    try {
      const detail = await fetchReceiptById(rc.receipt_id);
      setEditingReceiptId(detail.receipt_id);
      setCurrentStep(2);

      setFormData({
        receipt_no: detail.receipt_no,
        invoice_id: detail.invoice_id || '',
        invoice_no: detail.invoice_no || '',
        customer_id: detail.customer_id || '',
        customer_name: detail.customer_name || '',
        customer_address: detail.customer_address || '',
        customer_tax_id: detail.customer_tax_id || '',
        payment_date: detail.payment_date ? formatDateInput(detail.payment_date) : todayStr,
        payment_method: detail.payment_method || 'Transfer',
        account_no: detail.account_no || '',
        bank_name: detail.bank_name || '',
        bank_branch: detail.bank_branch || '',
        amount_paid: parseFloat(detail.amount_paid) || parseFloat(detail.total_amount) || 0,
        remark: detail.remark || '',
        items: Array.isArray(detail.items) && detail.items.length > 0 ? detail.items.map(it => ({
          description: it.description || '',
          item_date: it.item_date ? formatDateInput(it.item_date) : todayStr,
          quantity: parseFloat(it.quantity) || 1,
          unit: it.unit || 'รายการ',
          unit_price: parseFloat(it.unit_price) || 0,
          total_amount: parseFloat(it.total_amount) || 0
        })) : [
          { description: 'ค่าบริการ', item_date: todayStr, quantity: 1, unit: 'รายการ', unit_price: 0, total_amount: 0 }
        ]
      });

      setViewMode('wizard');
    } catch (err) {
      alert('ไม่สามารถดึงข้อมูลสำหรับแก้ไขได้: ' + err.message);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (rc) => {
    try {
      const detail = await fetchReceiptById(rc.receipt_id);
      setPreviewReceipt(detail);
    } catch {
      setPreviewReceipt(rc);
    }
  };

  // Delete Receipt
  const handleDelete = async (rc) => {
    if (!window.confirm(`ยืนยันการลบใบเสร็จรับเงินเลขที่ ${rc.receipt_no}?`)) return;
    try {
      await deleteReceipt(rc.receipt_id);
      alert('ลบใบเสร็จรับเงินสำเร็จ');
      await loadData();
      if (fetchData) fetchData();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    }
  };

  // Filter Receipts for List View
  const filteredReceipts = receipts.filter(rc => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const rcNo = (rc.receipt_no || '').toLowerCase();
    const cust = (rc.customer_name || '').toLowerCase();
    const invNo = (rc.invoice_no || '').toLowerCase();
    return rcNo.includes(q) || cust.includes(q) || invNo.includes(q);
  });

  // Filter Invoices for Step 1
  const filteredInvoices = invoices.filter(inv => {
    const q = invoiceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const invNo = (inv.invoice_no || '').toLowerCase();
    const cust = (inv.customer_name || '').toLowerCase();
    return invNo.includes(q) || cust.includes(q);
  });

  // Totals Calculation
  const subtotalAmount = formData.items.reduce((acc, it) => acc + (parseFloat(it.total_amount) || 0), 0);
  const grandTotalAmount = subtotalAmount;

  // =========================================================================
  // VIEW MODE: 4-STEP WIZARD (Matching Images 2, 3, 4, 5)
  // =========================================================================
  if (viewMode === 'wizard') {
    return (
      <div className="receipt-module-container" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
        
        {/* Back Link & Title */}
        <div className="wizard-header-top">
          <button
            type="button"
            className="wizard-back-link"
            onClick={() => setViewMode('list')}
          >
            <ArrowLeft size={16} />
            <span>Back to receipts</span>
          </button>
          <h2 className="receipt-page-title">
            {editingReceiptId ? 'Edit Receipt' : 'New Receipt'}
          </h2>
        </div>

        {/* Wizard Main Card */}
        <div className="receipt-card-panel" style={{ padding: '32px' }}>
          
          {/* Stepper Progress Bar */}
          <div className="wizard-stepper-bar">
            {steps.map((step, idx) => {
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;

              return (
                <React.Fragment key={step.number}>
                  <div
                    className={`wizard-step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => {
                      if (step.number === 1 && editingReceiptId) return;
                      setCurrentStep(step.number);
                    }}
                  >
                    <div className="wizard-step-circle">
                      {isCompleted ? <Check size={16} /> : step.number}
                    </div>
                    <span className="wizard-step-title">{step.title}</span>
                  </div>

                  {idx < steps.length - 1 && (
                    <div className={`wizard-step-line ${step.number < currentStep ? 'completed' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ================================================================= */}
          {/* STEP 1: SELECT INVOICE (Image 2)                                 */}
          {/* ================================================================= */}
          {currentStep === 1 && (
            <div>
              <div className="step-heading-row">
                <h3 className="step-main-title">Select Invoice</h3>
                
                {/* Search Bar for Invoices */}
                <div className="receipt-pill-search" style={{ maxWidth: '100%', marginBottom: '20px' }}>
                  <Search size={16} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search by invoice number or customer..."
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Invoices Cards Grid */}
              {filteredInvoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
                  <FileSpreadsheet size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    ไม่พบรายการใบแจ้งหนี้ (สามารถกด "Next" เพื่อกรอกข้อมูลออกใบเสร็จแบบ Manual ได้)
                  </p>
                </div>
              ) : (
                <div className="invoice-cards-grid">
                  {filteredInvoices.map((inv) => {
                    const isSelected = selectedInvoice?.invoice_id === inv.invoice_id || formData.invoice_id === inv.invoice_id;
                    const totalInv = parseFloat(inv.total_amount) || 0;

                    return (
                      <div
                        key={inv.invoice_id}
                        className={`invoice-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectInvoice(inv)}
                      >
                        <div className="invoice-card-top">
                          <span className="invoice-card-id">{inv.invoice_no}</span>
                        </div>

                        <div className="invoice-card-customer">
                          {inv.customer_name || 'ลูกค้าทั่วไป'}
                        </div>

                        <div className="invoice-card-dates">
                          <span>
                            {inv.invoice_date ? `Issue: ${formatDateDisplay(inv.invoice_date)}` : ''} 
                            {inv.due_date ? ` · Due: ${formatDateDisplay(inv.due_date)}` : ''}
                          </span>
                        </div>

                        <div className="invoice-card-amount">
                          THB {formatMoney(totalInv)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected Banner (Matching Image 2) */}
              {(selectedInvoice || formData.invoice_no) && (
                <div className="receipt-selected-banner">
                  <span>
                    Selected: <strong>{formData.invoice_no}</strong> · {formData.customer_name || 'ลูกค้าที่เลือก'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: RECEIPT INFO (Image 3)                                    */}
          {/* ================================================================= */}
          {currentStep === 2 && (
            <div className="receipt-form-columns">
              
              {/* Left Column: Receipt Details */}
              <div className="receipt-sub-card">
                <h4 className="receipt-sub-card-title">Receipt Details</h4>

                <div className="receipt-form-field">
                  <label className="receipt-field-label">Receipt No.</label>
                  <input
                    type="text"
                    className="receipt-field-input"
                    value={formData.receipt_no}
                    onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
                  />
                </div>

                <div className="receipt-form-field">
                  <label className="receipt-field-label">Invoice No.</label>
                  <input
                    type="text"
                    className="receipt-field-input"
                    placeholder="อ้างอิงเลขที่ใบแจ้งหนี้ (เช่น INV-20260723-9678)"
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                  />
                </div>

                <div className="receipt-form-field">
                  <label className="receipt-field-label">Payment Date / วันที่</label>
                  <input
                    type="date"
                    className="receipt-field-input"
                    value={formData.payment_date}
                    onChange={(e) => handlePaymentDateChange(e.target.value)}
                  />
                </div>

                <div className="receipt-form-field">
                  <label className="receipt-field-label">Payment Method</label>
                  <select
                    className="receipt-field-select"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    <option value="Transfer">Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                <div className="receipt-form-field">
                  <label className="receipt-field-label">Bank Account</label>
                  <select
                    className="receipt-field-select"
                    value={formData.account_no || ''}
                    onChange={(e) => {
                      const acc = accounts.find(a => a.account_no === e.target.value);
                      setFormData({
                        ...formData,
                        account_no: e.target.value,
                        bank_name: acc?.bank_name || formData.bank_name
                      });
                    }}
                  >
                    <option value="">— Kasikorn Bank - 001-2-34567-8 —</option>
                    {accounts.map(acc => (
                      <option key={acc.account_no} value={acc.account_no}>
                        {acc.bank_name || 'Bank'} - {acc.account_no} ({acc.account_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column: Customer Information */}
              <div className="receipt-sub-card">
                <h4 className="receipt-sub-card-title">Customer / ข้อมูลลูกค้า</h4>

                <div className="receipt-form-field">
                  <label className="receipt-field-label">Company</label>
                  <input
                    type="text"
                    className="receipt-field-input"
                    placeholder="Thai Global Trading Co., Ltd."
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>

                <div className="receipt-form-field">
                  <label className="receipt-field-label">Address</label>
                  <textarea
                    rows="3"
                    className="receipt-field-input"
                    placeholder="123 Sukhumvit Rd, Bangkok 10110"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  />
                </div>

                <div className="receipt-form-field">
                  <label className="receipt-field-label">Tax ID</label>
                  <input
                    type="text"
                    className="receipt-field-input"
                    placeholder="0105546001234"
                    value={formData.customer_tax_id}
                    onChange={(e) => setFormData({ ...formData, customer_tax_id: e.target.value })}
                  />
                </div>
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: SERVICE ITEMS (Image 4)                                   */}
          {/* ================================================================= */}
          {currentStep === 3 && (
            <div className="items-card-container">
              <div className="items-header-bar">
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  Service Items / รายละเอียดบริการอ้างอิงอินวอย
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="receipt-btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '8px' }}
                >
                  <Plus size={15} />
                  <span>Add</span>
                </button>
              </div>

              {/* Items Table */}
              <div className="items-table-wrapper">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '42%' }}>Description</th>
                      <th style={{ width: '18%', textAlign: 'center' }}>Date</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '14%', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ width: '16%', textAlign: 'right' }}>Total</th>
                      <th style={{ width: '38px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            className="receipt-field-input"
                            style={{ padding: '8px 10px', fontSize: '13px' }}
                            placeholder="เช่น Electronic Components"
                            value={it.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="date"
                            className="receipt-field-input"
                            style={{ padding: '8px 8px', fontSize: '13px', textAlign: 'center' }}
                            value={it.item_date || formData.payment_date}
                            onChange={(e) => handleItemChange(idx, 'item_date', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            className="receipt-field-input"
                            style={{ padding: '8px 6px', fontSize: '13px', textAlign: 'center' }}
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="receipt-field-input"
                            style={{ padding: '8px 10px', fontSize: '13px', textAlign: 'right' }}
                            value={it.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                          {formatMoney(it.total_amount)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={formData.items.length <= 1}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: formData.items.length <= 1 ? '#cbd5e1' : '#ef4444',
                              cursor: formData.items.length <= 1 ? 'not-allowed' : 'pointer',
                              padding: '4px'
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

              {/* Items Summary (Matching Image 4) */}
              <div className="items-summary-panel">
                <div className="summary-row">
                  <span className="summary-label">รวมเป็นเงิน / Subtotal</span>
                  <span className="summary-value">THB {formatMoney(subtotalAmount)}</span>
                </div>
                <div className="summary-row grand-total">
                  <span className="summary-label">จำนวนรวมทั้งสิ้น / Grand Total</span>
                  <span className="summary-value highlight">THB {formatMoney(grandTotalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: REVIEW (Image 5)                                          */}
          {/* ================================================================= */}
          {currentStep === 4 && (
            <div>
              {/* Top 2 Summary Cards */}
              <div className="review-top-cards">
                
                {/* Left Card: RECEIPT */}
                <div className="review-info-card">
                  <div className="review-card-badge">RECEIPT</div>
                  <div className="review-data-line">
                    <span className="review-data-label">Receipt No:</span>
                    <strong style={{ color: '#0f172a' }}>{formData.receipt_no}</strong>
                  </div>
                  <div className="review-data-line">
                    <span className="review-data-label">Invoice No:</span>
                    <span>{formData.invoice_no || '-'}</span>
                  </div>
                  <div className="review-data-line">
                    <span className="review-data-label">Date:</span>
                    <span>{formatDateDisplay(formData.payment_date)}</span>
                  </div>
                  <div className="review-data-line">
                    <span className="review-data-label">Method:</span>
                    <span>{formData.payment_method}</span>
                  </div>
                </div>

                {/* Right Card: CUSTOMER */}
                <div className="review-info-card">
                  <div className="review-card-badge">CUSTOMER</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                    {formData.customer_name || 'ลูกค้าทั่วไป'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {formData.customer_address || '-'}
                  </div>
                  <div className="review-data-line" style={{ marginTop: '4px' }}>
                    <span className="review-data-label">Tax ID:</span>
                    <span>{formData.customer_tax_id || '-'}</span>
                  </div>
                </div>

              </div>

              {/* Service Items Review Table */}
              <div className="items-card-container" style={{ padding: '20px', marginBottom: '20px' }}>
                <div className="review-card-badge" style={{ marginBottom: '8px' }}>SERVICE ITEMS</div>
                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45%' }}>Description</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>Date</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: '15%', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '500' }}>{it.description}</td>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>
                            {formatDateDisplay(it.item_date || formData.payment_date)}
                          </td>
                          <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{formatMoney(it.unit_price)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatMoney(it.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Breakdown & Notes (Matching Image 5) */}
              <div className="review-bottom-grid">
                
                {/* Notes & Totals Breakdown */}
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                      <span style={{ color: '#64748b', minWidth: '150px' }}>รวมเป็นเงิน / Subtotal:</span>
                      <strong>THB {formatMoney(subtotalAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                      <span style={{ color: '#0f172a', fontWeight: '700', minWidth: '150px' }}>จำนวนรวมทั้งสิ้น / Grand Total:</span>
                      <strong>THB {formatMoney(grandTotalAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                      <span style={{ color: '#0284c7', fontWeight: '700', minWidth: '150px' }}>ยอดชำระ / Amount Paid:</span>
                      <strong style={{ color: '#0284c7' }}>THB {formatMoney(formData.amount_paid || grandTotalAmount)}</strong>
                    </div>
                  </div>

                  <div className="notes-card">
                    <label className="receipt-field-label">Notes</label>
                    <textarea
                      rows="3"
                      className="notes-textarea"
                      placeholder="หมายเหตุเพิ่มเติมในใบเสร็จ..."
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    />
                  </div>
                </div>

                {/* Amount Paid Box (Matching Image 5) */}
                <div className="review-amount-box">
                  <label className="receipt-field-label">ยอดชำระ / Amount Paid (THB)</label>
                  <input
                    type="number"
                    step="any"
                    className="receipt-field-input"
                    style={{ fontSize: '18px', fontWeight: '700', color: '#0284c7', backgroundColor: '#ffffff' }}
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  />
                  <small style={{ color: '#64748b', fontSize: '12px' }}>
                    ยอดเงินที่ลูกค้าชำระจริงสำหรับใบเสร็จนี้
                  </small>
                </div>

              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* BOTTOM NAVIGATION BUTTONS                                         */}
          {/* ================================================================= */}
          <div className="wizard-footer-actions">
            <div>
              <button
                type="button"
                className="receipt-btn-secondary"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>

            <div>
              {currentStep < 4 ? (
                <button
                  type="button"
                  className="receipt-btn-primary"
                  onClick={() => {
                    if (currentStep === 2 && !formData.customer_name) {
                      alert('กรุณากรอกชื่อบริษัทลูกค้าก่อนดำเนินการต่อ');
                      return;
                    }
                    setCurrentStep(prev => Math.min(4, prev + 1));
                  }}
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="receipt-btn-primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  style={{ backgroundColor: '#0284c7' }}
                >
                  <Check size={16} />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : (editingReceiptId ? 'Update Receipt' : 'Create Receipt')}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: LIST TABLE (Matching Image 1 - NO STATUS COLUMN)
  // =========================================================================
  return (
    <div>
      {/* Breadcrumb */}
      <div className="dashboard-breadcrumb">
        <span>Main</span>
        <span className="dashboard-breadcrumb-separator">&gt;</span>
        <span>Financial</span>
        <span className="dashboard-breadcrumb-separator">&gt;</span>
        <span style={{ color: '#64748b' }}>Receipt (ใบเสร็จรับเงิน)</span>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>ใบเสร็จรับเงิน (Receipt)</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>
            ออกใบเสร็จรับเงินสำหรับงานขนส่งที่จัดส่งสินค้าและชำระเงินเรียบร้อยแล้ว โดยอิงตามใบแจ้งหนี้
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} />
          <span>สร้างใบเสร็จรับเงินใหม่</span>
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="dashboard-card-panel" style={{ padding: '24px 0 0 0' }}>
        <div style={{ padding: '0 24px' }}>
          <div className="panel-search-bar">
            <Search size={16} className="panel-search-icon" />
            <input
              type="text"
              placeholder="ค้นหาตามเลขที่ใบเสร็จ, ลูกค้า, หรือเลขที่ใบแจ้งหนี้..."
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
                <th style={{ width: '20%', paddingLeft: '24px', whiteSpace: 'nowrap' }}>Receipt #</th>
                <th style={{ width: '30%', whiteSpace: 'nowrap' }}>ลูกค้า (CUSTOMER)</th>
                <th style={{ width: '18%', whiteSpace: 'nowrap' }}>เลขที่ใบแจ้งหนี้ (INVOICE #)</th>
                <th style={{ width: '16%', whiteSpace: 'nowrap' }}>วันที่ชำระเงิน</th>
                <th style={{ width: '16%', textAlign: 'right', whiteSpace: 'nowrap' }}>ยอดเงินรวม (บาท)</th>
                <th style={{ width: '50px', textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    ⏳ กำลังโหลดข้อมูลใบเสร็จรับเงิน...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    {searchQuery ? 'ไม่พบข้อมูลใบเสร็จที่ตรงกับการค้นหา' : 'ยังไม่มีข้อมูลใบเสร็จรับเงิน คลิก "สร้างใบเสร็จรับเงินใหม่" เพื่อเริ่มต้น'}
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rc) => (
                  <tr key={rc.receipt_id}>
                    {/* Receipt # */}
                    <td style={{ paddingLeft: '24px', fontWeight: '700', color: '#0284c7', whiteSpace: 'nowrap' }}>
                      <span
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleOpenPreview(rc)}
                        title="คลิกเพื่อดูตัวอย่าง/พิมพ์ใบเสร็จ"
                      >
                        <FileText size={15} />
                        {rc.receipt_no}
                      </span>
                    </td>

                    {/* Customer */}
                    <td style={{ color: '#1e293b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {rc.customer_name || rc.customer_id || '-'}
                    </td>

                    {/* Invoice # */}
                    <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                      {rc.invoice_no || '-'}
                    </td>

                    {/* Payment Date */}
                    <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                      {rc.payment_date ? new Date(rc.payment_date).toLocaleDateString('th-TH') : '-'}
                    </td>

                    {/* Amount */}
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#0284c7', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      {Number(rc.total_amount || rc.amount_paid || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>
                      <ActionDropdown
                        items={[
                          {
                            label: 'ดูตัวอย่าง / พิมพ์',
                            icon: <Printer size={16} className="menu-icon" />,
                            onClick: () => handleOpenPreview(rc)
                          },
                          {
                            label: 'แก้ไข',
                            icon: <Edit size={16} className="menu-icon" />,
                            onClick: () => handleOpenEdit(rc)
                          },
                          {
                            label: 'ลบ',
                            icon: <Trash2 size={16} className="menu-icon danger" />,
                            danger: true,
                            onClick: () => handleDelete(rc)
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

      {/* Receipt Preview Modal */}
      {previewReceipt && (
        <ReceiptPreview
          receipt={previewReceipt}
          onClose={() => setPreviewReceipt(null)}
        />
      )}

    </div>
  );
}
