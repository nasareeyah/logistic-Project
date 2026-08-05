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
  FolderOpen
} from 'lucide-react';
import { createQuotation, updateQuotation, deleteQuotation, fetchCustomerList } from './apiQuotation';

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

const generateQuotationNo = (dateStr) => {
  let d = new Date();
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  return `QT-${year}${month}${day}-${randomSeq}`;
};

export default function QuotationForm({ customers: propCustomers = [], documents: propDocuments = [], fetchData, consigners = [], consignees = [], serviceTypes = [] }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [currentStep, setCurrentStep] = useState(1); // 1..5

  const [customerList, setCustomerList] = useState(Array.isArray(propCustomers) ? propCustomers : []);
  const [quotationList, setQuotationList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);

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
    documentNo: generateQuotationNo(initialIssueDate),
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
    { id: 1, serviceType: '', description: '', quantity: 1, unitQuantity: 'trip', pricePerUnit: 0, unit: 'THB', total: 0 }
  ]);

  // Update Quotation No and Expiry Date when Issue Date changes
  const handleIssueDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      issueDate: newDate,
      documentNo: generateQuotationNo(newDate),
      expiryDate: getFutureDate(newDate, 30)
    }));
  };

  // Open Create Form Mode
  const startCreateNew = () => {
    const today = getTodayDate();
    setFormData({
      documentNo: generateQuotationNo(today),
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
    setItems([{ id: 1, serviceType: '', description: '', quantity: 1, unitQuantity: 'trip', pricePerUnit: 0, unit: 'THB', total: 0 }]);
    setEditingDocId(null);
    setCurrentStep(1);
    setViewMode('create');
  };

  // Step 2 Customer Selection Handler
  const handleCustomerSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
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

    const selectedCust = Array.isArray(customerList)
      ? customerList.find(c => String(c.customer_id) === String(selectedId) || String(c.id) === String(selectedId))
      : null;

    if (selectedCust) {
      setFormData(prev => ({
        ...prev,
        customerId: selectedCust.customer_id || selectedCust.id,
        customerName: selectedCust.customer_name || selectedCust.name || '',
        address: selectedCust.address || '',
        taxId: selectedCust.tax_id || selectedCust.taxId || '',
        contactPerson: selectedCust.contact_person || selectedCust.contactPerson || '',
        phone: selectedCust.phone || '',
        email: selectedCust.email || ''
      }));
    }
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
      { id: Date.now(), serviceType: '', description: '', quantity: 1, unitQuantity: 'trip', pricePerUnit: 0, unit: 'THB', total: 0 }
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
      issueDate: doc.document_date || getTodayDate(),
      expiryDate: doc.valid_until || getFutureDate(doc.document_date, 30),
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
          description: di.description || '',
          quantity: Number(di.item_quantity) || 1,
          unitQuantity: di.unit || 'trip',
          pricePerUnit: Number(di.unit_price) || 0,
          unit: 'THB',
          total: (Number(di.item_quantity) || 1) * (Number(di.unit_price) || 0)
        })));
      } else {
        setItems([{ id: Date.now(), serviceType: '', description: '', quantity: 1, unitQuantity: 'trip', pricePerUnit: 0, unit: 'THB', total: 0 }]);
      }
    } catch (e) {
      console.error('Load items error:', e);
    }

    setCurrentStep(1);
    setViewMode('create');
  };

  // Delete Handler
  const handleDeleteQuotation = async (docId) => {
    if (!confirm('ยืนยันการลบเอกสารนี้?')) return;
    try {
      await deleteQuotation(docId);
      alert('ลบเอกสารสำเร็จ');
      if (fetchData) fetchData();
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDocId) {
        await updateQuotation(editingDocId, { formData, routes, items, grandTotal });
        alert('แก้ไขใบเสนอราคาเรียบร้อยแล้ว!');
        setEditingDocId(null);
      } else {
        await createQuotation({ formData, routes, items, grandTotal });
        alert('สร้างใบเสนอราคาเรียบร้อยแล้ว!');
      }
      if (fetchData) fetchData();
      setViewMode('list');
    } catch (err) {
      console.error('Submit Quotation Error:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
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
    { number: 1, title: 'Document Info' },
    { number: 2, title: 'Customer' },
    { number: 3, title: 'Route' },
    { number: 4, title: 'Service Items' },
    { number: 5, title: 'Terms & Notes' }
  ];

  // =========================================================================
  // RENDER LIST VIEW (Image 1)
  // =========================================================================
  if (viewMode === 'list') {
    return (
      <div>
        {/* Breadcrumb */}
        <div className="dashboard-breadcrumb">
          <span>Main</span>
          <span className="dashboard-breadcrumb-separator">&gt;</span>
          <span>Document Center</span>
          <span className="dashboard-breadcrumb-separator">&gt;</span>
          <span style={{ color: '#64748b' }}>Quotation</span>
        </div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>Quotation</h2>
            <p className="dashboard-view-subtitle" style={{ margin: 0 }}>Create and manage quotations</p>
          </div>
          <button className="btn-primary" onClick={startCreateNew}>
            <Plus size={16} />
            <span>Create New Quotation</span>
          </button>
        </div>

        {/* Table Panel */}
        <div className="dashboard-card-panel" style={{ padding: '24px 0 0 0' }}>
          <div style={{ padding: '0 24px' }}>
            <div className="panel-search-bar">
              <Search size={16} className="panel-search-icon" />
              <input 
                type="text" 
                placeholder="Search quotations..." 
                className="panel-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-clean-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px', whiteSpace: 'nowrap' }}>Quotation #</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Project</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Customer</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Issue Date</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ width: '130px', textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map(doc => (
                  <tr key={doc.document_id || doc._id}>
                    <td style={{ paddingLeft: '24px', fontWeight: '600', color: '#0284c7', whiteSpace: 'nowrap' }}>
                      {doc.document_no || doc.document_id}
                    </td>
                    <td style={{ color: '#334155', whiteSpace: 'nowrap' }}>{doc.job_name || doc.project || '-'}</td>
                    <td style={{ color: '#334155', whiteSpace: 'nowrap' }}>{getCustomerName(doc.customer_id)}</td>
                    <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{doc.document_date || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="status-badge-pill badge-completed" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                        <span className="status-dot" style={{ backgroundColor: '#94a3b8' }}></span>
                        {doc.status || 'Draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn-action-edit" title="View">
                          <Eye size={16} />
                        </button>
                        <button className="btn-action-edit" title="Edit" onClick={() => handleEditQuotation(doc)}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-action-delete" title="Delete" onClick={() => handleDeleteQuotation(doc.document_id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuotations.length === 0 && (
            <div className="empty-state-wrapper">
              <FolderOpen size={48} className="empty-state-icon" />
              <p className="empty-state-text">No quotations found. Click 'Create New Quotation' to generate one.</p>
            </div>
          )}
        </div>
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
          <span>Back to quotations</span>
        </button>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '24px', textAlign: 'left' }}>
        {editingDocId ? 'Edit Quotation' : 'Create New Quotation'}
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
                <label className="form-label">Quotation No. (auto)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.documentNo || ''} 
                  disabled 
                  style={{ backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Issue Date</label>
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
                <label className="form-label">Expiry Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formData.expiryDate || ''}
                  onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Salesperson</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="ชื่อพนักงานขาย..." 
                  value={formData.salesperson || ''}
                  onChange={e => setFormData({ ...formData, salesperson: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Project Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="ชื่องาน / โครงการ..." 
                value={formData.projectName || ''}
                onChange={e => setFormData({ ...formData, projectName: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Customer */}
        {currentStep === 2 && (
          <div style={{ textAlign: 'left' }}>
            {/* Customer Dropdown */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Select existing customer (optional)</label>
              <select 
                className="form-select"
                value={formData.customerId || ''}
                onChange={handleCustomerSelect}
              >
                <option value="">— Select customer —</option>
                {Array.isArray(customerList) && customerList.map(c => (
                  <option key={c.customer_id || c.id} value={c.customer_id || c.id}>
                    {c.customer_name || c.name} {c.tax_id ? `(${c.tax_id})` : ''}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                * หากไม่มีข้อมูลลูกค้า กรุณาไปเพิ่มข้อมูลลูกค้าใน Master Data &gt; Customers ก่อน
              </span>
            </div>

            {/* Customer Details */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Company / Customer Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="ชื่อบริษัทหรือลูกค้า..." 
                value={formData.customerName || ''}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Address</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="ที่อยู่..." 
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Tax ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="เลขประจำตัวผู้เสียภาษี..." 
                  value={formData.taxId || ''}
                  onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="ผู้ติดต่อ..." 
                  value={formData.contactPerson || ''}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="เบอร์โทร..." 
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="อีเมล..." 
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Route */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Transportation Routes</h3>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleAddRoute}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}
              >
                <Plus size={16} />
                <span>Add Route</span>
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
                    <label className="form-label" style={{ fontSize: '12px', color: '#64748b' }}>Origin</label>
                    <input 
                      list="origin-list"
                      type="text" 
                      className="form-input" 
                      placeholder="ต้นทาง (เช่น สงขลา)..." 
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
                    <label className="form-label" style={{ fontSize: '12px', color: '#64748b' }}>Destination</label>
                    <input 
                      list="destination-list"
                      type="text" 
                      className="form-input" 
                      placeholder="ปลายทาง (เช่น ชลบุรี)..." 
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
                        title="Delete route"
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
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Service Items</h3>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleAddItem}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>
            </div>

            {/* Service Items Table Header */}
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', width: '20%' }}>Service Type</th>
                    <th style={{ padding: '8px 12px' }}>Description</th>
                    <th style={{ padding: '8px 12px', width: '8%', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 12px', width: '13%', textAlign: 'center' }}>Unit Quantity</th>
                    <th style={{ padding: '8px 12px', width: '13%', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '8px 12px', width: '10%', textAlign: 'center' }}>Unit</th>
                    <th style={{ padding: '8px 12px', width: '14%', textAlign: 'right' }}>Total</th>
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
                          placeholder="เลือกหรือพิมพ์ประเภทบริการ..."
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
                          type="text"
                          className="form-input"
                          style={{ fontSize: '13px', padding: '8px' }}
                          placeholder="รายละเอียดบริการ..."
                          value={item.description}
                          onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                        />
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
                          placeholder="เช่น trip, คัน"
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
                  <span>Subtotal</span>
                  <span>THB {subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
                {/* <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>VAT 7%</span>
                  <span>THB {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div> */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px', color: '#0284c7', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  <span>Grand Total</span>
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
              <label className="form-label">Notes (หมายเหตุ)</label>
              <textarea 
                className="form-textarea"
                rows="5"
                placeholder="ระบุเงื่อนไขการขนส่ง หรือหมายเหตุเพิ่มเติม..."
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
                disabled={isSubmitting}
                onClick={handleSubmit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={16} />
                <span>{isSubmitting ? 'Submitting...' : 'Create Quotation'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}