import { useState } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  User, 
  Inbox
} from 'lucide-react';

function DriverTable({ drivers, cars, onAdd, onUpdate, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingDriverId, setEditingDriverId] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    license_number: '',
    assigned_car_id: '',
    notes: ''
  });

  const handleCreateOrSave = (e) => {
    e.preventDefault();
    if (!formData.full_name) {
      alert('กรุณากรอกชื่อคนขับ');
      return;
    }

    if (modalMode === 'add') {
      onAdd(formData, () => {
        closeModal();
      });
    } else {
      onUpdate(editingDriverId, formData, () => {
        closeModal();
      });
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      license_number: '',
      assigned_car_id: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (driver) => {
    setModalMode('edit');
    setEditingDriverId(driver.driver_id);
    setFormData({
      full_name: driver.full_name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      license_number: driver.license_number || '',
      assigned_car_id: driver.assigned_car_id || '',
      notes: driver.notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      license_number: '',
      assigned_car_id: '',
      notes: ''
    });
    setEditingDriverId(null);
  };

  // Filter drivers based on search query
  const filteredDrivers = Array.isArray(drivers)
    ? drivers.filter(d => 
        (d.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.phone || '').includes(searchQuery) ||
        (d.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Helper to find car registration plate
  const getCarNumber = (carId) => {
    if (!carId) return 'Unassigned';
    const car = Array.isArray(cars) ? cars.find(c => c.car_id === carId) : null;
    return car ? car.car_number : 'Unassigned';
  };

  // Helper to get status badge classes
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Available':
        return 'status-badge-pill badge-completed';
      case 'Busy':
        return 'status-badge-pill badge-assigned';
      case 'Leave':
        return 'status-badge-pill badge-cancelled';
      default:
        return 'status-badge-pill badge-waiting';
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="dashboard-breadcrumb">
        <span>Master Data</span>
        <span className="dashboard-breadcrumb-separator">&gt;</span>
        <span style={{ color: '#64748b' }}>Drivers</span>
      </div>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>Drivers</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>Manage your drivers</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Driver</span>
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
              placeholder="Search drivers..." 
              className="panel-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clean UI table */}
        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          {filteredDrivers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#64748b' }}>
              <Inbox size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No drivers yet. Click 'Add Driver' to create one.</p>
            </div>
          ) : (
            <table className="custom-clean-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Assigned Truck</th>
                  {/* <th>Status</th> */}
                  <th style={{ width: '120px', textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map(driver => (
                  <tr key={driver.driver_id}>
                    <td style={{ paddingLeft: '24px', fontWeight: '600', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} color="#64748b" />
                        <span>{driver.full_name}</span>
                      </div>
                    </td>
                    <td>{driver.phone || '-'}</td>
                    <td>{driver.email || '-'}</td>
                    <td>{getCarNumber(driver.assigned_car_id)}</td>
                    {/* <td>
                      <span className={getStatusBadgeClass(driver.status)}>
                        <span className="status-dot"></span>
                        {driver.status || 'Available'}
                      </span>
                    </td> */}
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          className="table-action-btn edit-btn" 
                          onClick={() => openEditModal(driver)}
                          title="แก้ไขข้อมูล"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          className="table-action-btn delete-btn" 
                          onClick={() => onDelete(driver.driver_id)}
                          title="ลบข้อมูล"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Add / Edit Driver */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Add Driver' : 'Edit Driver'}</h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrSave}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Driver Name */}
                <div className="form-group">
                  <label className="form-label">
                    Driver Name
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ชื่อผู้ขับรถ..."
                    className="form-input"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                {/* Phone & Email */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      placeholder="เบอร์โทรศัพท์..."
                      className="form-input"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
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
                </div>

                {/* License Number & Status */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">License Number</label>
                    <input
                      type="text"
                      placeholder="เลขที่ใบขับขี่..."
                      className="form-input"
                      value={formData.license_number}
                      onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                    />
                  </div>
                  {/* <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Leave">Leave</option>
                    </select>
                  </div> */}
                </div>

                {/* Assigned Truck Plate */}
                <div className="form-group">
                  <label className="form-label">Assigned Truck Plate</label>
                  <select
                    className="form-select"
                    value={formData.assigned_car_id}
                    onChange={e => setFormData({ ...formData, assigned_car_id: e.target.value })}
                  >
                    <option value="">-- Select Truck --</option>
                    {Array.isArray(cars) && cars.map(car => (
                      <option key={car.car_id} value={car.car_id}>
                        {car.car_number} ({car.car_type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    placeholder="รายละเอียดเพิ่มเติม..."
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
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

export default DriverTable;