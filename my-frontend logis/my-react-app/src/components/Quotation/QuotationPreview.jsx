import React, { useState, useEffect } from 'react';
import { X, Printer, Globe, FileText, Info, Check } from 'lucide-react';
import logoImg from '../../assets/LOGO.svg';
import quotationDictionary from './quotationDictionary';

// Format currency as standard number without prepended symbol in cells
const formatNumber = (num) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(num) || 0);
};

// English Date formatting helper: 08 Sept 2026
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

// Thai Date formatting helper: 30 มกราคม 2569
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

// Thai Baht Text helper: (เจ็ดหมื่นสามพันสามร้อยบาทถ้วน)
const bahtText = (num) => {
  if (num === null || num === undefined) return '';
  const number = Number(num);
  if (isNaN(number) || number === 0) return 'ศูนย์บาทถ้วน';

  const thaiNums = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thaiPositions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const str = number.toFixed(2);
  const [bahtStr, satangStr] = str.split('.');

  let result = '';
  const bahtLen = bahtStr.length;

  if (bahtLen === 1 && bahtStr[0] === '0') {
    result = '';
  } else {
    for (let i = 0; i < bahtLen; i++) {
      const digit = Number(bahtStr[i]);
      const pos = bahtLen - 1 - i;

      if (digit !== 0) {
        let currentDigitText = thaiNums[digit];
        let currentPosText = thaiPositions[pos % 6];

        if (pos % 6 === 0 && pos > 0) {
          currentPosText = 'ล้าน';
        }

        if (pos % 6 === 1 && digit === 1) {
          currentDigitText = '';
        } else if (pos % 6 === 1 && digit === 2) {
          currentDigitText = 'ยี่';
        } else if (pos % 6 === 0 && digit === 1 && i > 0) {
          currentDigitText = 'เอ็ด';
        }

        result += currentDigitText + currentPosText;
      } else {
        if (pos % 6 === 0 && pos > 0 && bahtStr.substring(Math.max(0, i - 5), i + 1) !== '000000') {
          result += 'ล้าน';
        }
      }
    }
    result += 'บาท';
  }

  if (satangStr && satangStr !== '00') {
    const digit1 = Number(satangStr[0]);
    const digit2 = Number(satangStr[1]);

    let d1Text = thaiNums[digit1];
    let d2Text = thaiNums[digit2];

    if (digit1 !== 0) {
      if (digit1 === 1) d1Text = '';
      else if (digit1 === 2) d1Text = 'ยี่';
      result += d1Text + 'สิบ';
    }
    if (digit2 !== 0) {
      if (digit2 === 1 && digit1 !== 0) d2Text = 'เอ็ด';
      result += d2Text;
    }
    result += 'สตางค์';
  } else {
    result += 'ถ้วน';
  }

  return result;
};

