import { useState } from 'react';
import {
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  Truck,
  Inbox
} from 'lucide-react';

function CarTable({ cars, drivers, onAdd, onUpdate, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingCarId, setEditingCarId] = useState(null);

  const [formData, setFormData] = useState({
    car_number: '',
    car_type: '10-Wheeler',
    capacity: '',
    capacity_unit: 'Ton',
    // status: 'Available',
    assigned_driver_id: '',
    notes: ''
  });

  const handleCreateOrSave = (e) => {
    e.preventDefault();
    if (!formData.car_number) {
      alert('กรุณากรอกทะเบียนรถ');
      return;
    }

    if (modalMode === 'add') {
      onAdd(formData, () => {
        closeModal();
      });
    } else {
      onUpdate(editingCarId, formData, () => {
        closeModal();
      });
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      car_number: '',
      car_type: '10-Wheeler',
      capacity: '',
      capacity_unit: 'Ton',
      status: 'Available',
      assigned_driver_id: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (car) => {
    setModalMode('edit');
    setEditingCarId(car.car_id);
    setFormData({
      car_number: car.car_number || '',
      car_type: car.car_type || '10-Wheeler',
      capacity: car.capacity !== null && car.capacity !== undefined ? car.capacity : '',
      capacity_unit: car.capacity_unit || 'Ton',
      status: car.status || 'Available',
      assigned_driver_id: car.assigned_driver_id || '',
      notes: car.notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      car_number: '',
      car_type: '10-Wheeler',
      capacity: '',
      capacity_unit: 'Ton',
      status: 'Available',
      assigned_driver_id: '',
      notes: ''
    });
    setEditingCarId(null);
  };

  // Filter trucks based on search query
  const filteredCars = Array.isArray(cars)
    ? cars.filter(car =>
      (car.car_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (car.car_type || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  // Helper to find driver name
  const getDriverName = (driverId) => {
    if (!driverId) return 'Unassigned';
    const driver = Array.isArray(drivers) ? drivers.find(d => d.driver_id === driverId) : null;
    return driver ? driver.full_name : 'Unassigned';
  };

  // Helper to get status badge classes
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Available':
        return 'status-badge-pill badge-completed';
      case 'Busy':
        return 'status-badge-pill badge-assigned';
      case 'Maintenance':
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
        <span style={{ color: '#64748b' }}>Trucks</span>
      </div>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>Trucks</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>Manage your fleet</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Truck</span>
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
              placeholder="Search trucks..."
              className="panel-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clean UI table */}
        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          {filteredCars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#64748b' }}>
              <Inbox size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No trucks yet. Click 'Add Truck' to create one.</p>
            </div>
          ) : (
            <table className="custom-clean-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>License Plate</th>
                  <th>Type</th>
                  {/* <th>Capacity</th> */}
                  {/* <th>Assigned Driver</th> */}
                  <th>Status</th>
                  <th style={{ width: '120px', textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map(car => (
                  <tr key={car.car_id}>
                    <td style={{ paddingLeft: '24px', fontWeight: '600', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Truck size={16} color="#64748b" />
                        <span>{car.car_number}</span>
                      </div>
                    </td>
                    <td>{car.car_type}</td>
                    {/* <td>
                      {car.capacity ? `${car.capacity} ${car.capacity_unit || 'Ton'}` : '-'}
                    </td> */}
                    {/* <td>{getDriverName(car.assigned_driver_id)}</td> */}
                    <td>
                      <span className={getStatusBadgeClass(car.status)}>
                        <span className="status-dot"></span>
                        {car.status || 'Available'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="table-action-btn edit-btn"
                          onClick={() => openEditModal(car)}
                          title="แก้ไขข้อมูล"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="table-action-btn delete-btn"
                          onClick={() => onDelete(car.car_id)}
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

      {/* Modal - Add / Edit Truck */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Add Truck' : 'Edit Truck'}</h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrSave}>
              <div className="modal-body">
                {/* License Plate & Truck Type */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      License Plate
                      <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 3กข-1234..."
                      className="form-input"
                      value={formData.car_number}
                      onChange={e => setFormData({ ...formData, car_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Truck Type</label>
                    <select
                      className="form-select"
                      value={formData.car_type}
                      onChange={e => setFormData({ ...formData, car_type: e.target.value })}
                    >
                      <option value="4-Wheeler">4-Wheeler</option>
                      <option value="6-Wheeler">6-Wheeler</option>
                      <option value="10-Wheeler">10-Wheeler</option>
                      <option value="Container Truck">Container Truck</option>
                    </select>
                  </div>
                </div>

                {/* Capacity & Unit */}
                {/* <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacity</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="เช่น 15..."
                      className="form-input"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select
                      className="form-select"
                      value={formData.capacity_unit}
                      onChange={e => setFormData({ ...formData, capacity_unit: e.target.value })}
                    >
                      <option value="Ton">Ton</option>
                      <option value="kg">kg</option>
                      <option value="Cubic Meter">Cubic Meter</option>
                    </select>
                  </div>
                </div> */}

                {/* Status & Assigned Driver */}
                {/* <div className="form-row">
                  <div className="form-group" style={{ width: '100%' }}>
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned Driver</label>
                    <select
                      className="form-select"
                      value={formData.assigned_driver_id}
                      onChange={e => setFormData({ ...formData, assigned_driver_id: e.target.value })}
                    >
                      <option value="">-- Select Driver --</option>
                      {Array.isArray(drivers) && drivers.map(d => (
                        <option key={d.driver_id} value={d.driver_id}>
                          {d.full_name} {d.phone ? `(${d.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div> */}

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

export default CarTable;