import React, { useState, useEffect } from 'react';
import { X, Printer, Globe, FileText, Info, Truck, Calendar, MapPin, User, Check } from 'lucide-react';
import logoImg from '../../assets/LOGO.svg';
import doDictionary from './doDictionary';

// Date formatting helper (English): 08 Sept 2026
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Thai Date formatting helper: 8 กันยายน 2569
const formatThaiDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

export default function DeliveryOrderPreview({ doc, onClose }) {
  const [lang, setLang] = useState('th');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!doc) return null;

  const t = doDictionary[lang] || doDictionary.th;

  // Resolve goods items
  let goods = [];
  if (Array.isArray(doc.goods_items) && doc.goods_items.length > 0) {
    goods = doc.goods_items;
  } else if (doc.product_name) {
    goods = [
      {
        description: doc.product_name || '',
        quantity: doc.quantity || '1',
        unit: doc.unit || 'box',
        weight: doc.weight || '0',
        wt_unit: doc.wt_unit || 'kg',
        load_from: doc.load_from || '',
        destination: doc.destination || ''
      }
    ];
  } else {
    goods = [
      {
        description: lang === 'th' ? 'สินค้าทั่วไป' : 'General Cargo',
        quantity: '1',
        unit: 'box',
        weight: '0',
        wt_unit: 'kg',
        load_from: '',
        destination: ''
      }
    ];
  }

  const consignorName = doc.consignor_name || doc.consigner_name || '-';
  const consignorAddress = [
    doc.consignor_address || doc.consigner_address,
    doc.consignor_city || doc.consigner_city,
    doc.consignor_state || doc.consigner_state,
    doc.consignor_postal_code || doc.consigner_postal_code,
    doc.consignor_country || doc.consigner_country
  ].filter(Boolean).join(' ');

  const consigneeName = doc.consignee_name || '-';
  const consigneeAddress = [
    doc.consignee_address,
    doc.consignee_city,
    doc.consignee_state,
    doc.consignee_postal_code,
    doc.consignee_country
  ].filter(Boolean).join(' ');

  const destinationDisplay = goods[0]?.destination || doc.destination || '-';
  const loadDateDisplay = lang === 'th' ? formatThaiDate(doc.date_of_load) : formatDate(doc.date_of_load);
  const etaDisplay = lang === 'th' ? formatThaiDate(doc.eta) : formatDate(doc.eta);

  return (
    <>
      {/* Dynamic print and preview helper styles */}
      <style>{`
        @keyframes doFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .do-custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .do-custom-scrollbar::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .do-custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .do-custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @media print {
          .do-modal-backdrop-print {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
          }
          .do-modal-card-print {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .do-canvas-print {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Backdrop overlay */}
      <div
        className="do-modal-backdrop-print"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}
      >
        {/* Main Modal Card Container: Left = Document, Right = Actions (Matching Image 5 layout swapped) */}
        <div
          className="do-modal-card-print"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '1240px',
            width: '100%',
            height: '92vh',
            maxHeight: '920px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            animation: 'doFadeIn 0.22s ease-out',
            boxSizing: 'border-box'
          }}
        >
          {/* ========================================================= */}
          {/* LEFT SIDE: Document Preview Canvas (with soft background) */}
          {/* ========================================================= */}
          <div
            className="do-canvas-print do-custom-scrollbar"
            style={{
              flex: '1 1 0%',
              minWidth: 0,
              backgroundColor: '#f1f5f9',
              overflowY: 'auto',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* White A4 Sheet Container */}
            <div
              className="do-preview-print quotation-preview-print"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                padding: '36px 42px',
                color: '#0f172a',
                fontFamily: "'Sarabun', 'Inter', 'Segoe UI', Tahoma, sans-serif",
                display: 'flex',
                flexDirection: 'column',
                minHeight: '297mm',
                maxWidth: '820px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                {/* Left: Company Details */}
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px', color: '#1e293b' }}>
                  <img
                    src={logoImg}
                    alt="Logo"
                    style={{ height: '48px', alignSelf: 'flex-start', marginBottom: '8px', objectFit: 'contain' }}
                  />
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                    {t.companyName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    {t.companyAddress}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    {t.taxIdLabel}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    {t.telLabel}
                  </div>
                </div>

                {/* Right: Title & D.O. Badge */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#581c87', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                    {t.docTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7e22ce', fontWeight: '600', letterSpacing: '1px', marginTop: '2px' }}>
                    {t.docSubtitle}
                  </div>
                  <div style={{
                    border: '1px solid #c084fc',
                    borderRadius: '6px',
                    backgroundColor: '#faf5ff',
                    padding: '4px 14px',
                    color: '#6b21a8',
                    fontWeight: '700',
                    fontSize: '13px',
                    textAlign: 'center',
                    minWidth: '160px',
                    marginTop: '12px'
                  }}>
                    {doc.do_no || '-'}
                  </div>
                </div>
              </div>

              {/* Divider Line */}
              <div style={{ height: '1px', backgroundColor: '#e9d5ff', marginBottom: '12px' }} />

              {/* 4-Box Balanced Information Grid (2x2 Layout) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '14px',
                alignItems: 'stretch'
              }}>
                {/* Box 1 (Top-Left): CONSIGNOR */}
                <div style={{
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  backgroundColor: '#faf5ff',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  minHeight: '115px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0f172a',
                    marginBottom: '5px'
                  }}>
                    {t.box1Header}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    {consignorName}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.45', wordBreak: 'break-word' }}>
                    {consignorAddress || '-'}
                  </div>
                </div>

                {/* Box 2 (Top-Right): DOCUMENT & TRANSPORT DETAILS */}
                <div style={{
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  minHeight: '115px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0f172a',
                    marginBottom: '5px'
                  }}>
                    {t.box2Header}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    columnGap: '12px',
                    rowGap: '3px',
                    fontSize: '10.5px',
                    marginTop: '2px'
                  }}>
                    <div>
                      <span style={{ color: '#64748b' }}>{t.labelDoNo} </span>
                      <span style={{ color: '#0f172a', fontWeight: '700' }}>{doc.do_no || '-'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>{t.labelDateOfLoad} </span>
                      <span style={{ color: '#0f172a', fontWeight: '600' }}>{loadDateDisplay}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>{t.labelBookingNo} </span>
                      <span style={{ color: '#0f172a', fontWeight: '600' }}>{doc.booking_no || doc.booking_id || '-'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>{t.labelEta} </span>
                      <span style={{ color: '#0f172a', fontWeight: '600' }}>{etaDisplay}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>{t.labelTruck} </span>
                      <span style={{ color: '#0f172a', fontWeight: '600' }}>{doc.truck_number || '-'} {doc.car_type ? `(${doc.car_type})` : ''}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>{t.labelInvoiceNo} </span>
                      <span style={{ color: '#0f172a', fontWeight: '600' }}>{doc.invoice_no || '-'}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748b' }}>{t.labelDriver} </span>
                      <span style={{ color: '#0f172a', fontWeight: '500' }}>{[doc.driver_name, doc.driver_phone].filter(Boolean).join(' · ') || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Box 3 (Bottom-Left): CONSIGNEE */}
                <div style={{
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  backgroundColor: '#faf5ff',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  minHeight: '115px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0f172a',
                    marginBottom: '5px'
                  }}>
                    {t.box3Header}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    {consigneeName}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.45', wordBreak: 'break-word' }}>
                    {consigneeAddress || '-'}
                  </div>
                </div>

                {/* Box 4 (Bottom-Right): CUSTOMER */}
                <div style={{
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  minHeight: '115px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0f172a',
                    marginBottom: '5px'
                  }}>
                    {t.box4Header}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    {doc.customer_name || '-'}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', color: '#475569' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '65px', padding: '1.5px 0', verticalAlign: 'top', color: '#64748b' }}>{t.labelCustTax}</td>
                        <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#0f172a', fontWeight: '500' }}>
                          {doc.customer_tax_id || doc.tax_id || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#64748b' }}>{t.labelCustAddress}</td>
                        <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#334155', lineHeight: '1.4' }}>
                          {doc.customer_address || doc.address || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#64748b' }}>{t.labelCustContact}</td>
                        <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#334155' }}>
                          {[doc.customer_contact_person, doc.customer_phone].filter(Boolean).join(' · ') || doc.customer_phone || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11px' }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#581c87',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontWeight: '600',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}>
                    <th style={{ width: '50px', padding: '7px 8px', border: '1px solid #581c87' }}>{t.thItem}</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', border: '1px solid #581c87' }}>{t.thDesc}</th>
                    <th style={{ width: '85px', padding: '7px 8px', border: '1px solid #581c87' }}>{t.thQty}</th>
                    <th style={{ width: '180px', padding: '7px 12px', textAlign: 'left', border: '1px solid #581c87' }}>{t.thLoadFrom}</th>
                    <th style={{ width: '180px', padding: '7px 12px', textAlign: 'left', border: '1px solid #581c87' }}>{t.thDestination}</th>
                  </tr>
                </thead>
                <tbody>
                  {goods.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e9d5ff' }}>
                        {t.noItems}
                      </td>
                    </tr>
                  ) : (
                    goods.map((item, idx) => {
                      const qtyDisplay = item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : '1';
                      const loadFromDisplay = item.load_from || doc.load_from || '-';
                      const destinationDisplayItem = item.destination || doc.destination || '-';

                      return (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#faf5ff' }}>
                          <td style={{ padding: '6px 8px', textAlign: 'center', color: '#334155', border: '1px solid #e9d5ff', verticalAlign: 'top' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'left', color: '#0f172a', fontWeight: '600', border: '1px solid #e9d5ff', verticalAlign: 'top' }}>
                            {item.description || item.product_name || '-'}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', color: '#0f172a', fontWeight: '600', border: '1px solid #e9d5ff', verticalAlign: 'top' }}>
                            {qtyDisplay}
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'left', color: '#475569', border: '1px solid #e9d5ff', verticalAlign: 'top' }}>
                            {loadFromDisplay}
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'left', color: '#475569', border: '1px solid #e9d5ff', verticalAlign: 'top' }}>
                            {destinationDisplayItem}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Sub-table Information Boxes: REMARK, SHIPPING, WAREHOUSE */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr',
                gap: '12px',
                marginBottom: '14px',
                alignItems: 'stretch'
              }}>
                {/* Box 1: REMARK */}
                <div style={{
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  minHeight: '40px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', fontSize: '11px' }}>
                    {t.remarkLabel}
                  </span>
                  <span style={{ color: '#334155', fontSize: '11px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                    {doc.remark || '-'}
                  </span>
                </div>

                {/* Box 2: SHIPPING */}
                <div style={{
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '40px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', fontSize: '11px' }}>
                    {t.shippingLabel}
                  </span>
                  <span style={{ color: '#334155', fontSize: '11px', fontWeight: '500', wordBreak: 'break-word' }}>
                    {doc.shipping || '-'}
                  </span>
                </div>

                {/* Box 3: WAREHOUSE */}
                <div style={{
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '40px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', fontSize: '11px' }}>
                    {t.warehouseLabel}
                  </span>
                  <span style={{ color: '#334155', fontSize: '11px', fontWeight: '500', wordBreak: 'break-word' }}>
                    {doc.warehouse || '-'}
                  </span>
                </div>
              </div>

              {/* Signatures Section (3 Columns) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 'auto',
                gap: '30px',
                fontSize: '11px',
                paddingTop: '20px'
              }}>
                {/* Receiver / Consignee */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ color: '#0f172a', fontWeight: '600', marginBottom: '36px', textAlign: 'center' }}>
                    {t.sigReceiverTitle}
                  </div>
                  <div style={{ borderBottom: '1px dotted #a855f7', width: '85%', height: '16px' }}></div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{t.sigReceiverSub}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>{t.datePlaceholder}</div>
                </div>

                {/* Driver / Delivered By */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ color: '#0f172a', fontWeight: '600', marginBottom: '36px', textAlign: 'center' }}>
                    {t.sigDriverTitle}
                  </div>
                  <div style={{ borderBottom: '1px dotted #a855f7', width: '85%', height: '16px' }}></div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                    ({doc.driver_name || t.sigDriverSub})
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>{t.datePlaceholder}</div>
                </div>

                {/* Authorized S.T. Trans Express */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ color: '#0f172a', fontWeight: '600', marginBottom: '36px', textAlign: 'center' }}>
                    {t.sigCompanyTitle}
                  </div>
                  <div style={{ borderBottom: '1px dotted #a855f7', width: '85%', height: '16px' }}></div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{t.sigCompanySub}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>{t.datePlaceholder}</div>
                </div>
              </div>

              {/* Page Footer */}
              <div style={{
                marginTop: '20px',
                textAlign: 'right',
                fontSize: '10px',
                color: '#94a3b8'
              }}>
                {doc.do_no || '-'} - {t.pageInfo}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: Functions & Control Panel (no-print)          */}
          {/* ========================================================= */}
          <div
            className="no-print do-custom-scrollbar"
            style={{
              width: '380px',
              flexShrink: 0,
              backgroundColor: '#ffffff',
              borderLeft: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              boxSizing: 'border-box'
            }}
          >
            {/* Header & Main Functions Area */}
            <div style={{ padding: '24px 24px 16px', overflowY: 'auto', flex: 1 }}>
              {/* Top Row: D.O. Badge & Close button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: '#faf5ff',
                  color: '#6b21a8',
                  border: '1px solid #e9d5ff'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#9333ea' }} />
                  {doc.do_no || 'DELIVERY ORDER'}
                </span>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Title Typography (Instead of "Send Your Invoice") */}
              <div style={{ marginBottom: '22px' }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#0f172a',
                  letterSpacing: '-0.4px',
                  lineHeight: '1.25',
                  margin: 0
                }}>
                  {t.modalTitle}
                </h2>
                <p style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#7c3aed',
                  marginTop: '4px',
                  letterSpacing: '0.2px'
                }}>
                  {t.modalSubtitle}
                </p>
              </div>

              {/* Section 1: เปลี่ยนภาษา (Language Selector) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#334155',
                  marginBottom: '8px'
                }}>
                  <Globe size={15} color="#7c3aed" />
                  <span>{t.langSelectorLabel}</span>
                </label>

                {/* Segmented Switcher */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  backgroundColor: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '10px'
                }}>
                  <button
                    type="button"
                    onClick={() => setLang('th')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: lang === 'th' ? '700' : '500',
                      cursor: 'pointer',
                      backgroundColor: lang === 'th' ? '#6b21a8' : 'transparent',
                      color: lang === 'th' ? '#ffffff' : '#64748b',
                      boxShadow: lang === 'th' ? '0 2px 6px rgba(107, 33, 168, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.5px 5.5px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      letterSpacing: '0.4px',
                      backgroundColor: lang === 'th' ? 'rgba(255, 255, 255, 0.22)' : '#e2e8f0',
                      color: lang === 'th' ? '#ffffff' : '#475569',
                      border: lang === 'th' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid #cbd5e1',
                      lineHeight: '1.2'
                    }}>
                      TH
                    </span>
                    <span>{t.thBtn}</span>
                    {lang === 'th' && <Check size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: lang === 'en' ? '700' : '500',
                      cursor: 'pointer',
                      backgroundColor: lang === 'en' ? '#6b21a8' : 'transparent',
                      color: lang === 'en' ? '#ffffff' : '#64748b',
                      boxShadow: lang === 'en' ? '0 2px 6px rgba(107, 33, 168, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.5px 5.5px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      letterSpacing: '0.4px',
                      backgroundColor: lang === 'en' ? 'rgba(255, 255, 255, 0.22)' : '#e2e8f0',
                      color: lang === 'en' ? '#ffffff' : '#475569',
                      border: lang === 'en' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid #cbd5e1',
                      lineHeight: '1.2'
                    }}>
                      EN
                    </span>
                    <span>{t.enBtn}</span>
                    {lang === 'en' && <Check size={14} />}
                  </button>
                </div>
              </div>

              {/* Section 2: ข้อมูลการจัดส่งโดยย่อ (Delivery Summary Card) */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                padding: '14px 16px',
                marginBottom: '18px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '12px',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '8px'
                }}>
                  <FileText size={14} color="#6b21a8" />
                  <span>{t.docSummaryTitle}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryDoNo}</span>
                    <span style={{ color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{doc.do_no || '-'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryLoadDate}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>{loadDateDisplay}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryEta}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>{etaDisplay}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryConsignee}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right', maxWidth: '170px', wordBreak: 'break-word' }}>
                      {consigneeName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryDestination}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right', maxWidth: '170px', wordBreak: 'break-word' }}>
                      {destinationDisplay}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryTruck}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>
                      {doc.truck_number || '-'} {doc.car_type ? `(${doc.car_type})` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryDriver}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right', maxWidth: '170px', wordBreak: 'break-word' }}>
                      {doc.driver_name || '-'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryItems}</span>
                    <span style={{ color: '#6b21a8', fontWeight: '700', textAlign: 'right' }}>
                      {goods.length} {t.itemsUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Helpful Print Hint Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#faf5ff',
                border: '1px solid #e9d5ff',
                color: '#6b21a8',
                fontSize: '11.5px',
                lineHeight: '1.45'
              }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.printHint}</span>
              </div>
            </div>

            {/* Bottom Actions Area (Sticky at Bottom) */}
            <div style={{
              padding: '16px 24px 22px',
              borderTop: '1px solid #f1f5f9',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Primary Action: Print / Export PDF */}
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6b21a8 0%, #7e22ce 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(107, 33, 168, 0.35)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(107, 33, 168, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(107, 33, 168, 0.35)';
                }}
              >
                <Printer size={18} />
                <span>{t.printBtn}</span>
              </button>

              {/* Secondary Action: Close */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#94a3b8';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                <X size={16} />
                <span>{t.closeBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
