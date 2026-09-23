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

export default function ReceiptPreview({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.total_amount) || 0), 0) || parseFloat(receipt.total_amount) || 0;
  const grandTotal = subtotal;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '92vh',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print" style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>
              พิมพ์ / ดูตัวอย่างใบเสร็จรับเงิน (Receipt Preview)
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {receipt.receipt_no}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Printer size={16} />
              <span>พิมพ์ใบเสร็จ (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          fontSize: '13.5px',
          lineHeight: '1.5'
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={logoImg} alt="Logo" style={{ height: '48px', objectFit: 'contain' }} />
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  บริษัท โลจิสติกส์ พาร์ทเนอร์ จำกัด (สำนักงานใหญ่)
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110
                  <br />
                  เลขประจำตัวผู้เสียภาษี: 0105559012345 · โทร: 02-123-4567
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0284c7',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                ใบเสร็จรับเงิน
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', letterSpacing: '1px' }}>
                RECEIPT
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid #0284c7', margin: '0 0 24px 0' }} />

          {/* Info Columns: Customer & Receipt Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                ได้รับเงินจาก (RECEIVED FROM):
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                {receipt.customer_name || 'ลูกค้าทั่วไป'}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                {receipt.customer_address || '-'}
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                เลขประจำตัวผู้เสียภาษี: <strong>{receipt.customer_tax_id || '-'}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>เลขที่ใบเสร็จ:</span>
                <strong style={{ color: '#0284c7' }}>{receipt.receipt_no}</strong>

                <span style={{ color: '#64748b' }}>วันที่ชำระ:</span>
                <span>{formatThaiDate(receipt.payment_date)}</span>

                <span style={{ color: '#64748b' }}>อ้างอิงใบแจ้งหนี้:</span>
                <span>{receipt.invoice_no || '-'}</span>

                <span style={{ color: '#64748b' }}>วิธีชำระเงิน:</span>
                <span>{receipt.payment_method || 'โอนเงิน (Transfer)'}</span>

                {receipt.account_no && (
                  <>
                    <span style={{ color: '#64748b' }}>บัญชีรับเงิน:</span>
                    <span>{receipt.bank_name || 'ธนาคาร'} {receipt.account_no}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', width: '8%', fontSize: '12px', fontWeight: 700, color: '#334155' }}>ลำดับ</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', width: '52%', fontSize: '12px', fontWeight: 700, color: '#334155' }}>รายการ (Description)</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', width: '12%', fontSize: '12px', fontWeight: 700, color: '#334155' }}>จำนวน</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', width: '14%', fontSize: '12px', fontWeight: 700, color: '#334155' }}>ราคา/หน่วย</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', width: '14%', fontSize: '12px', fontWeight: 700, color: '#334155' }}>จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td style={{ padding: '12px 14px' }}>1</td>
                  <td style={{ padding: '12px 14px' }}>ค่าบริการขนส่งตามใบแจ้งหนี้ {receipt.invoice_no || ''}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>1 เที่ยว</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>{formatNumber(receipt.total_amount)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>{formatNumber(receipt.total_amount)}</td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 500 }}>{it.description}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#475569' }}>
                      {it.quantity} {it.unit}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>{formatNumber(it.unit_price)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>{formatNumber(it.total_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
            <div style={{ width: '320px', borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>รวมเป็นเงิน (Subtotal):</span>
                <span>{formatNumber(subtotal)} บาท</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '16px', fontWeight: 800, color: '#0284c7', borderTop: '1px solid #e2e8f0' }}>
                <span>จำนวนรวมทั้งสิ้น (Grand Total):</span>
                <span>{formatNumber(grandTotal)} บาท</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>
                <span>ยอดที่ชำระแล้ว (Amount Paid):</span>
                <span>{formatNumber(receipt.amount_paid || grandTotal)} บาท</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', marginTop: '40px', paddingTop: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px dashed #94a3b8', height: '60px', marginBottom: '8px' }}></div>
              <div style={{ fontWeight: 600 }}>ผู้จ่ายเงิน / ผู้รับมอบฉันทะ</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>วันที่: ____/____/________</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px dashed #94a3b8', height: '60px', marginBottom: '8px' }}></div>
              <div style={{ fontWeight: 600 }}>ผู้รับเงิน / เจ้าหน้าที่การเงิน</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>วันที่: {formatThaiDate(receipt.payment_date)}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
