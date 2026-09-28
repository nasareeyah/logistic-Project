import { useState } from 'react';
import {
  Search,
  Plus,
  X,
  Landmark,
  Inbox,
  Edit,
  Trash2
} from 'lucide-react';
import ActionDropdown from '../Common/ActionDropdown';
import { useLanguage } from '../../context/LanguageContext';

const COMMON_BANKS = [
  'ธนาคารกสิกรไทย (Kasikornbank)',
  'ธนาคารไทยพาณิชย์ (SCB)',
  'ธนาคารกรุงเทพ (Bangkok Bank)',
  'ธนาคารกรุงไทย (Krungthai Bank)',
  'ธนาคารทหารไทยธนชาต (ttb)',
  'ธนาคารกรุงศรีอยุธยา (Krungsri)',
  'ธนาคารออมสิน (GSB)',
  'ธนาคารยูโอบี (UOB)',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)'
];

function BankAccountTable({ accounts = [], banks = [], onAdd, onUpdate, onDelete, fetchData }) {
  const { lang, t, tText } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingAccountNo, setEditingAccountNo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    account_no: '',
    account_name: '',
    bank_branch: '',
    bank_name: ''
  });

  const openAddModal = () => {
    setModalMode('add');
    setEditingAccountNo(null);
    setFormData({
      account_no: '',
      account_name: '',
      bank_branch: '',
      bank_name: ''
    });
    setShowModal(true);
  };

  const openEditModal = (acc) => {
    setModalMode('edit');
    setEditingAccountNo(acc.account_no);
    setFormData({
      account_no: acc.account_no,
      account_name: acc.account_name || '',
      bank_branch: acc.bank_branch || '',
      bank_name: acc.bank_name || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccountNo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bank_name.trim()) {
      alert('กรุณาระบุชื่อธนาคาร');
      return;
    }
    if (!formData.account_no.trim()) {
      alert('กรุณากรอกเลขที่บัญชี');
      return;
    }
    if (!formData.account_name.trim()) {
      alert('กรุณากรอกชื่อบัญชี');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        if (onAdd) {
          onAdd(formData, () => {
            closeModal();
            setIsSubmitting(false);
          });
        } else {
          const res = await fetch('http://localhost:3000/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'เพิ่มบัญชีไม่สำเร็จ');
          alert('เพิ่มบัญชีธนาคารสำเร็จ');
          closeModal();
          if (fetchData) fetchData();
        }
      } else {
        if (onUpdate) {
          onUpdate(editingAccountNo, formData, () => {
            closeModal();
            setIsSubmitting(false);
          });
        } else {
          const res = await fetch(`http://localhost:3000/api/accounts/${encodeURIComponent(editingAccountNo)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'แก้ไขบัญชีไม่สำเร็จ');
          alert('แก้ไขบัญชีธนาคารสำเร็จ');
          closeModal();
          if (fetchData) fetchData();
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (acc) => {
    if (!window.confirm(`ยืนยันการลบบัญชีเลขที่ ${acc.account_no} (${acc.bank_name || 'ธนาคาร'}) ใช่หรือไม่?`)) {
      return;
    }

    if (onDelete) {
      onDelete(acc.account_no);
    } else {
      try {
        const res = await fetch(`http://localhost:3000/api/accounts/${encodeURIComponent(acc.account_no)}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'ลบไม่สำเร็จ');
        alert('ลบบัญชีสำเร็จ');
        if (fetchData) fetchData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Filter accounts by search query
  const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter(acc => {
    const q = searchQuery.toLowerCase();
    const no = (acc.account_no || '').toLowerCase();
    const name = (acc.account_name || '').toLowerCase();
    const bName = (acc.bank_name || '').toLowerCase();
    const branch = (acc.bank_branch || '').toLowerCase();
    return no.includes(q) || name.includes(q) || bName.includes(q) || branch.includes(q);
  });

  // Combine banks from props and COMMON_BANKS
  const allBankSuggestions = Array.from(new Set([
    ...COMMON_BANKS,
    ...(Array.isArray(banks) ? banks.map(b => b.bank_name).filter(Boolean) : [])
  ]));

  return (
    <div>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{t('bankPageTitle', 'ข้อมูลบัญชีธนาคาร (Bank Accounts)')}</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>{t('bankPageSubtitle', 'จัดการบัญชีธนาคารของบริษัท สำหรับรับชำระเงินค่าบริการขนส่ง')}</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>{t('bankAddBtn', 'เพิ่มบัญชีธนาคารใหม่')}</span>
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
              placeholder={t('bankSearchPlaceholder', 'ค้นหาตามเลขที่บัญชี, ชื่อบัญชี, หรือธนาคาร...')}
              className="panel-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clean UI table */}
        <div className="table-responsive-wrapper" style={{ marginTop: '16px' }}>
          {filteredAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#64748b' }}>
              <Inbox size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>
                {tText('ยังไม่มีบัญชีธนาคาร คลิก "เพิ่มบัญชีธนาคารใหม่" เพื่อเริ่มต้น', 'No bank accounts yet. Click \'Add Bank Account\' to create one.')}
              </p>
            </div>
          ) : (
            <table className="custom-clean-table">
              <thead>
                <tr>
                  <th style={{ width: '28%', paddingLeft: '24px' }}>{t('bankColBank', 'ธนาคาร')}</th>
                  <th style={{ width: '22%' }}>{t('bankColAccNo', 'เลขที่บัญชี')}</th>
                  <th style={{ width: '28%' }}>{t('bankColAccName', 'ชื่อบัญชี')}</th>
                  <th style={{ width: '12%' }}>{t('bankColBranch', 'สาขา')}</th>
                  <th style={{ width: '10%', textAlign: 'right', paddingRight: '24px' }}>{t('actionActions', 'จัดการ')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(acc => (
                  <tr key={acc.account_no}>
                    <td style={{ paddingLeft: '24px', fontWeight: '600', color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Landmark size={16} color="#64748b" />
                        <span>{acc.bank_name || tText('ธนาคารทั่วไป', 'General Bank')}</span>
                      </div>
                    </td>
                    <td>{acc.account_no}</td>
                    <td>{acc.account_name || '-'}</td>
                    <td>{acc.bank_branch || tText('สำนักงานใหญ่', 'Head Office')}</td>
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <ActionDropdown
                        items={[
                          {
                            label: t('actionEdit', 'แก้ไข'),
                            icon: <Edit size={16} className="menu-icon" />,
                            onClick: () => openEditModal(acc)
                          },
                          {
                            label: t('actionDelete', 'ลบ'),
                            icon: <Trash2 size={16} className="menu-icon" />,
                            danger: true,
                            onClick: () => handleDelete(acc)
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

      {/* Modal - Add / Edit Bank Account */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>{modalMode === 'add' ? tText('เพิ่มบัญชีธนาคาร', 'Add Bank Account') : tText('แก้ไขบัญชีธนาคาร', 'Edit Bank Account')}</h3>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Bank Name */}
                <div className="form-group">
                  <label className="form-label">
                    {t('bankColBank', 'ธนาคาร')}
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="bank-suggestions-list"
                    placeholder={tText('ชื่อธนาคาร...', 'Bank name...')}
                    className="form-input"
                    value={formData.bank_name}
                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                    autoComplete="new-password"
                  />
                  <datalist id="bank-suggestions-list">
                    {allBankSuggestions.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>

                {/* Account Number & Branch */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      {t('bankColAccNo', 'เลขที่บัญชี')}
                      <span className="form-label-required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={tText('เลขที่บัญชี...', 'Account number...')}
                      className="form-input"
                      value={formData.account_no}
                      onChange={e => setFormData({ ...formData, account_no: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('bankColBranch', 'สาขา')}</label>
                    <input
                      type="text"
                      placeholder={tText('สาขา...', 'Branch...')}
                      className="form-input"
                      value={formData.bank_branch}
                      onChange={e => setFormData({ ...formData, bank_branch: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Account Name */}
                <div className="form-group">
                  <label className="form-label">
                    {t('bankColAccName', 'ชื่อบัญชี')}
                    <span className="form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tText('ชื่อบัญชี...', 'Account name...')}
                    className="form-input"
                    value={formData.account_name}
                    onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                  {t('actionCancel', 'ยกเลิก')}
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {modalMode === 'add' ? tText('บันทึก', 'Create') : tText('บันทึก', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankAccountTable;
