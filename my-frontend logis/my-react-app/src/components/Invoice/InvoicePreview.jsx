import React from 'react';
import { X, Printer } from 'lucide-react';
import logoImg from '../../assets/LOGO.svg';

// Format currency as standard number without prepended symbol in cells
const formatNumber = (num) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(num) || 0);
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
    const year = d.getFullYear() + 543; // Convert CE to BE
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

export default function InvoicePreview({ invoice, onClose }) {
  if (!invoice) return null;

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = items.reduce((sum, it) => {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.unit_price) || 0;
    return sum + (Number(it.total_amount) || (qty * price));
  }, 0);

  const totalAmount = invoice.total_amount != null ? Number(invoice.total_amount) : subtotal;
  const customerName = invoice.customer_name || invoice.customer_id;
  const displayInNameOf = customerName ? `ในนาม ${customerName}` : 'ในนามบริษัท (ลูกค้า)';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '30px',
      overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '820px', width: '100%' }}>
        {/* Toolbar (no-print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '12px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1b365d',
              borderColor: '#1b365d',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} />
            <span>Print / Export PDF</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              borderColor: '#cbd5e1',
              color: '#334155',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>

        {/* A4 Document Container */}
        <div className="quotation-preview-print do-preview-print" style={{
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
            {/* Left: Company Details stacked vertically */}
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

            {/* Right: Invoice Title and Rounded Box */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1b365d', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                ใบแจ้งหนี้
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px', marginTop: '2px' }}>
                INVOICE
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
                {invoice.invoice_no || '-'}
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
                แจ้งหนี้ถึง (BILL TO)
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1b365d', marginBottom: '8px' }}>
                {customerName || '-'}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#475569' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '65px', padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>เลขภาษี</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#0f172a', fontWeight: '500' }}>
                      {invoice.customer_tax_id || invoice.tax_id || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>ที่อยู่</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#334155', lineHeight: '1.4' }}>
                      {invoice.customer_address || invoice.address || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>ผู้ติดต่อ</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#334155' }}>
                      {[invoice.customer_contact_person || invoice.contact_person, invoice.customer_phone || invoice.phone].filter(Boolean).join(' · ') || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>โทรศัพท์</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#1d4ed8' }}>
                      {invoice.customer_phone || invoice.phone || '-'}
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
                รายละเอียดเอกสาร
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '100px', padding: '4px 0', color: '#64748b' }}>Invoice No.</td>
                    <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: '700' }}>
                      {invoice.invoice_no || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>วันที่ออกเอกสาร</td>
                    <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: '500' }}>
                      {formatThaiDate(invoice.invoice_date)}
                    </td>
                  </tr>
                  {invoice.due_date && (
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>วันครบกำหนด</td>
                      <td style={{ padding: '4px 0', color: '#b91c1c', fontWeight: '600' }}>
                        {formatThaiDate(invoice.due_date)}
                      </td>
                    </tr>
                  )}
                  {invoice.credit_term && (
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>เครดิตเทอม</td>
                      <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: '500' }}>
                        {invoice.credit_term} วัน
                      </td>
                    </tr>
                  )}
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
                <th style={{ width: '45px', padding: '8px 6px', border: '1px solid #1b365d' }}>ลำดับ</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #1b365d' }}>รายการบริการ / รายละเอียด</th>
                <th style={{ width: '70px', padding: '8px 6px', border: '1px solid #1b365d' }}>จำนวน</th>
                <th style={{ width: '75px', padding: '8px 6px', border: '1px solid #1b365d' }}>หน่วย</th>
                <th style={{ width: '110px', padding: '8px 10px', textAlign: 'right', border: '1px solid #1b365d' }}>ราคา/หน่วย</th>
                <th style={{ width: '120px', padding: '8px 12px', textAlign: 'right', border: '1px solid #1b365d' }}>จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', border: '1px solid #cbd5e1' }}>
                    ไม่มีรายการบริการ
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const qty = Number(it.quantity) || 1;
                  const price = Number(it.unit_price) || 0;
                  const total = Number(it.total_amount) || (qty * price);

                  return (
                    <tr key={idx} style={{ backgroundColor: '#ffffff' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'left', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>
                          {it.description || it.service_typename || 'ค่าบริการขนส่ง'}
                        </div>
                        {it.remark && (
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            {it.remark}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        {qty}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                        {it.unit || 'คันรถ'}
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
              <span style={{ color: '#475569', fontWeight: '500' }}>รวมเป็นเงิน</span>
              <span style={{ fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'right', marginRight: '8px' }}>
                {formatNumber(totalAmount)}
              </span>
              <span style={{ color: '#475569', fontWeight: '500' }}>บาท</span>
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
            marginBottom: '12px',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}>
            <div style={{ textAlign: 'left', fontWeight: '600' }}>
              ({bahtText(totalAmount)})
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span>จำนวนเงินรวมทั้งสิ้น</span>
              <span style={{ fontSize: '16px', fontWeight: '800' }}>
                {formatNumber(totalAmount)}
              </span>
              <span>บาท</span>
            </div>
          </div>

          {/* Bank Payment Info & Remark Callout */}
          <div style={{
            backgroundColor: '#eff6ff',
            borderLeft: '4px solid #1b365d',
            borderTop: '1px solid #cbd5e1',
            borderRight: '1px solid #cbd5e1',
            borderBottom: '1px solid #cbd5e1',
            padding: '10px 14px',
            borderRadius: '0 6px 6px 0',
            textAlign: 'left',
            fontSize: '11.5px',
            color: '#334155',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}>
            <div>
              <div style={{ fontWeight: '700', color: '#1b365d', marginBottom: '2px' }}>
                ข้อมูลการชำระเงิน (PAYMENT DETAILS)
              </div>
              <div style={{ lineHeight: '1.4' }}>
                ธนาคาร: <strong>{invoice.bank_name || 'ธนาคารกสิกรไทย (Kasikorn Bank)'}</strong> · สาขา: {invoice.bank_branch || 'สะเดา'}
              </div>
              <div style={{ lineHeight: '1.4' }}>
                ชื่อบัญชี: <strong>{invoice.account_name || 'บจก. เอส.ที.ทราน เอ็กซ์เพรส'}</strong> · เลขที่บัญชี: <strong style={{ color: '#1d4ed8' }}>{invoice.account_no || '123-4-56789-0'}</strong>
              </div>
            </div>
            {invoice.remark && (
              <div style={{ maxWidth: '320px', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                <span style={{ fontWeight: '600', color: '#1b365d' }}>หมายเหตุ: </span>
                {invoice.remark}
              </div>
            )}
          </div>

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
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>ผู้รับใบแจ้งหนี้</div>
                </div>
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }} />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>วันที่</div>
                </div>
              </div>
            </div>

            {/* Company Side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#475569', fontWeight: '600', marginBottom: '32px' }}>
                ในนามบริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด
              </div>
              <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }} />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>ผู้อนุมัติ / ผู้มีอำนาจลงนาม</div>
                </div>
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }} />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>วันที่</div>
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
            {invoice.invoice_no || '-'} - หน้า 1/1
          </div>
        </div>
      </div>
    </div>
  );
}
