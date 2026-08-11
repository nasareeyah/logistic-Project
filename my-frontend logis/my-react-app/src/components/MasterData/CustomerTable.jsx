import { useState } from 'react';
import {
  Search,
  Plus,
  X,
  FolderOpen,
  Pencil,
  Trash2,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  CreditCard,
  ArrowLeft,
  File
} from 'lucide-react';

function CustomerTable({ customers, onAdd, onUpdate, onDelete, documents = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const countries = [
    'Thailand',
    'Malaysia',
    'Singapore',
    'Laos',
    'Cambodia',
    'Vietnam',
    'Myanmar',
    'China',
    'Japan',
    'South Korea',
    'United States',
    'United Kingdom',
    'Australia',
    'Other'
  ];

  const [formData, setFormData] = useState({
    customer_name: '',
    contact_person: '',
    phone: '',
    email: '',
    tax_id: '',
    address: '',
    streetAddress: '',
    addressLine2: '',
    country: 'Thailand',
    postalCode: '',
    province: '',
    city: ''
  });

  const handleCreateOrSave = (e) => {
    e.preventDefault();
    if (!formData.customer_name) {
      alert('กรุณากรอกชื่อลูกค้า');
      return;
    }

    // Combine address sub-fields into single address string for database
    const addressParts = [];
    if (formData.streetAddress) addressParts.push(formData.streetAddress);
    if (formData.addressLine2) addressParts.push(formData.addressLine2);
    
    const locationParts = [formData.city, formData.province, formData.postalCode].filter(Boolean).join(' ');
    if (locationParts) addressParts.push(locationParts);
    if (formData.country) addressParts.push(formData.country);

    const combinedAddress = addressParts.length > 0 ? addressParts.join(', ') : formData.address;

    const dataToSave = {
      customer_name: formData.customer_name,
      contact_person: formData.contact_person,
      phone: formData.phone,
      email: formData.email,
      tax_id: formData.tax_id,
      address: combinedAddress
    };

    if (modalMode === 'add') {
      onAdd(dataToSave, () => {
        closeModal();
      });
    } else {
      onUpdate(editingCustomerId, dataToSave, () => {
        closeModal();
      });
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      customer_name: '',
      contact_person: '',
      phone: '',
      email: '',
      tax_id: '',
      address: '',
      streetAddress: '',
      addressLine2: '',
      country: 'Thailand',
      postalCode: '',
      province: '',
      city: ''
    });
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setModalMode('edit');
    setEditingCustomerId(c.customer_id);
    setFormData({
      customer_name: c.customer_name || '',
      contact_person: c.contact_person || '',
      phone: c.phone || '',
      email: c.email || '',
      tax_id: c.tax_id || '',
      address: c.address || '',
      streetAddress: c.address || '',
      addressLine2: '',
      country: 'Thailand',
      postalCode: '',
      province: '',
      city: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      customer_name: '',
      contact_person: '',
      phone: '',
      email: '',
      tax_id: '',
      address: '',
      streetAddress: '',
      addressLine2: '',
      country: 'Thailand',
      postalCode: '',
      province: '',
      city: ''
    });
    setEditingCustomerId(null);
  };

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(c =>
      (c.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];
  const selectedCustomer = Array.isArray(customers)
    ? customers.find(c => String(c.customer_id) === String(selectedCustomerId))
    : null;

  const quotationsCount = selectedCustomer && Array.isArray(documents)
    ? documents.filter(doc => String(doc.customer_id) === String(selectedCustomer.customer_id) && doc.document_type === 'Quotation').length
    : 0;

  const invoicesCount = selectedCustomer && Array.isArray(documents)
    ? documents.filter(doc => String(doc.customer_id) === String(selectedCustomer.customer_id) && doc.document_type === 'Invoice').length
    : 0;

  if (selectedCustomerId && selectedCustomer) {
    const fields = [
      { label: 'Contact Person', value: selectedCustomer.contact_person, icon: User },
      { label: 'Phone', value: selectedCustomer.phone, icon: Phone },
      { label: 'Email', value: selectedCustomer.email, icon: Mail },
      { label: 'Tax ID', value: selectedCustomer.tax_id, icon: FileText },
      { label: 'Address', value: selectedCustomer.address, icon: MapPin }
    ];

    return (
      <div>
        {/* Breadcrumb */}
        <div className="dashboard-breadcrumb">
          <span>Master Data</span>
          <span className="dashboard-breadcrumb-separator">&gt;</span>
          <span 
            onClick={() => setSelectedCustomerId(null)} 
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Customers
          </span>
          <span className="dashboard-breadcrumb-separator">&gt;</span>
          <span style={{ color: '#64748b' }}>{selectedCustomer.customer_name}</span>
        </div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{selectedCustomer.customer_name}</h2>
            <p className="dashboard-view-subtitle" style={{ margin: 0 }}>Customer profile and history</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setSelectedCustomerId(null)} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button 
              className="btn-primary" 
              onClick={() => openEditModal(selectedCustomer)} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Pencil size={16} />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Info Grid (2 Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Card 1: Customer Profile */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            border: '1px solid #cbd5e1', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            textAlign: 'left' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                backgroundColor: '#eff6ff', 
                color: '#3b82f6', 
                borderRadius: '8px', 
                padding: '10px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Building size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{selectedCustomer.customer_name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              {fields.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                    <f.icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginTop: '2px', wordBreak: 'break-word' }}>{f.value || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Bookings */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            border: '1px solid #cbd5e1', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '180px' 
          }}>
            <div style={{ backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '50%', padding: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={24} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e3a8a', lineHeight: '1' }}>0</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '8px' }}>Bookings</div>
          </div>
        </div>

        {/* Booking History Panel */}
        <div className="dashboard-card-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, textAlign: 'left' }}>Booking History</h3>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>0 records</span>
          </div>
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No bookings for this customer yet.
          </div>
        </div>

        {/* Modal Dialog inside detail view so Edit modal still works */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <h3 className="modal-title">Edit Customer</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOrSave}>
                <div className="modal-body" style={{ textAlign: 'left' }}>
                  {/* Company Name */}
                  <div className="form-group">
                    <label className="form-label">
                      Company Name
                      <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น บริษัท เอสซีจี จำกัด..."
                      className="form-input"
                      value={formData.customer_name}
                      onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                    />
                  </div>

                  {/* Contact Person & Phone */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Contact Person</label>
                      <input
                        type="text"
                        placeholder="ชื่อผู้ติดต่อ..."
                        className="form-input"
                        value={formData.contact_person}
                        onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        placeholder="เบอร์โทร..."
                        className="form-input"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Email & Tax ID */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        placeholder="อีเมล..."
                        className="form-input"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tax ID</label>
                      <input
                        type="text"
                        placeholder="เลขผู้เสียภาษี..."
                        className="form-input"
                        value={formData.tax_id}
                        onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="form-group">
                    <label className="form-label">
                      Street Address
                      <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="House No., Building, Street"
                      className="form-input"
                      value={formData.streetAddress}
                      onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="form-group">
                    <label className="form-label">Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Apartment, Suite, Building, Floor"
                      className="form-input"
                      value={formData.addressLine2}
                      onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                    />
                  </div>

                  {/* Country & Postal Code */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Country
                        <span className="form-label-required">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                      >
                        {countries.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Postal Code
                        <span className="form-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="50000"
                        className="form-input"
                        value={formData.postalCode}
                        onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Province & City */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Province</label>
                      <input
                        type="text"
                        placeholder="State / Province"
                        className="form-input"
                        value={formData.province}
                        onChange={e => setFormData({ ...formData, province: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        placeholder="City"
                        className="form-input"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>

                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="dashboard-breadcrumb">
        <span>Master Data</span>
        <span className="dashboard-breadcrumb-separator">&gt;</span>
        <span style={{ color: '#64748b' }}>Customers</span>
      </div>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>Customers</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>Manage your customer database</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Card table container */}
      <div className="dashboard-card-panel" style={{ padding: '24px 0 0 0' }}>
        {/* Search bar inside the panel */}
        <div style={{ padding: '0 24px' }}>
          <div className="panel-search-bar">
            <Search size={16} className="panel-search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              className="panel-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clean UI table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-clean-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Company Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th style={{ width: '100px', textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.customer_id}>
                  <td style={{ paddingLeft: '24px' }}>
                    <button
                      onClick={() => setSelectedCustomerId(c.customer_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#0284c7',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {c.customer_name}
                    </button>
                  </td>
                  <td>{c.contact_person || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <button className="btn-action-edit" onClick={() => openEditModal(c)}>
                      <Pencil size={16} />
                    </button>
                    <button className="btn-action-delete" onClick={() => onDelete(c.customer_id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state container */}
        {filteredCustomers.length === 0 && (
          <div className="empty-state-wrapper">
            <FolderOpen size={48} className="empty-state-icon" />
            <p className="empty-state-text">No customers yet. Click 'Add Customer' to create one.</p>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' ? 'Add Customer' : 'Edit Customer'}
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrSave}>
              <div className="modal-body">
                {/* Company Name */}
                <div className="form-group">
                  <label className="form-label">
                    Company Name
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น บริษัท เอสซีจี จำกัด..."
                    className="form-input"
                    value={formData.customer_name}
                    onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>

                {/* Contact Person & Phone */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input
                      type="text"
                      placeholder="ชื่อผู้ติดต่อ..."
                      className="form-input"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      placeholder="เบอร์โทร..."
                      className="form-input"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email & Tax ID */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      placeholder="อีเมล..."
                      className="form-input"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax ID</label>
                    <input
                      type="text"
                      placeholder="เลขผู้เสียภาษี..."
                      className="form-input"
                      value={formData.tax_id}
                      onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                    />
                  </div>
                </div>

                {/* Street Address */}
                <div className="form-group">
                  <label className="form-label">
                    Street Address
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="House No., Building, Street"
                    className="form-input"
                    value={formData.streetAddress}
                    onChange={e => setFormData({ ...formData, streetAddress: e.target.value })}
                  />
                </div>

                {/* Address Line 2 */}
                <div className="form-group">
                  <label className="form-label">Address Line 2</label>
                  <input
                    type="text"
                    placeholder="Apartment, Suite, Building, Floor"
                    className="form-input"
                    value={formData.addressLine2}
                    onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                  />
                </div>

                {/* Country & Postal Code */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Country
                      <span className="form-label-required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                    >
                      {countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Postal Code
                      <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="50000"
                      className="form-input"
                      value={formData.postalCode}
                      onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>
                </div>

                {/* Province & City */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Province</label>
                    <input
                      type="text"
                      placeholder="State / Province"
                      className="form-input"
                      value={formData.province}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      className="form-input"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerTable;