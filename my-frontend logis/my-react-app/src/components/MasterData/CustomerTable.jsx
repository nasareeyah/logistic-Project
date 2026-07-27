import { useState } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  FolderOpen, 
  Pencil, 
  Trash2 
} from 'lucide-react';

function CustomerTable({ customers, onAdd, onUpdate, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    contact_person: '',
    phone: '',
    email: '',
    tax_id: '',
    address: '',
    status: 'Active'
  });

  const handleCreateOrSave = (e) => {
    e.preventDefault();
    if (!formData.customer_name) {
      alert('กรุณากรอกชื่อลูกค้า');
      return;
    }
    
    if (modalMode === 'add') {
      onAdd(formData, () => {
        closeModal();
      });
    } else {
      onUpdate(editingCustomerId, formData, () => {
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
      status: 'Active'
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
      status: c.status || 'Active'
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
      status: 'Active'
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
                <th>Status</th>
                <th style={{ width: '100px', textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.customer_id}>
                  <td style={{ paddingLeft: '24px', fontWeight: '600', color: '#0f172a' }}>{c.customer_name}</td>
                  <td>{c.contact_person || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>
                    <span className={`status-badge-pill ${formData.status === 'Inactive' ? 'badge-cancelled' : 'badge-completed'}`}>
                      <span className="status-dot"></span>
                      {c.status || 'Active'}
                    </span>
                  </td>
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

                {/* Address */}
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    placeholder="ที่อยู่บริษัท..."
                    className="form-textarea"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Status */}
                <div className="form-group" style={{ width: '50%' }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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