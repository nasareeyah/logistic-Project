import { useState, useEffect } from 'react';
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
  File,
  MoreVertical,
  Edit,
  Inbox
} from 'lucide-react';
import ActionDropdown from '../Common/ActionDropdown';
import { useLanguage } from '../../context/LanguageContext';

function CustomerTable({ customers, onAdd, onUpdate, onDelete, documents = [] }) {
  const { lang, t, tText } = useLanguage();
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

    const street = formData.streetAddress || formData.address || '';

    const dataToSave = {
      customer_name: formData.customer_name,
      contact_person: formData.contact_person,
      phone: formData.phone,
      email: formData.email,
      tax_id: formData.tax_id,
      address: street || formData.address || '',
      streetAddress: formData.streetAddress,
      addressLine2: formData.addressLine2,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postalCode,
      country: formData.country || 'Thailand'
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

  // Helper to parse a combined address string back into individual parts
  const parseAddress = (addressStr) => {
    const result = {
      streetAddress: '',
      addressLine2: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Thailand'
    };

    if (!addressStr) return result;

    const parts = addressStr.split(',').map(p => p.trim());
    const knownCountries = ['Thailand', 'Malaysia', 'Singapore', 'Laos', 'Cambodia', 'Vietnam', 'Myanmar', 'China', 'Japan', 'South Korea'];

    // 1. Extract Country
    while (parts.length > 0 && knownCountries.includes(parts[parts.length - 1])) {
      result.country = parts.pop();
    }

    // 2. Extract Postal Code
    for (let i = parts.length - 1; i >= 0; i--) {
      const match = parts[i].match(/\b\d{5,6}\b/);
      if (match) {
        result.postalCode = match[0];
        parts[i] = parts[i].replace(match[0], '').trim();
        break;
      }
    }

    // Clean up empty parts that might have been left from removing postal code
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!parts[i]) {
        parts.splice(i, 1);
      }
    }

    // 3. Extract Province and City
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      const spaceParts = lastPart.split(/\s+/).filter(Boolean);
      
      if (spaceParts.length >= 2 && parts.length === 2) {
        // e.g. parts = ["12/22", "Hatyai Songkla"] -> city: "Hatyai", province: "Songkla"
        result.province = spaceParts.pop();
        result.city = spaceParts.join(' ');
        parts.pop();
        result.streetAddress = parts.join(', ');
      } else if (parts.length >= 3) {
        // e.g. parts = ["12/22", "Hatyai", "Songkla"]
        result.province = parts.pop();
        result.city = parts.pop();
        result.streetAddress = parts.join(', ');
      } else if (parts.length === 2) {
        // e.g. parts = ["12/22", "Songkla"]
        result.city = parts.pop();
        result.streetAddress = parts[0];
      } else if (parts.length === 1) {
        // e.g. parts = ["12/22 Hatyai Songkla"]
        const spacePartsAll = parts[0].split(/\s+/).filter(Boolean);
        if (spacePartsAll.length >= 3) {
          result.province = spacePartsAll.pop();
          result.city = spacePartsAll.pop();
          result.streetAddress = spacePartsAll.join(' ');
        } else if (spacePartsAll.length === 2) {
          result.city = spacePartsAll.pop();
          result.streetAddress = spacePartsAll[0];
        } else {
          result.streetAddress = parts[0];
        }
      }
    }

    return result;
  };

  const openEditModal = (c) => {
    setModalMode('edit');
    setEditingCustomerId(c.customer_id);
    const hasStructuredAddress = Boolean(c.city || c.province || c.postal_code || c.street_address);
    const parsedAddr = hasStructuredAddress
      ? {
          streetAddress: c.street_address || c.address || '',
          addressLine2: c.address_line2 || '',
          city: c.city || '',
          province: c.province || '',
          postalCode: c.postal_code || '',
          country: c.country || 'Thailand'
        }
      : parseAddress(c.address || '');

    setFormData({
      customer_name: c.customer_name || '',
      contact_person: c.contact_person || '',
      phone: c.phone || '',
      email: c.email || '',
      tax_id: c.tax_id || '',
      address: c.address || '',
      streetAddress: parsedAddr.streetAddress,
      addressLine2: parsedAddr.addressLine2,
      country: parsedAddr.country || 'Thailand',
      postalCode: parsedAddr.postalCode,
      province: parsedAddr.province,
      city: parsedAddr.city
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
    const addressDisplay = [
      selectedCustomer.address,
      selectedCustomer.city,
      selectedCustomer.province,
      selectedCustomer.postal_code,
      selectedCustomer.country
    ].filter(Boolean).join(', ') || selectedCustomer.address || '-';

    const fields = [
      { label: tText('ผู้ติดต่อ', 'Contact Person'), value: selectedCustomer.contact_person, icon: User },
      { label: tText('เบอร์โทรศัพท์', 'Phone'), value: selectedCustomer.phone, icon: Phone },
      { label: tText('อีเมล', 'Email'), value: selectedCustomer.email, icon: Mail },
      { label: tText('เลขประจำตัวผู้เสียภาษี', 'Tax ID'), value: selectedCustomer.tax_id, icon: FileText },
      { label: tText('ที่อยู่', 'Address'), value: addressDisplay, icon: MapPin }
    ];

    return (
      <div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{selectedCustomer.customer_name}</h2>
            <p className="dashboard-view-subtitle" style={{ margin: 0 }}>{tText('ข้อมูลโปรไฟล์ลูกค้าและประวัติเอกสาร', 'Customer profile and history')}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setSelectedCustomerId(null)} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>{t('actionBack', 'ย้อนกลับ')}</span>
            </button>
            <button 
              className="btn-primary" 
              onClick={() => openEditModal(selectedCustomer)} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Pencil size={16} />
              <span>{t('actionEdit', 'แก้ไข')}</span>
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
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '8px' }}>{tText('รายการจองรถ (Bookings)', 'Bookings')}</div>
          </div>
        </div>

        {/* Booking History Panel */}
        <div className="dashboard-card-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, textAlign: 'left' }}>{tText('ประวัติการจองรถ', 'Booking History')}</h3>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>0 {tText('รายการ', 'records')}</span>
          </div>
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            {tText('ยังไม่มีประวัติการจองสำหรับลูกค้ารายนี้', 'No bookings for this customer yet.')}
          </div>
        </div>

        {/* Modal Dialog inside detail view so Edit modal still works */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <h3 className="modal-title">{tText('แก้ไขข้อมูลลูกค้า', 'Edit Customer')}</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOrSave}>
                <div className="modal-body" style={{ textAlign: 'left' }}>
                  {/* Company Name */}
                  <div className="form-group">
                    <label className="form-label">
                      {tText('ชื่อบริษัท / ลูกค้า', 'Company Name')}
                      <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={tText('เช่น บริษัท เอสซีจี จำกัด...', 'e.g. SCG Logistics Co., Ltd.')}
                      className="form-input"
                      value={formData.customer_name}
                      onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>

                  {/* Contact Person & Phone */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{tText('ผู้ติดต่อ', 'Contact Person')}</label>
                      <input
                        type="text"
                        placeholder={tText('ชื่อผู้ติดต่อ...', 'Contact name...')}
                        className="form-input"
                        value={formData.contact_person}
                        onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{tText('เบอร์โทรศัพท์', 'Phone')}</label>
                      <input
                        type="text"
                        placeholder={tText('เบอร์โทร...', 'Phone number...')}
                        className="form-input"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {/* Email & Tax ID */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{tText('อีเมล', 'Email')}</label>
                      <input
                        type="email"
                        placeholder={tText('อีเมล...', 'Email...')}
                        className="form-input"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{tText('เลขประจำตัวผู้เสียภาษี', 'Tax ID')}</label>
                      <input
                        type="text"
                        placeholder={tText('เลขผู้เสียภาษี...', 'Tax ID...')}
                        className="form-input"
                        value={formData.tax_id}
                        onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {/* Address Line */}
                  <div className="form-group">
                    <label className="form-label">{tText('ที่อยู่', 'Address Line')}</label>
                    <input
                      type="text"
                      placeholder={tText('เลขที่ อาคาร ถนน...', 'Address Line')}
                      className="form-input"
                      value={formData.streetAddress || formData.address || ''}
                      onChange={e => setFormData({ ...formData, streetAddress: e.target.value, address: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>

                  {/* City / District & State / Province */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{tText('อำเภอ / เขต', 'City / District')}</label>
                      <input
                        type="text"
                        placeholder={tText('อำเภอ / เขต...', 'City / District')}
                        className="form-input"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{tText('จังหวัด', 'State / Province')}</label>
                      <input
                        type="text"
                        placeholder={tText('จังหวัด...', 'State / Province')}
                        className="form-input"
                        value={formData.province}
                        onChange={e => setFormData({ ...formData, province: e.target.value })}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {/* Postal Code & Country */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{tText('รหัสไปรษณีย์', 'Postal Code')}</label>
                      <input
                        type="text"
                        placeholder={tText('รหัสไปรษณีย์...', 'Postal Code')}
                        className="form-input"
                        value={formData.postalCode}
                        onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{tText('ประเทศ', 'Country')}</label>
                      <input
                        type="text"
                        list="modal1-countries-list"
                        placeholder={tText('ประเทศ...', 'Country')}
                        className="form-input"
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        autoComplete="new-password"
                      />
                      <datalist id="modal1-countries-list">
                        {countries.map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={closeModal}>
                    {t('actionCancel', 'ยกเลิก')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t('actionSave', 'บันทึก')}
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

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{t('custPageTitle', 'ข้อมูลลูกค้า (Customers)')}</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>{t('custPageSubtitle', 'จัดการข้อมูลลูกค้า รายละเอียดการติดต่อ และประวัติเอกสาร')}</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>{t('custAddBtn', 'เพิ่มลูกค้าใหม่')}</span>
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
              placeholder={t('custSearchPlaceholder', 'ค้นหาลูกค้าตามชื่อบริษัท, ผู้ติดต่อ, เบอร์โทร...')}
              className="panel-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clean UI table */}
        <div className="table-responsive-wrapper" style={{ marginTop: '16px' }}>
          {filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#64748b' }}>
              <Inbox size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>
                {tText('ยังไม่มีข้อมูลลูกค้า คลิก "เพิ่มลูกค้าใหม่" เพื่อสร้างข้อมูล', 'No customers yet. Click \'Add Customer\' to create one.')}
              </p>
            </div>
          ) : (
            <table className="custom-clean-table">
              <thead>
                <tr>
                  <th style={{ width: '25%', paddingLeft: '24px' }}>{t('custColCompany', 'ชื่อบริษัท / ลูกค้า')}</th>
                  <th style={{ width: '25%' }}>{t('custColContact', 'ผู้ติดต่อ')}</th>
                  <th style={{ width: '20%' }}>{tText('เบอร์โทรศัพท์', 'Phone')}</th>
                  <th style={{ width: '20%' }}>{tText('อีเมล', 'Email')}</th>
                  <th style={{ width: '10%', textAlign: 'right', paddingRight: '24px' }}>{t('actionActions', 'จัดการ')}</th>
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
                      <ActionDropdown
                        items={[
                          {
                            label: t('actionEdit', 'แก้ไข'),
                            icon: <Edit size={16} className="menu-icon" />,
                            onClick: () => openEditModal(c)
                          },
                          {
                            label: t('actionDelete', 'ลบ'),
                            icon: <Trash2 size={16} className="menu-icon danger" />,
                            danger: true,
                            onClick: () => onDelete(c.customer_id)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' ? tText('เพิ่มข้อมูลลูกค้า', 'Add Customer') : tText('แก้ไขข้อมูลลูกค้า', 'Edit Customer')}
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
                    {tText('ชื่อบริษัท / ลูกค้า', 'Company Name')}
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tText('เช่น บริษัท เอสซีจี จำกัด...', 'e.g. SCG Logistics Co., Ltd.')}
                    className="form-input"
                    value={formData.customer_name}
                    onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>

                {/* Contact Person & Phone */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{tText('ผู้ติดต่อ', 'Contact Person')}</label>
                    <input
                      type="text"
                      placeholder={tText('ชื่อผู้ติดต่อ...', 'Contact name...')}
                      className="form-input"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tText('เบอร์โทรศัพท์', 'Phone')}</label>
                    <input
                      type="text"
                      placeholder={tText('เบอร์โทร...', 'Phone number...')}
                      className="form-input"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Email & Tax ID */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{tText('อีเมล', 'Email')}</label>
                    <input
                      type="email"
                      placeholder={tText('อีเมล...', 'Email...')}
                      className="form-input"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tText('เลขประจำตัวผู้เสียภาษี', 'Tax ID')}</label>
                    <input
                      type="text"
                      placeholder={tText('เลขผู้เสียภาษี...', 'Tax ID...')}
                      className="form-input"
                      value={formData.tax_id}
                      onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Address Line */}
                <div className="form-group">
                  <label className="form-label">{tText('ที่อยู่', 'Address Line')}</label>
                  <input
                    type="text"
                    placeholder={tText('เลขที่ อาคาร ถนน...', 'Address Line')}
                    className="form-input"
                    value={formData.streetAddress || formData.address || ''}
                    onChange={e => setFormData({ ...formData, streetAddress: e.target.value, address: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>

                {/* City / District & State / Province */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{tText('อำเภอ / เขต', 'City / District')}</label>
                    <input
                      type="text"
                      placeholder={tText('อำเภอ / เขต...', 'City / District')}
                      className="form-input"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tText('จังหวัด', 'State / Province')}</label>
                    <input
                      type="text"
                      placeholder={tText('จังหวัด...', 'State / Province')}
                      className="form-input"
                      value={formData.province}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Postal Code & Country */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{tText('รหัสไปรษณีย์', 'Postal Code')}</label>
                    <input
                      type="text"
                      placeholder={tText('รหัสไปรษณีย์...', 'Postal Code')}
                      className="form-input"
                      value={formData.postalCode}
                      onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tText('ประเทศ', 'Country')}</label>
                    <input
                      type="text"
                      list="modal2-countries-list"
                      placeholder={tText('ประเทศ...', 'Country')}
                      className="form-input"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      autoComplete="new-password"
                    />
                    <datalist id="modal2-countries-list">
                      {countries.map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  {t('actionCancel', 'ยกเลิก')}
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? tText('บันทึกข้อมูล', 'Create') : tText('บันทึก', 'Save')}
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