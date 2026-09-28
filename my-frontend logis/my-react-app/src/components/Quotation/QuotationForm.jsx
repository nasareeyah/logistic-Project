import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Pencil, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  FolderOpen,
  MoreVertical,
  Edit,
  User,
  FileText,
  Printer
} from 'lucide-react';
import { createQuotation, updateQuotation, deleteQuotation, fetchCustomerList } from './apiQuotation';
import QuotationPreview from './QuotationPreview';
import ActionDropdown from '../Common/ActionDropdown';
import { useLanguage } from '../../context/LanguageContext';

// =========================================================================
// 🛠️ HELPER FUNCTIONS
// =========================================================================
const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFutureDate = (fromDateStr, days = 30) => {
  const d = fromDateStr ? new Date(fromDateStr) : new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateOnly = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
//รันเลขใบเสนอราคาใหม่ทุกวัน โดยใช้วันที่เป็น prefix และเลขลำดับต่อท้าย
const generateQuotationNo = (dateStr, documents = []) => {
  let d = new Date();
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const datePrefix = `QT-${year}${month}${day}-`;
  const maxSeq = (Array.isArray(documents) ? documents : []).reduce((max, doc) => {
    const no = doc && doc.document_no ? String(doc.document_no) : '';
    if (!no.startsWith(datePrefix)) return max;
    const m = /^QT-\d{8}-(\d{4})$/.exec(no);
    if (!m) return max;
    const seq = parseInt(m[1], 10);
    return isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  return `${datePrefix}${String(maxSeq + 1).padStart(4, '0')}`;
};

export default function QuotationForm({ customers: propCustomers = [], documents: propDocuments = [], fetchData, consigners = [], consignees = [], serviceTypes = [] }) {
  const { lang, t, tText, formatDateLocale } = useLanguage();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [currentStep, setCurrentStep] = useState(1); // 1..5

  const [customerList, setCustomerList] = useState(Array.isArray(propCustomers) ? propCustomers : []);
  const [quotationList, setQuotationList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Sync props
  useEffect(() => {
    if (Array.isArray(propCustomers) && propCustomers.length > 0) {
      setCustomerList(propCustomers);
    } else {
      fetchCustomerList()
        .then(data => {
          if (Array.isArray(data)) setCustomerList(data);
          else setCustomerList([]);
        })
        .catch(console.error);
    }
  }, [propCustomers]);

  useEffect(() => {
    if (Array.isArray(propDocuments)) {
      setQuotationList(propDocuments.filter(d => d.document_type === 'Quotation'));
    }
  }, [propDocuments]);

  // Form State
  const initialIssueDate = getTodayDate();
  const [formData, setFormData] = useState({
    documentNo: generateQuotationNo(initialIssueDate, propDocuments),
    issueDate: initialIssueDate,
    expiryDate: getFutureDate(initialIssueDate, 30),
    salesperson: '',
    projectName: '',

    // Step 2 Customer fields
    customerId: '',
    customerName: '',
    address: '',
    taxId: '',
    contactPerson: '',
    phone: '',
    email: '',

    // Step 5 Remark
    remark: ''
  });

  // Step 3 Routes
  const [routes, setRoutes] = useState([
    { id: 1, origin: '', destination: '' }
  ]);

  // Step 4 Service Items
  const [items, setItems] = useState([
    { id: 1, serviceType: '', quantity: 1, unitQuantity: '', pricePerUnit: 0, unit: 'THB', total: 0 }
  ]);

  // Update Quotation No and Expiry Date when Issue Date changes
  const handleIssueDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      issueDate: newDate,
      documentNo: generateQuotationNo(newDate, propDocuments),
      expiryDate: getFutureDate(newDate, 30)
    }));
  };

  // Open Create Form Mode
  const startCreateNew = () => {
    const today = getTodayDate();
    setFormData({
      documentNo: generateQuotationNo(today, propDocuments),
      issueDate: today,
      expiryDate: getFutureDate(today, 30),
      salesperson: '',
      projectName: '',

      customerId: '',
      customerName: '',
      address: '',
      taxId: '',
      contactPerson: '',
      phone: '',
      email: '',

      remark: ''
    });
    setRoutes([{ id: 1, origin: '', destination: '' }]);
    setItems([{ id: 1, serviceType: '', quantity: 1, unitQuantity: '', pricePerUnit: 0, unit: 'THB', total: 0 }]);
    setEditingDocId(null);
    setCustomerSearch('');
    setCurrentStep(1);
    setViewMode('create');
  };

  // Step 2 Customer Selection Handler
  const handleSelectCustomerCard = (cust) => {
    if (!cust) {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        address: '',
        taxId: '',
        contactPerson: '',
        phone: '',
        email: ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      customerId: cust.customer_id || cust.id,
      customerName: cust.customer_name || cust.name || '',
      address: cust.address || '',
      taxId: cust.tax_id || cust.taxId || '',
      contactPerson: cust.contact_person || cust.contactPerson || '',
      phone: cust.phone || '',
      email: cust.email || ''
    }));
  };

  // Route Handlers
  const handleAddRoute = () => {
    setRoutes(prev => [...prev, { id: Date.now(), origin: '', destination: '' }]);
  };
  const handleRemoveRoute = (id) => {
    if (routes.length > 1) setRoutes(prev => prev.filter(r => r.id !== id));
  };
  const handleRouteChange = (id, field, value) => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Service Item Handlers
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), serviceType: '', quantity: 1, unitQuantity: '', pricePerUnit: 0, unit: 'THB', total: 0 }
    ]);
  };
  const handleRemoveItem = (id) => {
    if (items.length > 1) setItems(prev => prev.filter(i => i.id !== id));
  };
  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'pricePerUnit') {
          const qty = field === 'quantity' ? Number(value) : Number(item.quantity);
          const price = field === 'pricePerUnit' ? Number(value) : Number(item.pricePerUnit);
          updated.total = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };

  // Subtotal & Grand Total
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  // const vatAmount = subtotal * 0.07;
  const grandTotal = subtotal;

  // Edit Handler — โหลดข้อมูลเอกสารมาใส่ในฟอร์ม
  const handleEditQuotation = async (doc) => {
    const origin = doc.consigner_address || '';
    const destination = doc.consignee_address || '';

    setFormData({
      documentNo: doc.document_no || '',
      issueDate: formatDateOnly(doc.document_date) || getTodayDate(),
      expiryDate: formatDateOnly(doc.valid_until) || getFutureDate(doc.document_date, 30),
      salesperson: doc.sale_name || '',
      projectName: doc.job_name || '',
      customerId: doc.customer_id || '',
      customerName: '',
      address: '',
      taxId: '',
      contactPerson: '',
      phone: '',
      email: '',
      remark: doc.remark || ''
    });
    setRoutes([{ id: 1, origin, destination }]);
    setEditingDocId(doc.document_id);

    // โหลด items จาก document_items
    try {
      const res = await fetch(`http://localhost:3000/api/document_items?document_id=${doc.document_id}`);
      const docItems = await res.json();
      if (docItems.length > 0) {
        setItems(docItems.map((di, idx) => ({
          id: Date.now() + idx,
          serviceType: di.service_typename || '',
          quantity: Number(di.item_quantity) || 1,
          unitQuantity: di.unit || '',
          pricePerUnit: Number(di.unit_price) || 0,
          unit: 'THB',
          total: (Number(di.item_quantity) || 1) * (Number(di.unit_price) || 0)
        })));
      } else {
        setItems([{ id: Date.now(), serviceType: '', quantity: 1, unitQuantity: '', pricePerUnit: 0, unit: 'THB', total: 0 }]);
      }
    } catch (e) {
      console.error('Load items error:', e);
    }

    setCurrentStep(1);
    setViewMode('create');
  };

  // Delete Handler
  const handleDeleteQuotation = async (docId) => {
    if (!confirm(lang === 'th' ? 'ยืนยันการลบเอกสารนี้?' : 'Are you sure you want to delete this document?')) return;
    try {
      await deleteQuotation(docId);
      alert(lang === 'th' ? 'ลบเอกสารสำเร็จ' : 'Document deleted successfully');
      if (fetchData) fetchData();
    } catch (err) {
      alert((lang === 'th' ? 'ลบไม่สำเร็จ: ' : 'Failed to delete: ') + err.message);
    }
  };

  // Preview Handler
  const handlePreview = async (doc) => {
    try {
      const res = await fetch(`http://localhost:3000/api/document_items?document_id=${doc.document_id}`);
      const items = await res.json();
      setPreviewData({ doc, items: Array.isArray(items) ? items : [] });
    } catch (err) {
      console.error('Preview load error:', err);
      alert((lang === 'th' ? 'โหลดข้อมูลพรีวิวไม่สำเร็จ: ' : 'Failed to load preview: ') + err.message);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDocId) {
        await updateQuotation(editingDocId, { formData, routes, items, grandTotal });
        alert(lang === 'th' ? 'แก้ไขใบเสนอราคาเรียบร้อยแล้ว!' : 'Quotation updated successfully!');
        setEditingDocId(null);
      } else {
        await createQuotation({ formData, routes, items, grandTotal });
        alert(lang === 'th' ? 'สร้างใบเสนอราคาเรียบร้อยแล้ว!' : 'Quotation created successfully!');
      }
      if (fetchData) fetchData();
      setViewMode('list');
    } catch (err) {
      console.error('Submit Quotation Error:', err);
      alert((lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก: ' : 'Error saving quotation: ') + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for customer name in list view
  const getCustomerName = (custObjOrId) => {
    if (!custObjOrId) return '-';
    if (typeof custObjOrId === 'object' && custObjOrId.customer_name) return custObjOrId.customer_name;
    const found = Array.isArray(customerList) ? customerList.find(c => String(c.customer_id) === String(custObjOrId)) : null;
    return found ? found.customer_name : String(custObjOrId);
  };

  // Filtered List for Table
  const filteredQuotations = quotationList.filter(doc => {
    const qNo = doc.document_no || doc.document_id || '';
    const job = doc.job_name || doc.project || '';
    const custName = getCustomerName(doc.customer_id);
    const q = searchQuery.toLowerCase();
    return qNo.toLowerCase().includes(q) || job.toLowerCase().includes(q) || custName.toLowerCase().includes(q);
  });

  // Steps configuration
  const steps = [
    { number: 1, title: tText('ข้อมูลเอกสาร', 'Document Info') },
    { number: 2, title: tText('ลูกค้า', 'Customer') },
    { number: 3, title: tText('เส้นทาง/สถานที่', 'Route') },
    { number: 4, title: tText('รายการบริการ', 'Service Items') },
    { number: 5, title: tText('เงื่อนไขและหมายเหตุ', 'Terms & Notes') }
  ];

  // =========================================================================
  // RENDER LIST VIEW (Image 1)
  // =========================================================================
  if (viewMode === 'list') {
    return (
      <div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{t('quotePageTitle', 'ใบเสนอราคา (Quotation)')}</h2>
            <p className="dashboard-view-subtitle" style={{ margin: 0 }}>
              {t('quotePageSubtitle', 'สร้างและจัดการใบเสนอราคาสำหรับลูกค้า พร้อมอิงราคางานบริการขนส่ง')}
            </p>
          </div>
          <button className="btn-primary" onClick={startCreateNew}>
            <Plus size={16} />
            <span>{t('quoteCreateBtn', 'สร้างใบเสนอราคาใหม่')}</span>
          </button>
        </div>

        {/* Table Panel */}
        <div className="dashboard-card-panel" style={{ padding: '24px 0 0 0' }}>
          <div style={{ padding: '0 24px' }}>
            <div className="panel-search-bar">
              <Search size={16} className="panel-search-icon" />
              <input 
                type="text" 
                placeholder={t('quoteSearchPlaceholder', 'ค้นหาตามเลขที่ใบเสนอราคา, ลูกค้า, หรือโปรเจกต์...')} 
                className="panel-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="custom-clean-table">
              <thead>
                <tr>
                  <th style={{ width: '22%', paddingLeft: '24px', whiteSpace: 'nowrap' }}>{t('quoteColNo', 'Quotation #')}</th>
                  <th style={{ width: '28%', whiteSpace: 'nowrap' }}>{t('quoteColCustomer', 'ลูกค้า (Customer)')}</th>
                  <th style={{ width: '24%', whiteSpace: 'nowrap' }}>{t('quoteColProject', 'โปรเจกต์ / รายละเอียด')}</th>
                  <th style={{ width: '16%', whiteSpace: 'nowrap' }}>{t('quoteColDate', 'วันที่ออกเอกสาร')}</th>
                  <th style={{ width: '10%', textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>{t('actionActions', 'จัดการ')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map(doc => {
                  const docId = doc.document_id || doc._id;
                  return (
                    <tr key={docId}>
                      <td style={{ paddingLeft: '24px', fontWeight: '700', color: '#0284c7', whiteSpace: 'nowrap' }}>
                        <span
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handlePreview(doc)}
                          title={tText('คลิกเพื่อดูตัวอย่าง/พิมพ์ใบเสนอราคา', 'Click to preview / print')}
                        >
                          <FileText size={15} />
                          {doc.document_no || doc.document_id}
                        </span>
                      </td>
                      <td style={{ color: '#1e293b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {getCustomerName(doc.customer_id)}
                      </td>
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                        {doc.job_name || doc.project || '-'}
                      </td>
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                        {doc.document_date ? formatDateLocale(doc.document_date) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>
                        <ActionDropdown
                          items={[
                            {
                              label: t('actionPrint', 'ดูตัวอย่าง / พิมพ์'),
                              icon: <Printer size={16} className="menu-icon" />,
                              onClick: () => handlePreview(doc)
                            },
                            {
                              label: t('actionEdit', 'แก้ไข'),
                              icon: <Edit size={16} className="menu-icon" />,
                              onClick: () => handleEditQuotation(doc)
                            },
                            {
                              label: t('actionDelete', 'ลบ'),
                              icon: <Trash2 size={16} className="menu-icon danger" />,
                              danger: true,
                              onClick: () => handleDeleteQuotation(doc.document_id)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredQuotations.length === 0 && (
            <div className="empty-state-wrapper" style={{ padding: '36px', textAlign: 'center' }}>
              <FolderOpen size={44} className="empty-state-icon" style={{ opacity: 0.4, margin: '0 auto 8px auto' }} />
              <p className="empty-state-text" style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                {searchQuery ? tText('ไม่พบข้อมูลใบเสนอราคาที่ตรงกับการค้นหา', 'No quotations found matching your search.') : t('quoteEmptyList', 'ยังไม่มีใบเสนอราคาในระบบ คลิก "สร้างใบเสนอราคาใหม่" เพื่อเริ่มต้น')}
              </p>
            </div>
          )}
        </div>

        {previewData && (
          <QuotationPreview
            doc={previewData.doc}
            items={previewData.items}
            customerList={customerList}
            onClose={() => setPreviewData(null)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER CREATE NEW QUOTATION MULTI-STEP WIZARD
  // =========================================================================
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
          <span>{tText('ย้อนกลับไปหน้ารายการใบเสนอราคา', 'Back to quotations')}</span>
        </button>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '24px', textAlign: 'left' }}>
        {editingDocId ? tText('แก้ไขใบเสนอราคา (Edit Quotation)', 'Edit Quotation') : tText('สร้างใบเสนอราคาใหม่ (New Quotation)', 'Create New Quotation')}
      </h2>

      {/* Main Form Container Card */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">{tText('เลขที่ใบเสนอราคา (อัตโนมัติ)', 'Quotation No. (auto)')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.documentNo || ''} 
                  disabled 
                  style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{tText('วันที่ออกเอกสาร', 'Issue Date')}</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.issueDate || ''}
                  onChange={e => handleIssueDateChange(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">{tText('วันหมดอายุ / ใช้ได้ถึง', 'Expiry Date')}</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.expiryDate || ''}
                  onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{tText('พนักงานขาย', 'Salesperson')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={tText('ชื่อพนักงานขาย...', 'Salesperson name...')} 
                  value={formData.salesperson || ''}
                  onChange={e => setFormData({ ...formData, salesperson: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">{tText('ชื่องาน / โครงการ', 'Project Name')}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={tText('ชื่องาน / โครงการ...', 'Project / Job name...')} 
                value={formData.projectName || ''}
                onChange={e => setFormData({ ...formData, projectName: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Customer */}
        {currentStep === 2 && (
          <div style={{ textAlign: 'left' }}>
            <div className="step-header-title-row">
              <User size={18} color="#0284c7" />
              <span>{tText('เลือกลูกค้า', 'Select Customer')}</span>
            </div>

            <div className="customer-search-field-container">
              <Search size={16} className="search-icon-inside" />
              <input 
                type="text" 
                placeholder={tText('ค้นหาตามชื่อบริษัท, ผู้ติดต่อ, เบอร์โทร, เลขภาษี...', 'Search by company, contact, phone, tax ID...')} 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {Array.isArray(customerList) && customerList
                .filter(c => {
                  const q = customerSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (c.customer_name || c.name || '').toLowerCase().includes(q) ||
                    (c.contact_person || c.contactPerson || '').toLowerCase().includes(q) ||
                    (c.phone || '').toLowerCase().includes(q) ||
                    (c.tax_id || c.taxId || '').toLowerCase().includes(q);
                })
                .map((cust, idx) => {
                  const isSelected = String(formData.customerId) === String(cust.customer_id || cust.id);

                  return (
                    <div
                      key={cust.customer_id || cust.id || idx}
                      className={`single-customer-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectCustomerCard(cust)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="cust-name">{cust.customer_name || cust.name}</div>
                        {isSelected && <Check size={18} color="#0284c7" />}
                      </div>
                      <div className="cust-contact">{cust.contact_person || cust.contactPerson || tText('ผู้ติดต่อ', 'Contact Person')}</div>
                      <div className="cust-phone">{cust.phone || tText('เบอร์โทรศัพท์', 'Phone number')}</div>
                    </div>
                  );
                })}
            </div>

            {Array.isArray(customerList) && customerList.filter(c => {
              const q = customerSearch.toLowerCase().trim();
              if (!q) return true;
              return (c.customer_name || c.name || '').toLowerCase().includes(q) ||
                (c.contact_person || c.contactPerson || '').toLowerCase().includes(q) ||
                (c.phone || '').toLowerCase().includes(q) ||
                (c.tax_id || c.taxId || '').toLowerCase().includes(q);
            }).length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <User size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div style={{ fontSize: '15px', fontWeight: 500 }}>{tText('ไม่พบข้อมูลลูกค้า', 'No customers found')}</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>{tText('ลองค้นหาด้วยคำอื่น หรือเพิ่มข้อมูลลูกค้าใน ข้อมูลหลัก > ลูกค้า', 'Try another search term or add customer in Master Data > Customers')}</div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Route */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{tText('เส้นทางการขนส่ง', 'Transportation Routes')}</h3>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleAddRoute}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}
              >
                <Plus size={16} />
                <span>{tText('เพิ่มเส้นทาง', 'Add Route')}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {routes.map((route) => (
                <div key={route.id} style={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 40px',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', color: '#64748b' }}>{tText('ต้นทาง (สถานที่รับสินค้า)', 'Origin (Pickup Location)')}</label>
                    <input 
                      list="origin-list"
                      type="text" 
                      className="form-input" 
                      placeholder={tText('ต้นทาง (เช่น สงขลา)...', 'Origin (e.g. Songkhla)...')} 
                      value={route.origin}
                      onChange={e => handleRouteChange(route.id, 'origin', e.target.value)}
                    />
                    <datalist id="origin-list">
                      {Array.isArray(consigners) && consigners.map(c => (
                        <option key={c.consigner_id || c.id} value={c.address} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', color: '#64748b' }}>{tText('ปลายทาง (สถานที่ส่งมอบ)', 'Destination (Delivery Location)')}</label>
                    <input 
                      list="destination-list"
                      type="text" 
                      className="form-input" 
                      placeholder={tText('ปลายทาง (เช่น ชลบุรี)...', 'Destination (e.g. Chonburi)...')} 
                      value={route.destination}
                      onChange={e => handleRouteChange(route.id, 'destination', e.target.value)}
                    />
                    <datalist id="destination-list">
                      {Array.isArray(consignees) && consignees.map(c => (
                        <option key={c.consignee_id || c.id} value={c.address} />
                      ))}
                    </datalist>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '18px' }}>
                    {routes.length > 1 && (
                      <button 
                        type="button" 
                        className="btn-action-delete"
                        onClick={() => handleRemoveRoute(route.id)}
                        title={tText('ลบเส้นทางนี้', 'Delete route')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Service Items */}
        {currentStep === 4 && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{tText('รายการบริการ', 'Service Items')}</h3>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleAddItem}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}
              >
                <Plus size={16} />
                <span>{tText('เพิ่มรายการ', 'Add Item')}</span>
              </button>
            </div>

            {/* Service Items Table Header */}
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', width: '28%' }}>{tText('ประเภทบริการ', 'Service Type')}</th>
                    <th style={{ padding: '8px 12px', width: '10%', textAlign: 'center' }}>{tText('จำนวน', 'Qty')}</th>
                    <th style={{ padding: '8px 12px', width: '15%', textAlign: 'center' }}>{tText('หน่วยนับ', 'Unit Quantity')}</th>
                    <th style={{ padding: '8px 12px', width: '16%', textAlign: 'right' }}>{tText('ราคา/หน่วย', 'Unit Price')}</th>
                    <th style={{ padding: '8px 12px', width: '12%', textAlign: 'center' }}>{tText('สกุลเงิน', 'Currency')}</th>
                    <th style={{ padding: '8px 12px', width: '15%', textAlign: 'right' }}>{tText('รวมเงิน', 'Total')}</th>
                    <th style={{ padding: '8px 12px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 6px' }}>
                        <input
                          list={`service-type-${item.id}`}
                          type="text"
                          className="form-input"
                          style={{ fontSize: '13px', padding: '8px' }}
                          placeholder={tText('เลือกหรือพิมพ์ประเภทบริการ...', 'Select or type service type...')}
                          value={item.serviceType}
                          onChange={e => handleItemChange(item.id, 'serviceType', e.target.value)}
                        />
                        <datalist id={`service-type-${item.id}`}>
                          {(Array.isArray(serviceTypes) ? serviceTypes : []).map(st => (
                            <option key={st.service_typeid} value={st.service_typename} />
                          ))}
                        </datalist>
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <input 
                          type="number"
                          min="1"
                          className="form-input"
                          style={{ fontSize: '13px', padding: '8px', textAlign: 'center' }}
                          value={item.quantity}
                          onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <input 
                          type="text"
                          className="form-input"
                          style={{ fontSize: '13px', padding: '8px', textAlign: 'center' }}
                          placeholder={tText('เช่น เที่ยว, คัน, กล่อง', 'e.g. trip, truck, box')}
                          value={item.unitQuantity}
                          onChange={e => handleItemChange(item.id, 'unitQuantity', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <input 
                          type="number"
                          min="0"
                          className="form-input"
                          style={{ fontSize: '13px', padding: '8px', textAlign: 'right' }}
                          value={item.pricePerUnit}
                          onChange={e => handleItemChange(item.id, 'pricePerUnit', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <select 
                          className="form-select"
                          style={{ fontSize: '13px', padding: '8px', textAlign: 'center' }}
                          value={item.unit}
                          onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                        >
                          <option value="THB">THB</option>
                          <option value="USD">USD</option>
                          <option value="MYR">MYR</option>
                          <option value="CNY">CNY</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                        {Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                        {items.length > 1 && (
                          <button 
                            type="button" 
                            className="btn-action-delete"
                            onClick={() => handleRemoveItem(item.id)}
                            title={tText('ลบรายการนี้', 'Delete item')}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>{tText('ยอดรวม', 'Subtotal')}</span>
                  <span>THB {subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px', color: '#0284c7', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  <span>{tText('ยอดสุทธิ', 'Grand Total')}</span>
                  <span>THB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Terms & Notes */}
        {currentStep === 5 && (
          <div style={{ textAlign: 'left' }}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">{tText('หมายเหตุ / เงื่อนไขการขนส่ง', 'Terms & Notes')}</label>
              <textarea 
                className="form-textarea"
                rows="5"
                placeholder={tText('ระบุเงื่อนไขการขนส่ง หรือหมายเหตุเพิ่มเติม...', 'Enter freight terms or additional notes...')}
                value={formData.remark}
                onChange={e => setFormData({ ...formData, remark: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #e2e8f0', marginTop: '16px' }}>
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
              <span>{t('actionBack', 'ย้อนกลับ')}</span>
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
                <span>{t('actionNext', 'ถัดไป')}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-primary"
                disabled={isSubmitting}
                onClick={handleSubmit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={16} />
                <span>{isSubmitting ? t('actionSaving', 'กำลังบันทึก...') : (editingDocId ? tText('บันทึกการแก้ไข', 'Save Changes') : tText('ยืนยันสร้างใบเสนอราคา', 'Create Quotation'))}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}