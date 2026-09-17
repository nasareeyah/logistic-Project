import React from 'react';
import { X, Printer } from 'lucide-react';
import logoImg from '../../assets/LOGO.svg';

// Date formatting helper: 08 Sept 2026
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
  if (!doc) return null;

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
        description: 'สินค้าทั่วไป',
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '30px',
      overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '840px', width: '100%' }}>
        {/* Toolbar (no-print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '12px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            <span>Print / Export PDF</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>

        {/* A4 Document Container */}
        <div className="do-preview-print quotation-preview-print" style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          padding: '32px 40px',
          color: '#0f172a',
          fontFamily: "'Sarabun', 'Inter', 'Segoe UI', Tahoma, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            {/* Left: Company Details */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px', color: '#1e293b' }}>
              <img
                src={logoImg}
                alt="Logo"
                style={{ height: '48px', alignSelf: 'flex-start', marginBottom: '8px', objectFit: 'contain' }}
              />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1b365d' }}>
                บริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                123/4 หมู่ที่ 2 ต.สำนักขาม อ.สะเดา จ.สงขลา 90320
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                เลขประจำตัวผู้เสียภาษี: 0905566002392
              </div>
              <div style={{ fontSize: '11px', color: '#475569' }}>
                โทร. 098-2591455 / 098-0150083
              </div>
            </div>

            {/* Right: Title & D.O. Badge */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1b365d', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                ใบสั่งส่งสินค้า
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px', marginTop: '2px' }}>
                DELIVERY ORDER (D.O.)
              </div>
              <div style={{
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                padding: '4px 14px',
                color: '#1d4ed8',
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
          <div style={{ height: '1px', backgroundColor: '#cbd5e1', marginBottom: '12px' }}></div>

          {/* 4-Box Balanced Information Grid (2x2 Layout) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '14px',
            alignItems: 'stretch'
          }}>
            {/* Box 1 (Top-Left): ผู้ส่งสินค้า (CONSIGNOR) */}
            <div style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 14px',
              backgroundColor: '#eff6ff',
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
                color: '#1b365d',
                marginBottom: '5px'
              }}>
                ผู้ส่งสินค้า / CONSIGNOR
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                {consignorName}
              </div>
              <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.45', wordBreak: 'break-word' }}>
                {consignorAddress || '-'}
              </div>
            </div>

            {/* Box 2 (Top-Right): รายละเอียดเอกสารและการขนส่ง (DOCUMENT & TRANSPORT DETAILS) */}
            <div style={{
              border: '1px solid #cbd5e1',
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
                color: '#1b365d',
                marginBottom: '5px'
              }}>
                รายละเอียดเอกสารและการขนส่ง / DOCUMENT DETAILS
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
                  <span style={{ color: '#64748b' }}>D.O. No.: </span>
                  <span style={{ color: '#0f172a', fontWeight: '700' }}>{doc.do_no || '-'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Date of Load: </span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatDate(doc.date_of_load)}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Booking No.: </span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{doc.booking_no || doc.booking_id || '-'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>ETA: </span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatDate(doc.eta)}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>ทะเบียนรถ: </span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{doc.truck_number || '-'} {doc.car_type ? `(${doc.car_type})` : ''}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Invoice No.: </span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{doc.invoice_no || '-'}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b' }}>พนักงานขับรถ: </span>
                  <span style={{ color: '#0f172a', fontWeight: '500' }}>{[doc.driver_name, doc.driver_phone].filter(Boolean).join(' · ') || '-'}</span>
                </div>
              </div>
            </div>

            {/* Box 3 (Bottom-Left): ผู้รับสินค้า (CONSIGNEE) */}
            <div style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '10px 14px',
              backgroundColor: '#eff6ff',
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
                color: '#1b365d',
                marginBottom: '5px'
              }}>
                ผู้รับสินค้า / CONSIGNEE
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                {consigneeName}
              </div>
              <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.45', wordBreak: 'break-word' }}>
                {consigneeAddress || '-'}
              </div>
            </div>

            {/* Box 4 (Bottom-Right): ข้อมูลลูกค้า (CUSTOMER) */}
            <div style={{
              border: '1px solid #cbd5e1',
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
                color: '#1b365d',
                marginBottom: '5px'
              }}>
                ข้อมูลลูกค้า / CUSTOMER
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1b365d', marginBottom: '4px' }}>
                {doc.customer_name || '-'}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', color: '#475569' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '65px', padding: '1.5px 0', verticalAlign: 'top', color: '#64748b' }}>เลขภาษี:</td>
                    <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#0f172a', fontWeight: '500' }}>
                      {doc.customer_tax_id || doc.tax_id || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#64748b' }}>ที่อยู่:</td>
                    <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#334155', lineHeight: '1.4' }}>
                      {doc.customer_address || doc.address || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1.5px 0', verticalAlign: 'top', color: '#64748b' }}>ผู้ติดต่อ:</td>
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
                backgroundColor: '#1b365d',
                color: '#ffffff',
                textAlign: 'center',
                fontWeight: '600',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}>
                <th style={{ width: '50px', padding: '7px 8px', border: '1px solid #1b365d' }}>ITEM</th>
                <th style={{ padding: '7px 12px', textAlign: 'left', border: '1px solid #1b365d' }}>DESCRIPTION OF GOODS</th>
                <th style={{ width: '85px', padding: '7px 8px', border: '1px solid #1b365d' }}>QUANTITY</th>
                <th style={{ width: '180px', padding: '7px 12px', textAlign: 'left', border: '1px solid #1b365d' }}>LOAD FROM</th>
                <th style={{ width: '180px', padding: '7px 12px', textAlign: 'left', border: '1px solid #1b365d' }}>DESTINATION</th>
              </tr>
            </thead>
            <tbody>
              {goods.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', border: '1px solid #cbd5e1' }}>
                    ไม่มีรายการสินค้า
                  </td>
                </tr>
              ) : (
                goods.map((item, idx) => {
                  const qtyDisplay = item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : '1';
                  const loadFromDisplay = item.load_from || doc.load_from || '-';
                  const destinationDisplay = item.destination || doc.destination || '-';

                  return (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'left', color: '#0f172a', fontWeight: '600', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        {item.description || item.product_name || '-'}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#0f172a', fontWeight: '600', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        {qtyDisplay}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'left', color: '#475569', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        {loadFromDisplay}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'left', color: '#475569', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        {destinationDisplay}
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
              border: '1px solid #cbd5e1',
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
                REMARK:
              </span>
              <span style={{ color: '#334155', fontSize: '11px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                {doc.remark || '-'}
              </span>
            </div>

            {/* Box 2: SHIPPING */}
            <div style={{
              border: '1px solid #cbd5e1',
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
                SHIPPING:
              </span>
              <span style={{ color: '#334155', fontSize: '11px', fontWeight: '500', wordBreak: 'break-word' }}>
                {doc.shipping || '-'}
              </span>
            </div>

            {/* Box 3: WAREHOUSE */}
            <div style={{
              border: '1px solid #cbd5e1',
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
                WAREHOUSE:
              </span>
              <span style={{ color: '#334155', fontSize: '11px', fontWeight: '500', wordBreak: 'break-word' }}>
                {doc.warehouse || '-'}
              </span>
            </div>
          </div>

          {/* Signatures Section (3 Columns like professional delivery document) */}
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
              <div style={{ color: '#475569', fontWeight: '600', marginBottom: '36px', textAlign: 'center' }}>
                ผู้รับสินค้า (Received By)
              </div>
              <div style={{ borderBottom: '1px dotted #64748b', width: '85%', height: '16px' }}></div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>(ลงลายมือชื่อผู้รับสินค้า)</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>วันที่: ......./......./...........</div>
            </div>

            {/* Driver / Delivered By */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#475569', fontWeight: '600', marginBottom: '36px', textAlign: 'center' }}>
                พนักงานขับรถ / ผู้ส่งมอบ (Delivered By)
              </div>
              <div style={{ borderBottom: '1px dotted #64748b', width: '85%', height: '16px' }}></div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                ({doc.driver_name || 'ลงลายมือชื่อพนักงานส่งมอบ'})
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>วันที่: ......./......./...........</div>
            </div>

            {/* Authorized S.T. Trans Express */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#475569', fontWeight: '600', marginBottom: '36px', textAlign: 'center' }}>
                ในนาม บจก. เอส.ที.ทราน เอ็กซ์เพรส
              </div>
              <div style={{ borderBottom: '1px dotted #64748b', width: '85%', height: '16px' }}></div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>(ผู้มีอำนาจลงนาม / Authorized Signature)</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>วันที่: ......./......./...........</div>
            </div>
          </div>

          {/* Page Footer */}
          <div style={{
            marginTop: '20px',
            textAlign: 'right',
            fontSize: '10px',
            color: '#94a3b8'
          }}>
            {doc.do_no || '-'} - หน้า 1/1
          </div>
        </div>
      </div>
    </div>
  );
}
