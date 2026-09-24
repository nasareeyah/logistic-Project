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

export default function ReceiptPreview({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const customerName = receipt.customer_name || receipt.customer_id;
  const displayInNameOf = customerName ? `ในนาม ${customerName}` : 'ในนามบริษัท (ลูกค้า)';

  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const calculatedSubtotal = items.reduce((acc, it) => acc + (parseFloat(it.total_amount) || (parseFloat(it.quantity) || 1) * (parseFloat(it.unit_price) || 0)), 0);
  const totalAmount = items.length > 0 ? calculatedSubtotal : (parseFloat(receipt.total_amount) || 0);
  const amountPaid = receipt.amount_paid != null ? parseFloat(receipt.amount_paid) : totalAmount;

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
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#166534',
              borderColor: '#166534',
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
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
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

            {/* Right: Receipt Title and Rounded Box */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                ใบเสร็จรับเงิน
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600', letterSpacing: '1px', marginTop: '2px' }}>
                RECEIPT
              </div>
              <div style={{
                border: '1px solid #86efac',
                borderRadius: '6px',
                backgroundColor: '#f0fdf4',
                padding: '4px 14px',
                color: '#166534',
                fontWeight: '700',
                fontSize: '13px',
                textAlign: 'center',
                minWidth: '160px',
                marginTop: '12px'
              }}>
                {receipt.receipt_no || '-'}
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div style={{ height: '1px', backgroundColor: '#bbf7d0', marginBottom: '12px' }} />

          {/* Info Section (Side-by-side Cards) */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
            {/* Left Box: RECEIVED FROM */}
            <div style={{
              flex: 1,
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '10px 14px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              backgroundColor: '#f0fdf4',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                ได้รับเงินจาก (RECEIVED FROM)
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                {customerName || 'ลูกค้าทั่วไป'}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#475569' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '65px', padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>เลขภาษี</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#0f172a', fontWeight: '500' }}>
                      {receipt.customer_tax_id || receipt.tax_id || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>ที่อยู่</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#334155', lineHeight: '1.4' }}>
                      {receipt.customer_address || receipt.address || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>โทรศัพท์</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#0f172a' }}>
                      {receipt.customer_phone || receipt.phone || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Box: Document Details */}
            <div style={{
              flex: 1,
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '10px 14px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                รายละเอียดเอกสาร
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '105px', padding: '4px 0', color: '#64748b' }}>Receipt No.</td>
                    <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: '700' }}>
                      {receipt.receipt_no || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>วันที่รับชำระ</td>
                    <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: '500' }}>
                      {formatThaiDate(receipt.payment_date || receipt.receipt_date)}
                    </td>
                  </tr>
                  {receipt.invoice_no && (
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>อ้างอิงใบแจ้งหนี้</td>
                      <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: '600' }}>
                        {receipt.invoice_no}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>วิธีชำระเงิน</td>
                    <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: '500' }}>
                      {receipt.payment_method || 'โอนเงินผ่านธนาคาร (Bank Transfer)'}
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
                backgroundColor: '#166534',
                color: '#ffffff',
                textAlign: 'center',
                fontWeight: '600',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}>
                <th style={{ width: '45px', padding: '8px 6px', border: '1px solid #166534' }}>ลำดับ</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #166534' }}>รายการบริการ / รายละเอียด</th>
                <th style={{ width: '70px', padding: '8px 6px', border: '1px solid #166534' }}>จำนวน</th>
                <th style={{ width: '75px', padding: '8px 6px', border: '1px solid #166534' }}>หน่วย</th>
                <th style={{ width: '110px', padding: '8px 10px', textAlign: 'right', border: '1px solid #166534' }}>ราคา/หน่วย</th>
                <th style={{ width: '120px', padding: '8px 12px', textAlign: 'right', border: '1px solid #166534' }}>จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                    1
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'left', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      ค่าบริการขนส่งตามใบแจ้งหนี้ {receipt.invoice_no || ''}
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                    1
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                    เที่ยว
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                    {formatNumber(totalAmount)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: '#0f172a', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                    {formatNumber(totalAmount)}
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const qty = Number(it.quantity) || 1;
                  const price = Number(it.unit_price) || 0;
                  const total = Number(it.total_amount) || (qty * price);

                  return (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f0fdf4' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'left', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>
                          {it.description || 'ค่าบริการขนส่ง'}
                        </div>
                        {it.item_date && (
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            วันที่: {formatThaiDate(it.item_date)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                        {qty}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                        {it.unit || 'คันรถ'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#334155', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
                        {formatNumber(price)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', color: '#0f172a', border: '1px solid #bbf7d0', verticalAlign: 'top' }}>
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
            backgroundColor: '#166534',
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

          {/* Payment & Bank Details Callout */}
          <div style={{
            backgroundColor: '#f0fdf4',
            borderLeft: '4px solid #166534',
            borderTop: '1px solid #bbf7d0',
            borderRight: '1px solid #bbf7d0',
            borderBottom: '1px solid #bbf7d0',
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
              <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                ข้อมูลการรับชำระเงิน (PAYMENT DETAILS)
              </div>
              <div style={{ lineHeight: '1.4' }}>
                วิธีชำระ: <strong>{receipt.payment_method || 'โอนเงิน (Bank Transfer)'}</strong>
                {receipt.account_no && (
                  <>
                    {' · '}ธนาคาร: <strong>{receipt.bank_name || 'ธนาคารกสิกรไทย'}</strong>
                    {receipt.bank_branch && ` (สาขา ${receipt.bank_branch})`}
                    {' · '}เลขที่บัญชี: <strong style={{ color: '#166534' }}>{receipt.account_no}</strong>
                  </>
                )}
              </div>
              {amountPaid !== totalAmount && (
                <div style={{ lineHeight: '1.4', marginTop: '2px', color: '#166534', fontWeight: '600' }}>
                  ยอดเงินที่รับชำระจริง: {formatNumber(amountPaid)} บาท
                </div>
              )}
            </div>
            {receipt.remark && (
              <div style={{ maxWidth: '320px', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>หมายเหตุ: </span>
                {receipt.remark}
              </div>
            )}
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', gap: '60px', fontSize: '12px' }}>
            {/* Customer Side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#0f172a', fontWeight: '600', marginBottom: '32px', textAlign: 'center' }}>
                {displayInNameOf}
              </div>
              <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #86efac', width: '100%', height: '20px' }} />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>ผู้จ่ายเงิน / ผู้รับมอบฉันทะ</div>
                </div>
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #86efac', width: '100%', height: '20px' }} />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>วันที่</div>
                </div>
              </div>
            </div>

            {/* Company Side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#0f172a', fontWeight: '600', marginBottom: '32px' }}>
                ในนามบริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด
              </div>
              <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #86efac', width: '100%', height: '20px' }} />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>ผู้รับเงิน / เจ้าหน้าที่การเงิน</div>
                </div>
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #86efac', width: '100%', height: '20px' }} />
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
            {receipt.receipt_no || '-'} - หน้า 1/1
          </div>
        </div>
      </div>
    </div>
  );
}
