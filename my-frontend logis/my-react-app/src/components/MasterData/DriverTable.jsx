import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  User, 
  Inbox,
  MoreVertical,
  Edit
} from 'lucide-react';
import ActionDropdown from '../Common/ActionDropdown';
import { useLanguage } from '../../context/LanguageContext';

function DriverTable({ drivers, cars, onAdd, onUpdate, onDelete }) {
  const { lang, t, tText } = useLanguage();
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

  // Filter out cars that are already assigned to other drivers
  const availableCars = Array.isArray(cars)
    ? cars.filter(car => {
        const isAssignedToOther = Array.isArray(drivers) && drivers.some(d => 
          d.assigned_car_id && 
          String(d.assigned_car_id) === String(car.car_id) && 
          String(d.driver_id) !== String(editingDriverId)
        );
        return !isAssignedToOther;
      })
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

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{t('driverPageTitle', 'ข้อมูลคนขับรถ (Drivers)')}</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>{t('driverPageSubtitle', 'จัดการข้อมูลพนักงานขับรถ เบอร์ติดต่อ และรถที่ได้รับมอบหมาย')}</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>{t('driverAddBtn', 'เพิ่มคนขับใหม่')}</span>
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
              placeholder={t('driverSearchPlaceholder', 'ค้นหาตามชื่อคนขับ, เบอร์โทร, หรืออีเมล...')} 
              className="panel-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clean UI table */}
        <div className="table-responsive-wrapper" style={{ marginTop: '16px' }}>
          {filteredDrivers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#64748b' }}>
              <Inbox size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>{tText('ยังไม่มีข้อมูลคนขับรถ คลิก "เพิ่มคนขับใหม่" เพื่อสร้างข้อมูล', 'No drivers yet. Click \'Add Driver\' to create one.')}</p>
            </div>
          ) : (
            <table className="custom-clean-table">
              <thead>
                <tr>
                  <th style={{ width: '30%', paddingLeft: '24px' }}>{t('driverColName', 'ชื่อ-นามสกุล')}</th>
                  <th style={{ width: '20%' }}>{t('driverColPhone', 'เบอร์โทรศัพท์')}</th>
                  <th style={{ width: '20%' }}>{t('driverColEmail', 'อีเมล')}</th>
                  <th style={{ width: '20%' }}>{t('driverColCar', 'รถที่ขับ')}</th>
                  <th style={{ width: '10%', textAlign: 'right', paddingRight: '24px' }}>{t('actionActions', 'จัดการ')}</th>
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
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <ActionDropdown
                        items={[
                          {
                            label: t('actionEdit', 'แก้ไข'),
                            icon: <Edit size={16} className="menu-icon" />,
                            onClick: () => openEditModal(driver)
                          },
                          {
                            label: t('actionDelete', 'ลบ'),
                            icon: <Trash2 size={16} className="menu-icon danger" />,
                            danger: true,
                            onClick: () => onDelete(driver.driver_id)
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

      {/* Modal - Add / Edit Driver */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? tText('เพิ่มคนขับใหม่', 'Add Driver') : tText('แก้ไขข้อมูลคนขับ', 'Edit Driver')}</h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrSave} autoComplete="off">
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Driver Name */}
                <div className="form-group">
                  <label className="form-label">
                    {tText('ชื่อ-นามสกุล คนขับ', 'Driver Name')}
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tText('ชื่อผู้ขับรถ...', 'Full name...')}
                    className="form-input"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>

                {/* Phone & Email */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{tText('เบอร์โทรศัพท์', 'Phone')}</label>
                    <input
                      type="text"
                      placeholder={tText('เบอร์โทรศัพท์...', 'Phone number...')}
                      className="form-input"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
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
                </div>

                {/* License Number & Status */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{tText('เลขที่ใบขับขี่', 'License Number')}</label>
                    <input
                      type="text"
                      placeholder={tText('เลขที่ใบขับขี่...', 'Driver license number...')}
                      className="form-input"
                      value={formData.license_number}
                      onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Assigned Truck Plate */}
                <div className="form-group">
                  <label className="form-label">{tText('รถที่มอบหมายให้ขับ', 'Assigned Truck Plate')}</label>
                  <select
                    className="form-select"
                    value={formData.assigned_car_id}
                    onChange={e => setFormData({ ...formData, assigned_car_id: e.target.value })}
                  >
                    <option value="">{tText('-- เลือกรถบรรทุก --', '-- Select Truck --')}</option>
                    {availableCars.map(car => (
                      <option key={car.car_id} value={car.car_id}>
                        {car.car_number} ({car.car_type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">{tText('หมายเหตุ', 'Notes')}</label>
                  <textarea
                    placeholder={tText('รายละเอียดเพิ่มเติม...', 'Additional details...')}
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
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

export default DriverTable;