import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Trash2,
  Edit3,
  AlertCircle,
  X,
  AlertTriangle
} from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  // Toasts list: [{ id, type: 'create'|'edit'|'delete'|'error', title, message }]
  const [toasts, setToasts] = useState([]);

  // Confirm Modal state: { isOpen, title, itemName, itemSubtitle, itemCode, warningText, confirmText, cancelText, onConfirm }
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    itemName: '',
    itemSubtitle: '',
    itemCode: '',
    warningText: '',
    confirmText: '',
    cancelText: '',
    onConfirm: null
  });

  // Remove toast by id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Add toast helper
  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // เวลาเเสดง ก่อน 3.5 วินาที ก่อนหายไป
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  // Convenience notification methods:
  // สร้างสำเร็จ = เขียว (create/success)
  // แก้ไขสำเร็จ = ฟ้า (edit/info)
  // ลบสำเร็จ = แดง (delete)
  // ผิดพลาด = แดง (error)
  const notify = {
    create: (title, message) => addToast('create', title, message),
    success: (title, message) => addToast('create', title, message),
    edit: (title, message) => addToast('edit', title, message),
    info: (title, message) => addToast('edit', title, message),
    delete: (title, message) => addToast('delete', title, message),
    error: (title, message) => addToast('error', title, message)
  };

  // Open confirmation modal
  const confirmDelete = useCallback(({
    title = 'ยืนยันการลบรายการนี้?',
    itemName = '',
    itemSubtitle = '',
    itemCode = '',
    warningText = 'ข้อมูลและประวัติเอกสารของรายการนี้จะถูกลบทั้งหมดและกู้คืนไม่ได้',
    confirmText = 'ยืนยันการลบ',
    cancelText = 'ยกเลิก',
    onConfirm
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      itemName,
      itemSubtitle,
      itemCode,
      warningText,
      confirmText,
      cancelText,
      onConfirm
    });
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  }, []);

  const handleModalConfirm = () => {
    if (typeof confirmModal.onConfirm === 'function') {
      confirmModal.onConfirm();
    }
    closeConfirmModal();
  };

  // Extract avatar initials (first 2 chars of itemName)
  const getAvatarInitials = (name) => {
    if (!name) return 'ลบ';
    const clean = name.trim();
    return clean.slice(0, 2);
  };

  return (
    <NotificationContext.Provider value={{ notify, confirmDelete }}>
      {children}

      {/* ======================================================== */}
      {/* TOAST CONTAINER (Bottom-Right Floating) */}
      {/* ======================================================== */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => {
          // Color schemes according to user requirements:
          // สร้างสำเร็จ = เขียว
          // แก้ไข = ฟ้า (ธีมเว็บ)
          // ลบ / ผิดพลาด = แดง
          let bg = '#ecfdf5';
          let border = '#6ee7b7';
          let textColor = '#065f46';
          let titleColor = '#047857';
          let IconComp = CheckCircle2;
          let iconColor = '#10b981';

          if (t.type === 'edit') {
            bg = '#f0f9ff';
            border = '#7dd3fc';
            textColor = '#0369a1';
            titleColor = '#0284c7';
            IconComp = Edit3;
            iconColor = '#0284c7';
          } else if (t.type === 'delete') {
            bg = '#fef2f2';
            border = '#fca5a5';
            textColor = '#991b1b';
            titleColor = '#b91c1c';
            IconComp = Trash2;
            iconColor = '#ef4444';
          } else if (t.type === 'error') {
            bg = '#fef2f2';
            border = '#fca5a5';
            textColor = '#991b1b';
            titleColor = '#b91c1c';
            IconComp = AlertCircle;
            iconColor = '#ef4444';
          }

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                backgroundColor: bg,
                border: `1.5px solid ${border}`,
                borderRadius: '14px',
                padding: '14px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                <IconComp size={20} color={iconColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div style={{ fontSize: '14px', fontWeight: '700', color: titleColor, lineHeight: '1.3' }}>
                    {t.title}
                  </div>
                )}
                {t.message && (
                  <div style={{ fontSize: '13px', color: textColor, marginTop: t.title ? '2px' : 0, lineHeight: '1.4', wordBreak: 'break-word' }}>
                    {t.message}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: textColor,
                  opacity: 0.6,
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL (Matching User Screenshot 100%) */}
      {/* ======================================================== */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeInModal 0.2s ease-out'
          }}
          onClick={closeConfirmModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '36px 32px 28px 32px',
              maxWidth: '430px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              textAlign: 'center',
              animation: 'scaleUpModal 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box'
            }}
          >
            {/* Top Icon Badge (Light pink/red circle with red trash icon) */}
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}
            >
              <Trash2 size={30} color="#dc2626" strokeWidth={2.2} />
            </div>

            {/* Modal Title */}
            <h3
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a',
                margin: '0 0 18px 0',
                lineHeight: '1.3'
              }}
            >
              {confirmModal.title}
            </h3>

            {/* Item Preview Card (If itemName or itemCode provided) */}
            {(confirmModal.itemName || confirmModal.itemCode) && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  marginBottom: '18px'
                }}
              >
                {/* Avatar Badge */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    fontWeight: '700',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {getAvatarInitials(confirmModal.itemName)}
                </div>

                {/* Name & Details */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {confirmModal.itemName || '-'}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#64748b',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {[confirmModal.itemSubtitle, confirmModal.itemCode].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            )}

            {/* Warning Text */}
            <p
              style={{
                fontSize: '13.5px',
                color: '#64748b',
                lineHeight: '1.55',
                margin: '0 0 28px 0'
              }}
            >
              {confirmModal.warningText}
            </p>

            {/* Actions: Cancel (Left) & Confirm Delete (Right) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}
            >
              <button
                type="button"
                onClick={closeConfirmModal}
                style={{
                  backgroundColor: '#eff6ff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1d4ed8',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
              >
                {confirmModal.cancelText || 'ยกเลิก'}
              </button>

              <button
                type="button"
                onClick={handleModalConfirm}
                style={{
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              >
                {confirmModal.confirmText || 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUpModal {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Fallback if component is rendered outside provider
    return {
      notify: {
        create: (title, msg) => alert(`${title}: ${msg}`),
        success: (title, msg) => alert(`${title}: ${msg}`),
        edit: (title, msg) => alert(`${title}: ${msg}`),
        info: (title, msg) => alert(`${title}: ${msg}`),
        delete: (title, msg) => alert(`${title}: ${msg}`),
        error: (title, msg) => alert(`${title}: ${msg}`)
      },
      confirmDelete: ({ onConfirm }) => {
        if (window.confirm('ยืนยันการลบ?')) onConfirm?.();
      }
    };
  }
  return context;
}