export default function QuotationPreview({ doc, items = [], customerList = [], onClose }) {
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

  const t = quotationDictionary[lang] || quotationDictionary.th;

  const customer = Array.isArray(customerList)
    ? customerList.find(c => String(c.customer_id) === String(doc.customer_id) || String(c.id) === String(doc.customer_id))
    : null;

  const customerName = customer?.customer_name || doc.customer_name || doc.customer_id;
  const displayInNameOf = customerName
    ? (lang === 'th' ? `ในนาม ${customerName}` : `For and on behalf of ${customerName}`)
    : t.inNameOfCustomer;

  const subtotal = items.reduce((sum, it) => {
    const qty = Number(it.item_quantity) || Number(it.quantity) || 1;
    const price = Number(it.unit_price) || Number(it.pricePerUnit) || 0;
    return sum + (qty * price);
  }, 0);

  const grandTotal = doc.grand_total != null ? Number(doc.grand_total) : subtotal;
  const docDateDisplay = lang === 'th' ? formatThaiDate(doc.document_date || doc.issueDate) : formatDate(doc.document_date || doc.issueDate);

  return (
    <>
      {/* Dynamic print and preview helper styles */}
      <style>{`
        @keyframes qtFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .qt-custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .qt-custom-scrollbar::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .qt-custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .qt-custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @media print {
          .qt-modal-backdrop-print {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
          }
          .qt-modal-card-print {
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
          .qt-canvas-print {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Backdrop overlay */}
      <div
        className="qt-modal-backdrop-print"
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
        {/* Main Modal Card Container */}
        <div
          className="qt-modal-card-print"
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
            animation: 'qtFadeIn 0.22s ease-out',
            boxSizing: 'border-box'
          }}
        >
          {/* ========================================================= */}
          {/* LEFT SIDE: Document Preview Canvas (with soft background) */}
          {/* ========================================================= */}
          <div
            className="qt-canvas-print qt-custom-scrollbar"
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
              className="quotation-preview-print"
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
                {/* Left: Company Details stacked vertically */}
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px', color: '#1e293b' }}>
                  <img
                    src={logoImg}
                    alt="Logo"
                    style={{ height: '48px', alignSelf: 'flex-start', marginBottom: '8px', objectFit: 'contain' }}
                  />
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1b365d' }}>
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

                {/* Right: Quotation Title and Rounded Box */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#1b365d', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                    {t.docTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600', letterSpacing: '1px', marginTop: '2px' }}>
                    {t.docSubtitle}
                  </div>
                  <div style={{
                    border: '1px solid #38bdf8',
                    borderRadius: '6px',
                    backgroundColor: '#f0f9ff',
                    padding: '4px 14px',
                    color: '#0369a1',
                    fontWeight: '700',
                    fontSize: '13px',
                    textAlign: 'center',
                    minWidth: '160px',
                    marginTop: '12px'
                  }}>
                    {doc.document_no || doc.document_id || '-'}
                  </div>
                </div>
              </div>

              {/* Divider Line */}
              <div style={{ height: '1px', backgroundColor: '#cbd5e1', marginBottom: '12px' }} />

              {/* Info Section (Side-by-side Cards) */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                {/* Left Box: BILL TO */}
                <div style={{
                  flex: 1,
                  border: '1px solid #1b365d',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  backgroundColor: '#eff6ff',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
                    {t.billToTitle}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1b365d', marginBottom: '8px' }}>
                    {customerName || '-'}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#475569' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '65px', padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>{t.labelTax}</td>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#0f172a', fontWeight: '500' }}>
                          {customer?.tax_id || doc.tax_id || doc.taxId || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>{t.labelAddress}</td>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#334155', lineHeight: '1.4' }}>
                          {customer?.address || doc.address || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>{t.labelContact}</td>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#334155' }}>
                          {[customer?.contact_person || doc.contact_person || doc.contactPerson, customer?.phone || doc.phone].filter(Boolean).join(' · ') || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>{t.labelEmail}</td>
                        <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#1d4ed8' }}>
                          {customer?.email || doc.email || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Box: Document Details */}
                <div style={{
                  flex: 1,
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
                    {t.docDetailsTitle}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '90px', padding: '5px 0', color: '#64748b' }}>{t.labelDocNo}</td>
                        <td style={{ padding: '5px 0', color: '#0f172a', fontWeight: '700' }}>
                          {doc.document_no || doc.document_id || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0', color: '#64748b' }}>{t.labelDocDate}</td>
                        <td style={{ padding: '5px 0', color: '#0f172a', fontWeight: '500' }}>
                          {docDateDisplay}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0', color: '#64748b' }}>{t.labelSales}</td>
                        <td style={{ padding: '5px 0', color: '#0f172a', fontWeight: '500' }}>
                          {doc.sale_name || doc.salesperson || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0', color: '#64748b', verticalAlign: 'top' }}>{t.labelJob}</td>
                        <td style={{ padding: '5px 0', color: '#0f172a', fontWeight: '500', verticalAlign: 'top', lineHeight: '1.4' }}>
                          {doc.job_name || doc.projectName || doc.project || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#1b365d',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontWeight: '600',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}>
                    <th style={{ width: '45px', padding: '7px 8px', border: '1px solid #1b365d' }}>{t.thItem}</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', border: '1px solid #1b365d' }}>{t.thDesc}</th>
                    <th style={{ width: '65px', padding: '7px 8px', border: '1px solid #1b365d' }}>{t.thQty}</th>
                    <th style={{ width: '65px', padding: '7px 8px', border: '1px solid #1b365d' }}>{t.thUnit}</th>
                    <th style={{ width: '110px', padding: '7px 10px', textAlign: 'right', border: '1px solid #1b365d' }}>{t.thUnitPrice}</th>
                    <th style={{ width: '120px', padding: '7px 12px', textAlign: 'right', border: '1px solid #1b365d' }}>{t.thAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', border: '1px solid #cbd5e1' }}>
                        {t.noItems}
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => {
                      const qty = Number(it.item_quantity) || Number(it.quantity) || 1;
                      const price = Number(it.unit_price) || Number(it.pricePerUnit) || 0;
                      const total = qty * price;

                      let mainService = it.service_typename || it.serviceType;
                      let mainName = mainService || t.defaultService;
                      const routeText = [doc.consigner_address, doc.consignee_address].filter(Boolean).join(' → ');

                      return (
                        <tr key={it.document_items_id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'left', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{mainName}</div>
                            {routeText && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{routeText}</div>}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                            {qty}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                            {it.unit || it.unitQuantity || '-'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                            {formatNumber(price)}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: '#0f172a', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                            {formatNumber(total)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Subtotal row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 0 6px 0', fontSize: '12px' }}>
                <div style={{ display: 'flex', width: '280px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: '500' }}>{t.subtotalLabel}</span>
                  <span style={{ fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'right', marginRight: '8px' }}>
                    {formatNumber(subtotal)}
                  </span>
                  <span style={{ color: '#475569', fontWeight: '500' }}>{t.currencyUnit}</span>
                </div>
              </div>

              {/* Grand Total Bar */}
              <div style={{
                backgroundColor: '#1b365d',
                color: '#ffffff',
                borderRadius: '4px',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: '700',
                fontSize: '13px',
                marginBottom: '12px'
              }}>
                <div style={{ textAlign: 'left', fontWeight: '600' }}>
                  {lang === 'th' ? `(${bahtText(grandTotal)})` : `(Total in THB)`}
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <span>{t.grandTotalLabel}</span>
                  <span style={{ fontSize: '16px', fontWeight: '800' }}>
                    {formatNumber(grandTotal)}
                  </span>
                  <span>{t.currencyUnit}</span>
                </div>
              </div>

              {/* Remark Callout */}
              {doc.remark && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderLeft: '4px solid #1b365d',
                  padding: '10px 14px',
                  borderRadius: '0 6px 6px 0',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: '#475569',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontWeight: '700', color: '#1b365d' }}>{t.remarkLabel} </span>
                  <span style={{ whiteSpace: 'pre-wrap' }}>
                    {doc.remark.startsWith('หมายเหตุ:') ? doc.remark.replace(/^หมายเหตุ:\s*/, '') : doc.remark}
                  </span>
                </div>
              )}

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', gap: '60px', fontSize: '12px' }}>
                {/* Customer Side */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ color: '#475569', fontWeight: '600', marginBottom: '32px', textAlign: 'center' }}>
                    {displayInNameOf}
                  </div>
                  <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }} />
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{t.sigCustomerSub}</div>
                    </div>
                    <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }} />
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{t.dateLabel}</div>
                    </div>
                  </div>
                </div>

                {/* Company Side */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ color: '#475569', fontWeight: '600', marginBottom: '32px' }}>
                    {t.sigCompanyTitle}
                  </div>
                  <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }} />
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{t.sigCompanySub}</div>
                    </div>
                    <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }} />
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{t.dateLabel}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div style={{
                marginTop: '20px',
                textAlign: 'right',
                fontSize: '10px',
                color: '#94a3b8'
              }}>
                {doc.document_no || doc.document_id || '-'} - {t.pageInfo}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: Functions & Control Panel (no-print)          */}
          {/* ========================================================= */}
          <div
            className="no-print qt-custom-scrollbar"
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
              {/* Top Row: Quotation Badge & Close button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: '#f0f9ff',
                  color: '#0369a1',
                  border: '1px solid #bae6fd'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                  {doc.document_no || doc.document_id || 'QUOTATION'}
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

              {/* Title Typography (Indicating Document Type) */}
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
                  color: '#0284c7',
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
                  <Globe size={15} color="#0284c7" />
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
                      backgroundColor: lang === 'th' ? '#1b365d' : 'transparent',
                      color: lang === 'th' ? '#ffffff' : '#64748b',
                      boxShadow: lang === 'th' ? '0 2px 6px rgba(27, 54, 93, 0.25)' : 'none',
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
                      backgroundColor: lang === 'en' ? '#1b365d' : 'transparent',
                      color: lang === 'en' ? '#ffffff' : '#64748b',
                      boxShadow: lang === 'en' ? '0 2px 6px rgba(27, 54, 93, 0.25)' : 'none',
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

              {/* Section 2: ข้อมูลใบเสนอราคาโดยย่อ (Quotation Summary Card) */}
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
                  <FileText size={14} color="#1b365d" />
                  <span>{t.docSummaryTitle}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryNo}</span>
                    <span style={{ color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>
                      {doc.document_no || doc.document_id || '-'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryDate}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>
                      {docDateDisplay}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summaryCustomer}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right', maxWidth: '170px', wordBreak: 'break-word' }}>
                      {customerName || '-'}
                    </span>
                  </div>

                  {doc.job_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ color: '#64748b' }}>{t.summaryJob}</span>
                      <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right', maxWidth: '170px', wordBreak: 'break-word' }}>
                        {doc.job_name}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b' }}>{t.summarySales}</span>
                    <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>
                      {doc.sale_name || doc.salesperson || '-'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '6px', borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>{t.summaryGrandTotal}</span>
                    <span style={{ color: '#1b365d', fontWeight: '800', fontSize: '13.5px', textAlign: 'right' }}>
                      {formatNumber(grandTotal)} {t.currencyUnit}
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
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0369a1',
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
                  background: 'linear-gradient(135deg, #1b365d 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(27, 54, 93, 0.35)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(27, 54, 93, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(27, 54, 93, 0.35)';
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
