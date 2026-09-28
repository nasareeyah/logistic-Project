import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  Truck,
  Inbox,
  Package,
  MoreVertical,
  Edit,
  ArrowLeft
} from 'lucide-react';
import ActionDropdown from '../Common/ActionDropdown';
import { useLanguage } from '../../context/LanguageContext';

function CarTable({ cars, drivers, onAdd, onUpdate, onDelete }) {
  const { lang, t, tText } = useLanguage();
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

  const selectedCar = Array.isArray(cars) ? cars.find(c => c.car_id === selectedCarId) : null;

  // ============================================================
  // RENDER DETAIL VIEW
  // ============================================================
  if (selectedCar) {
    const driver = getDriverForCar(selectedCar);

    return (
      <div>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{selectedCar.car_number}</h2>
            <p className="dashboard-view-subtitle" style={{ margin: 0 }}>{tText('ข้อมูลรถและประวัติการขนส่ง', 'Truck details & job history')}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={() => setSelectedCarId(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
            >
              <ArrowLeft size={15} />
              <span>{t('actionBack', 'ย้อนกลับ')}</span>
            </button>
            <button
              className="btn-primary"
              onClick={() => openEditModal(selectedCar)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
            >
              <Pencil size={15} />
              <span>{t('actionEdit', 'แก้ไข')}</span>
            </button>
          </div>
        </div>

        {/* Side-by-side Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) 1.8fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Card: Truck Overview */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'left'
          }}>
            {/* Top Header inside Left Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                backgroundColor: '#e0f2fe',
                borderRadius: '12px',
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Truck size={28} color="#0284c7" />
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>
                  {selectedCar.car_number}
                </div>
                <div style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: '500' }}>
                  {selectedCar.car_type || 'Truck'}
                </div>
              </div>
            </div>

            {/* License Plate Field */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>
                {tText('ทะเบียนรถ', 'License Plate')}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>
                {selectedCar.car_number}
              </div>
            </div>

            {/* Type Field */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>
                {tText('ประเภทรถ', 'Truck Type')}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#1e293b' }}>
                {selectedCar.car_type || '—'}
              </div>
            </div>

            {/* Driver Field */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>
                {tText('คนขับประจำรถ', 'Assigned Driver')}
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

          {/* Right Card: Job History (Wider Box) */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            minHeight: '320px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '32px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#0f172a', textAlign: 'left' }}>
                {tText('ประวัติการวิ่งงาน', 'Job History')} (0)
              </h3>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '20px 24px 40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1
            }}>
              <Package size={48} strokeWidth={1.4} color="#cbd5e1" style={{ marginBottom: '14px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '400' }}>
                {tText('ยังไม่มีประวัติการวิ่งงานสำหรับรถคันนี้', 'No jobs assigned to this truck yet.')}
              </p>
            </div>
          </div>
        </div>

        {/* Modal - Edit Truck */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: '550px' }}>
              <div className="modal-header">
                <h3>{tText('แก้ไขข้อมูลรถบรรทุก', 'Edit Truck')}</h3>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOrSave}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        {tText('ทะเบียนรถ', 'License Plate')}
                        <span className="form-label-required">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={tText('เช่น 3กข-1234...', 'e.g. 3AB-1234...')}
                        className="form-input"
                        value={formData.car_number}
                        onChange={e => setFormData({ ...formData, car_number: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{tText('ประเภทรถ', 'Truck Type')}</label>
                      <select
                        className="form-select"
                        value={formData.car_type}
                        onChange={e => setFormData({ ...formData, car_type: e.target.value })}
                      >
                        <option value="4-Wheeler">4-Wheeler (4 ล้อ)</option>
                        <option value="6-Wheeler">6-Wheeler (6 ล้อ)</option>
                        <option value="10-Wheeler">10-Wheeler (10 ล้อ)</option>
                        <option value="Container Truck">Container Truck (รถหัวลากตู้คอนเทนเนอร์)</option>
                        <option value="Trailer (20ft)">Trailer 20ft (หางพ่วง 20 ฟุต)</option>
                        <option value="Trailer (40ft)">Trailer 40ft (หางพ่วง 40 ฟุต)</option>
                      </select>
                    </div>
                  </div>

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

  // ============================================================
  // RENDER TRUCKS LIST VIEW
  // ============================================================
  return (
    <div>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{t('truckPageTitle', 'ข้อมูลรถบรรทุก (Trucks)')}</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>{t('truckPageSubtitle', 'จัดการข้อมูลรถบรรทุก ประเภทรถ และคนขับประจำรถ')}</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>{t('truckAddBtn', 'เพิ่มรถใหม่')}</span>
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
              placeholder={t('truckSearchPlaceholder', 'ค้นหาตามทะเบียนรถ, ประเภทรถ, หรือคนขับ...')}
              className="panel-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clean UI table */}
        <div className="table-responsive-wrapper" style={{ marginTop: '16px' }}>
          {filteredCars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#64748b' }}>
              <Inbox size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>{tText('ยังไม่มีข้อมูลรถบรรทุก คลิก "เพิ่มรถใหม่" เพื่อสร้างข้อมูล', 'No trucks yet. Click \'Add Truck\' to create one.')}</p>
            </div>
          ) : (
            <table className="custom-clean-table">
              <thead>
                <tr>
                  <th style={{ width: '35%', paddingLeft: '24px' }}>{t('truckColPlate', 'ทะเบียนรถ')}</th>
                  <th style={{ width: '25%' }}>{t('truckColType', 'ประเภทรถ')}</th>
                  <th style={{ width: '30%' }}>{t('truckColDriver', 'คนขับประจำรถ')}</th>
                  <th style={{ width: '10%', textAlign: 'right', paddingRight: '24px' }}>{t('actionActions', 'จัดการ')}</th>
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
                          title={tText('ดูรายละเอียดเพิ่มเติม', 'Click for more details')}
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
                        <ActionDropdown
                          items={[
                            {
                              label: t('actionEdit', 'แก้ไข'),
                              icon: <Edit size={16} className="menu-icon" />,
                              onClick: () => openEditModal(car)
                            },
                            {
                              label: t('actionDelete', 'ลบ'),
                              icon: <Trash2 size={16} className="menu-icon danger" />,
                              danger: true,
                              onClick: () => onDelete(car.car_id)
                            }
                          ]}
                        />
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
              <h3>{modalMode === 'add' ? tText('เพิ่มรถบรรทุกใหม่', 'Add Truck') : tText('แก้ไขข้อมูลรถบรรทุก', 'Edit Truck')}</h3>
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
                      {tText('ทะเบียนรถ', 'License Plate')}
                      <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={tText('เช่น 3กข-1234...', 'e.g. 3AB-1234...')}
                      className="form-input"
                      value={formData.car_number}
                      onChange={e => setFormData({ ...formData, car_number: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tText('ประเภทรถ', 'Truck Type')}</label>
                    <select
                      className="form-select"
                      value={formData.car_type}
                      onChange={e => setFormData({ ...formData, car_type: e.target.value })}
                    >
                      <option value="4-Wheeler">4-Wheeler (4 ล้อ)</option>
                      <option value="6-Wheeler">6-Wheeler (6 ล้อ)</option>
                      <option value="10-Wheeler">10-Wheeler (10 ล้อ)</option>
                      <option value="Container Truck">Container Truck (รถหัวลากตู้คอนเทนเนอร์)</option>
                      <option value="Trailer (20ft)">Trailer 20ft (หางพ่วง 20 ฟุต)</option>
                      <option value="Trailer (40ft)">Trailer 40ft (หางพ่วง 40 ฟุต)</option>
                    </select>
                  </div>
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

export default CarTable;