import { useState } from 'react';
import {
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  Truck,
  Inbox,
  Calendar,
  MapPin
} from 'lucide-react';

function CarTable({ cars, drivers, onAdd, onUpdate, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingCarId, setEditingCarId] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState(null);

  const [formData, setFormData] = useState({
    car_number: '',
    car_type: '10-Wheeler',
    capacity: '',
    capacity_unit: 'Ton',
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

  // Helper to find driver for a car
  const getDriverForCar = (car) => {
    if (!car || !Array.isArray(drivers)) return null;
    let driver = null;
    if (car.assigned_driver_id) {
      driver = drivers.find(d => d.driver_id === car.assigned_driver_id);
    }
    if (!driver) {
      driver = drivers.find(d => d.assigned_car_id === car.car_id);
    }
    return driver;
  };

  // Helper for job history matching design
  const getCarJobHistory = (car) => {
    if (!car) return [];

    const sampleJobsMap = {
      '65-3456': [
        {
          id: 'BK-20260805-3387',
          status: 'Assigned',
          statusType: 'assigned',
          date: '05 Aug 2026',
          customerName: 'Bangkok Logistics Partners',
          pickupLocation: 'Ism',
          pickupDate: '05 Aug',
          deliveryLocation: 'Ims',
          deliveryDate: '16 Aug',
          tag: 'plastics ×500'
        }
      ],
      '70-1234': [
        {
          id: 'BK-20260802-1192',
          status: 'Completed',
          statusType: 'completed',
          date: '02 Aug 2026',
          customerName: 'Siam Trading Co., Ltd.',
          pickupLocation: 'Laem Chabang Port',
          pickupDate: '02 Aug',
          deliveryLocation: 'Ayutthaya Industrial Estate',
          deliveryDate: '03 Aug',
          tag: 'electronic parts ×200'
        }
      ],
      '80-5678': [
        {
          id: 'BK-20260809-5541',
          status: 'In Transit',
          statusType: 'assigned',
          date: '09 Aug 2026',
          customerName: 'Thai Beverage Logistics',
          pickupLocation: 'Pathum Thani Warehouse',
          pickupDate: '09 Aug',
          deliveryLocation: 'Chiang Mai DC',
          deliveryDate: '11 Aug',
          tag: 'beverage crates ×1200'
        }
      ],
      '90-9012': [
        {
          id: 'BK-20260728-0982',
          status: 'Completed',
          statusType: 'completed',
          date: '28 Jul 2026',
          customerName: 'SCG Logistics Management',
          pickupLocation: 'Saraburi Plant',
          pickupDate: '28 Jul',
          deliveryLocation: 'Rayong Hub',
          deliveryDate: '29 Jul',
          tag: 'construction materials ×800'
        }
      ]
    };

    if (sampleJobsMap[car.car_number]) {
      return sampleJobsMap[car.car_number];
    }

    return [
      {
        id: `BK-20260810-${car.car_id ? String(car.car_id).slice(-4) : '9901'}`,
        status: 'Assigned',
        statusType: 'assigned',
        date: '10 Aug 2026',
        customerName: 'General Logistics Customer',
        pickupLocation: 'Bangkok Port',
        pickupDate: '10 Aug',
        deliveryLocation: 'Chonburi Hub',
        deliveryDate: '12 Aug',
        tag: 'general freight ×300'
      }
    ];
  };

  const selectedCar = Array.isArray(cars) ? cars.find(c => c.car_id === selectedCarId) : null;

  // ============================================================
  // RENDER DETAIL VIEW
  // ============================================================
  if (selectedCar) {
    const driver = getDriverForCar(selectedCar);
    const jobs = getCarJobHistory(selectedCar);

    return (
      <div>
        {/* Breadcrumb */}
        <div className="dashboard-breadcrumb">
          <span>Master Data</span>
          <span className="dashboard-breadcrumb-separator">&gt;</span>
          <span
            onClick={() => setSelectedCarId(null)}
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Trucks
          </span>
          <span className="dashboard-breadcrumb-separator">&gt;</span>
          <span style={{ color: '#64748b' }}>{selectedCar.car_number}</span>
        </div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{selectedCar.car_number}</h2>
            <p className="dashboard-view-subtitle" style={{ margin: 0 }}>Truck details &amp; job history</p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => openEditModal(selectedCar)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
          >
            <Pencil size={15} />
            <span>Edit</span>
          </button>
        </div>

        {/* Truck Overview Panel */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px', flexWrap: 'wrap' }}>
            {/* Truck Icon Box */}
            <div style={{
              backgroundColor: '#e0f2fe',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={32} color="#0284c7" />
            </div>

            {/* License Plate Column */}
            <div style={{ minWidth: '140px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>
                License Plate
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                {selectedCar.car_number}
              </div>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                  {selectedCar.status || 'Available'}
                </span>
              </div>
            </div>

            {/* Type Column */}
            <div style={{ minWidth: '140px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>
                Type
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#1e293b' }}>
                {selectedCar.car_type || '—'}
              </div>
            </div>

            {/* Driver Column */}
            <div style={{ minWidth: '160px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>
                Driver
              </div>
              {driver ? (
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>
                    {driver.full_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    {driver.phone || '—'}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.95rem', color: '#94a3b8' }}>—</div>
              )}
            </div>
          </div>
        </div>

        {/* Job History Section */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', textAlign: 'left' }}>
            Job History ({jobs.length})
          </h3>

          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: '#94a3b8' }}>
              <Inbox size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No job history found for this truck.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {jobs.map((job, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'left'
                }}>
                  {/* Top Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#0284c7' }}>
                        {job.id}
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: job.statusType === 'completed' ? '#f0fdf4' : '#eff6ff',
                        color: job.statusType === 'completed' ? '#15803d' : '#1d4ed8',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: job.statusType === 'completed' ? '#22c55e' : '#3b82f6'
                        }}></span>
                        {job.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                      <Calendar size={14} />
                      <span>{job.date}</span>
                    </div>
                  </div>

                  {/* Customer Subtitle */}
                  <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px' }}>
                    {job.customerName}
                  </div>

                  {/* Pickup & Delivery Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        PICKUP
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#334155' }}>
                        <MapPin size={14} color="#64748b" />
                        <span>{job.pickupLocation} · {job.pickupDate}</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        DELIVERY
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#334155' }}>
                        <MapPin size={14} color="#64748b" />
                        <span>{job.deliveryLocation} · {job.deliveryDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tag Pill */}
                  {job.tag && (
                    <div>
                      <span style={{
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        fontSize: '0.78rem',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        {job.tag}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal - Add / Edit Truck */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '550px' }}>
              <div className="modal-header">
                <h3>Edit Truck</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOrSave}>
                <div className="modal-body">
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
                        <option value="Trailer (20ft)">Trailer (20ft)</option>
                        <option value="Trailer (40ft)">Trailer (40ft)</option>
                      </select>
                    </div>
                  </div>

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

  // ============================================================
  // RENDER TRUCKS LIST VIEW
  // ============================================================
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
                  <th>Driver</th>
                  <th style={{ width: '120px', textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map(car => {
                  const driver = getDriverForCar(car);
                  return (
                    <tr key={car.car_id}>
                      <td style={{ paddingLeft: '24px', fontWeight: '600' }}>
                        <div
                          onClick={() => setSelectedCarId(car.car_id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#0284c7',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                          className="truck-license-link"
                          title="ดูรายละเอียดเพิ่มเติม"
                        >
                          <Truck size={16} color="#0284c7" />
                          <span>{car.car_number}</span>
                        </div>
                      </td>
                      <td style={{ color: '#334155' }}>{car.car_type}</td>
                      <td>
                        {driver ? (
                          <div>
                            <div style={{ fontWeight: '500', color: '#0f172a', fontSize: '0.9rem' }}>
                              {driver.full_name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1px' }}>
                              {driver.phone || '—'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
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
                  );
                })}
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
                      <option value="Trailer (20ft)">Trailer (20ft)</option>
                      <option value="Trailer (40ft)">Trailer (40ft)</option>
                    </select>
                  </div>
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

export default CarTable;