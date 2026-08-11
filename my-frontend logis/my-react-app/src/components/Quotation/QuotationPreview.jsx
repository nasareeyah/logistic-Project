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
};

// Thai Baht Text helper: (เจ็ดหมื่นสามพันสามร้อยบาทถ้วน)
const bahtText = (num) => {
  if (num === null || num === undefined) return '';
  const number = Number(num);
  if (isNaN(number)) return '';
  
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
  const customer = Array.isArray(customerList)
    ? customerList.find(c => String(c.customer_id) === String(doc.customer_id) || String(c.id) === String(doc.customer_id))
    : null;

  const customerName = customer?.customer_name || doc.customer_name || doc.customer_id;
  const displayInNameOf = customerName ? `ในนาม ${customerName}` : 'ในนามบริษัท (ลูกค้า)';

  const subtotal = items.reduce((sum, it) => {
    const qty = Number(it.item_quantity) || Number(it.quantity) || 1;
    const price = Number(it.unit_price) || Number(it.pricePerUnit) || 0;
    return sum + (qty * price);
  }, 0);
  
  const grandTotal = doc.grand_total != null ? Number(doc.grand_total) : subtotal;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '30px', overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '820px', width: '100%' }}>
        {/* Toolbar (no-print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '12px' }}>
          <button
            className="btn-primary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            <span>Print / Export PDF</span>
          </button>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>

        {/* A4 Document */}
        <div className="quotation-preview-print" style={{
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
            {/* Left: Company details stacked vertically */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px', color: '#1e293b' }}>
              <img src={logoImg} alt="Logo" style={{ height: '48px', alignSelf: 'flex-start', marginBottom: '8px', objectFit: 'contain' }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1b365d' }}>บริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>123/4 หมู่ที่ 2 ต.สำนักขาม อ.สะเดา จ.สงขลา 90320</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>เลขประจำตัวผู้เสียภาษี: 0905566002392</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>โทร. 098-2591455 / 098-0150083</div>
            </div>

            {/* Right: Quotation Title and Rounded Box */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1b365d', letterSpacing: '0.5px', lineHeight: '1.2' }}>ใบเสนอราคา</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px', marginTop: '2px' }}>QUOTATION</div>
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
                {doc.document_no || doc.document_id || '-'}
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div style={{ height: '1px', backgroundColor: '#cbd5e1', marginBottom: '12px' }}></div>

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
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>เสนอราคาถึง (BILL TO)</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1b365d', marginBottom: '8px' }}>
                {customer?.customer_name || doc.customer_name || doc.customer_id || '-'}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#475569' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '65px', padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>เลขภาษี</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#0f172a', fontWeight: '500' }}>
                      {customer?.tax_id || doc.tax_id || doc.taxId || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>ที่อยู่</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#334155', lineHeight: '1.4' }}>
                      {customer?.address || doc.address || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>ผู้ติดต่อ</td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#334155' }}>
                      {[customer?.contact_person || doc.contact_person || doc.contactPerson, customer?.phone || doc.phone].filter(Boolean).join(' · ') || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#64748b' }}>อีเมล</td>
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
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>รายละเอียดเอกสาร</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '85px', padding: '5px 0', color: '#64748b' }}>Quotation No.</td>
                    <td style={{ padding: '5px 0', color: '#0f172a', fontWeight: '700' }}>
                      {doc.document_no || doc.document_id || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', color: '#64748b' }}>วันที่ออก</td>
                    <td style={{ padding: '5px 0', color: '#0f172a', fontWeight: '500' }}>
                      {formatThaiDate(doc.document_date || doc.issueDate)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', color: '#64748b' }}>ผู้เสนอ</td>
                    <td style={{ padding: '5px 0', color: '#0f172a', fontWeight: '500' }}>
                      {doc.sale_name || doc.salesperson || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 0', color: '#64748b', verticalAlign: 'top' }}>ชื่องาน</td>
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
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', border: '1px solid #cbd5e1' }}>
                    ไม่มีรายการบริการ
                  </td>
                </tr>
              )}
              {items.map((it, idx) => {
                const qty = Number(it.item_quantity) || Number(it.quantity) || 1;
                const price = Number(it.unit_price) || Number(it.pricePerUnit) || 0;
                const total = qty * price;
                
                let mainService = it.service_typename || it.serviceType;
                let mainName = '';
                let subName = '';
                const routeText = [doc.consigner_address, doc.consignee_address].filter(Boolean).join(' → ');

                if (mainService) {
                  mainName = it.description ? `${mainService} - ${it.description}` : mainService;
                  subName = routeText;
                } else {
                  mainName = it.description || '-';
                  subName = routeText;
                }

                return (
                  <tr key={it.document_items_id || idx} style={{ backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'left', color: '#334155', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{mainName}</div>
                      {subName && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{subName}</div>}
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
              })}
            </tbody>
          </table>

          {/* Subtotal row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 0 6px 0', fontSize: '12px' }}>
            <div style={{ display: 'flex', width: '280px', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#475569', fontWeight: '500' }}>รวมเป็นเงิน</span>
              <span style={{ fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'right', marginRight: '8px' }}>
                {formatNumber(subtotal)}
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
            marginBottom: '12px'
          }}>
            <div style={{ textAlign: 'left', fontWeight: '600' }}>
              ({bahtText(grandTotal)})
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span>จำนวนเงินรวมทั้งสิ้น</span>
              <span style={{ fontSize: '16px', fontWeight: '800' }}>
                {formatNumber(grandTotal)}
              </span>
              <span>บาท</span>
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
              <span style={{ fontWeight: '700', color: '#1b365d' }}>หมายเหตุ: </span>
              <span style={{ whiteSpace: 'pre-wrap' }}>
                {doc.remark.startsWith('หมายเหตุ:') ? doc.remark.replace(/^หมายเหตุ:\s*/, '') : doc.remark}
              </span>
            </div>
          )}

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', gap: '60px', fontSize: '12px' }}>
            {/* Customer Side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#475569', fontWeight: '600', marginBottom: '32px', textAlign: 'center' }}>{displayInNameOf}</div>
              <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }}></div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>ผู้สั่งซื้อสินค้า</div>
                </div>
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }}></div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>วันที่</div>
                </div>
              </div>
            </div>

            {/* Company Side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#475569', fontWeight: '600', marginBottom: '32px' }}>ในนามบริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด</div>
              <div style={{ display: 'flex', width: '100%', gap: '15px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }}></div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>ผู้อนุมัติ</div>
                </div>
                <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ borderBottom: '1px dotted #64748b', width: '100%', height: '20px' }}></div>
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
            {doc.document_no || doc.document_id || '-'} - หน้า 1/1
          </div>
        </div>
      </div>
    </div>
  );
}
