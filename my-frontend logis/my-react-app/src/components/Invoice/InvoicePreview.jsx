import React from 'react';
import { X, Printer } from 'lucide-react';
import logoImg from '../../assets/LOGO.svg';

const formatNumber = (num) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(num) || 0);
};

const formatThaiDate = (dateStr) => {
  if (!dateStr) return '-';
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
};

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

  for (let i = 0; i < bahtLen; i++) {
    const digit = Number(bahtStr[i]);
    const pos = bahtLen - 1 - i;

    if (digit !== 0) {
      let currentDigitText = thaiNums[digit];
      let currentPosText = thaiPositions[pos % 6];

      if (pos % 6 === 0 && pos > 0) currentPosText = 'ล้าน';
      if (pos % 6 === 1 && digit === 1) currentDigitText = '';
      else if (pos % 6 === 1 && digit === 2) currentDigitText = 'ยี่';
      else if (pos % 6 === 0 && digit === 1 && i > 0) currentDigitText = 'เอ็ด';

      result += currentDigitText + currentPosText;
    } else {
      if (pos % 6 === 0 && pos > 0 && bahtStr.substring(Math.max(0, i - 5), i + 1) !== '000000') {
        result += 'ล้าน';
      }
    }
  }
  result += 'บาท';

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
  const totalAmount = invoice.total_amount || items.reduce((acc, it) => acc + (Number(it.total_amount) || (Number(it.quantity) * Number(it.unit_price)) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="preview-modal-overlay">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm;
          }
          body * {
            visibility: hidden !important;
          }
          .preview-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            padding: 0 !important;
            visibility: visible !important;
            display: block !important;
          }
          .preview-paper {
            visibility: visible !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .preview-paper * {
            visibility: visible !important;
          }
          .preview-toolbar {
            display: none !important;
          }
        }
        .preview-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
          padding: 24px 16px;
        }
        .preview-toolbar {
          width: 210mm;
          max-width: 100%;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-bottom: 12px;
        }
        .preview-paper {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          padding: 40px 48px;
          color: #0f172a;
          font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
      `}</style>

      {/* Toolbar */}
      <div className="preview-toolbar">
        <button
          onClick={handlePrint}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <Printer size={16} />
          <span>พิมพ์เอกสาร (Print)</span>
        </button>
        <button
          onClick={onClose}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fff',
            color: '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px'
          }}
        >
          <X size={16} />
          <span>ปิด</span>
        </button>
      </div>

      {/* Paper Content */}
      <div className="preview-paper">
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0284c7', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={logoImg} alt="Logo" style={{ height: '56px', width: 'auto' }} />
              <div>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                  บริษัท เอสที แทรนสปอร์ต แอนด์ โลจิสติกส์ จำกัด
                </h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                  ST TRANSPORT & LOGISTICS CO., LTD.<br />
                  บริการขนส่งสินค้าและโลจิสติกส์ทั่วประเทศ
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold', color: '#0284c7', letterSpacing: '0.5px' }}>
                ใบแจ้งหนี้
              </h2>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                INVOICE
              </span>
            </div>
          </div>

          {/* Doc Meta & References Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '20px', fontSize: '13px' }}>
            {/* Customer Box */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 'bold', color: '#0284c7', marginBottom: '8px', fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                ข้อมูลลูกค้า (CUSTOMER DETAILS)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', lineHeight: 1.6 }}>
                <tbody>
                  <tr>
                    <td style={{ width: '90px', color: '#64748b', verticalAlign: 'top' }}>รหัสลูกค้า:</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{invoice.customer_id || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b', verticalAlign: 'top' }}>ชื่อลูกค้า:</td>
                    <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{invoice.customer_name || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b', verticalAlign: 'top' }}>ที่อยู่:</td>
                    <td style={{ color: '#334155' }}>{invoice.customer_address || '-'}</td>
                  </tr>
                  {invoice.customer_phone && (
                    <tr>
                      <td style={{ color: '#64748b' }}>โทรศัพท์:</td>
                      <td style={{ color: '#334155' }}>{invoice.customer_phone}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Invoice Meta & References Box */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 'bold', color: '#0284c7', marginBottom: '8px', fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                รายละเอียดเอกสาร & เอกสารอ้างอิง
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', lineHeight: 1.6 }}>
                <tbody>
                  <tr>
                    <td style={{ width: '130px', color: '#64748b' }}>เลขที่ใบแจ้งหนี้:</td>
                    <td style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '14px' }}>{invoice.invoice_no}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>วันที่ออกเอกสาร:</td>
                    <td style={{ color: '#0f172a' }}>{formatThaiDate(invoice.invoice_date)}</td>
                  </tr>
                  {invoice.due_date && (
                    <tr>
                      <td style={{ color: '#64748b' }}>วันครบกำหนด:</td>
                      <td style={{ color: '#b91c1c', fontWeight: '600' }}>{formatThaiDate(invoice.due_date)}</td>
                    </tr>
                  )}
                  {invoice.credit_term && (
                    <tr>
                      <td style={{ color: '#64748b' }}>เครดิตเทอม:</td>
                      <td style={{ color: '#0f172a' }}>{invoice.credit_term} วัน</td>
                    </tr>
                  )}
                  {/* Tracing references */}
                  <tr style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                    <td style={{ color: '#64748b' }}>อ้างอิงใบเสนอราคา:</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{invoice.quotation_no || invoice.quotation_id || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>อ้างอิงใบจองงาน:</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{invoice.booking_no || invoice.booking_id || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>อ้างอิงใบส่งสินค้า (DO):</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{invoice.do_no || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ marginTop: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0284c7', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', width: '8%', textAlign: 'center', borderRadius: '4px 0 0 0' }}>ลำดับ</th>
                  <th style={{ padding: '10px 12px', width: '52%' }}>รายการค่าบริการ / Description</th>
                  <th style={{ padding: '10px 12px', width: '12%', textAlign: 'center' }}>จำนวน</th>
                  <th style={{ padding: '10px 12px', width: '10%', textAlign: 'center' }}>หน่วย</th>
                  <th style={{ padding: '10px 12px', width: '18%', textAlign: 'right' }}>ราคา/หน่วย (บาท)</th>
                  <th style={{ padding: '10px 12px', width: '18%', textAlign: 'right', borderRadius: '0 4px 0 0' }}>จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                      ไม่มีรายการค่าบริการ
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.unit_price) || 0;
                    const lineTotal = item.total_amount !== undefined ? Number(item.total_amount) : (qty * price);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>
                          {item.description || 'ค่าบริการขนส่ง'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#0f172a' }}>{qty}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                            {item.unit || 'คันรถ'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#0f172a' }}>{formatNumber(price)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                          {formatNumber(lineTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Total & Baht Text Summary (Strictly Clean, NO Tax/VAT/WHT) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '16px', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: '#f1f5f9', padding: '14px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>จำนวนเงินตัวอักษร (TOTAL IN WORDS):</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0284c7' }}>
                ({bahtText(totalAmount)})
              </div>
              {invoice.remark && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '12px', color: '#475569' }}>
                  <strong>หมายเหตุ:</strong> {invoice.remark}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>ยอดรวมทั้งสิ้น (TOTAL):</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0284c7' }}>
                  {formatNumber(totalAmount)} <span style={{ fontSize: '13px', color: '#64748b' }}>บาท</span>
                </span>
              </div>
            </div>
          </div>

          {/* Payment Account Information */}
          {(invoice.account_no || invoice.bank_name) && (
            <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#0284c7', marginBottom: '6px', fontSize: '13px' }}>
                ช่องทางการชำระเงิน (PAYMENT INFORMATION)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', lineHeight: 1.6 }}>
                <div>
                  <span style={{ color: '#64748b' }}>ชื่อบัญชี: </span>
                  <strong style={{ color: '#0f172a' }}>{invoice.account_name || 'บริษัท เอสที แทรนสปอร์ต แอนด์ โลจิสติกส์ จำกัด'}</strong><br />
                  <span style={{ color: '#64748b' }}>ธนาคาร: </span>
                  <strong style={{ color: '#0f172a' }}>{invoice.bank_name || '-'}</strong> {invoice.bank_branch ? `(${invoice.bank_branch})` : ''}
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>เลขที่บัญชี: </span>
                  <strong style={{ fontSize: '14px', color: '#0284c7', letterSpacing: '0.5px' }}>{invoice.account_no}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Signatures */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', textAlign: 'center', fontSize: '13px' }}>
            <div>
              <p style={{ margin: '0 0 50px 0', color: '#475569' }}>ผู้รับใบแจ้งหนี้ / Customer Signature</p>
              <div style={{ width: '180px', margin: '0 auto', borderBottom: '1px solid #94a3b8' }}></div>
              <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '12px' }}>วันที่: ....../....../......</p>
            </div>
            <div>
              <p style={{ margin: '0 0 50px 0', color: '#475569' }}>ผู้มีอำนาจลงนาม / Authorized Signature</p>
              <div style={{ width: '180px', margin: '0 auto', borderBottom: '1px solid #94a3b8' }}></div>
              <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '12px' }}>วันที่: ....../....../......</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
