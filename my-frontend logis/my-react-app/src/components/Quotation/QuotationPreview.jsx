import { X, Printer } from 'lucide-react';
import logoImg from '../../assets/LOGO.svg';

const formatTHB = (num) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(Number(num) || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function QuotationPreview({ doc, items = [], customerList = [], onClose }) {
  const customer = Array.isArray(customerList)
    ? customerList.find(c => String(c.customer_id) === String(doc.customer_id))
    : null;

  const subtotal = items.reduce((sum, it) => sum + ((Number(it.item_quantity) || 1) * (Number(it.unit_price) || 0)), 0);
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
          padding: '48px 56px',
          color: '#0f172a',
          fontFamily: "'Segoe UI', Tahoma, sans-serif"
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '3px solid #0284c7', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src={logoImg} alt="Logo" style={{ height: '58px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>ST TRAN EXPRESS</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Logistics &amp; Transportation Co., Ltd.</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#0284c7', letterSpacing: '1px' }}>QUOTATION</div>
              <div style={{ fontSize: '13px', color: '#334155', marginTop: '6px' }}>
                No. <strong>{doc.document_no || '-'}</strong>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '28px' }}>
            {/* Customer */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>BILL TO</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                {customer?.customer_name || doc.customer_id || '-'}
              </div>
              {customer?.address && <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{customer.address}</div>}
              {customer?.tax_id && <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>Tax ID: {customer.tax_id}</div>}
              {(customer?.contact_person || customer?.phone) && (
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                  {[customer?.contact_person, customer?.phone].filter(Boolean).join(' | ')}
                </div>
              )}
            </div>

            {/* Meta */}
            <div style={{ width: '230px', textAlign: 'left', fontSize: '13px', color: '#334155' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '3px 0', color: '#64748b' }}>Issue Date</td>
                    <td style={{ padding: '3px 0', fontWeight: '600', textAlign: 'right' }}>{formatDate(doc.document_date)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', color: '#64748b' }}>Valid Until</td>
                    <td style={{ padding: '3px 0', fontWeight: '600', textAlign: 'right' }}>{formatDate(doc.valid_until)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', color: '#64748b' }}>Salesperson</td>
                    <td style={{ padding: '3px 0', fontWeight: '600', textAlign: 'right' }}>{doc.sale_name || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', color: '#64748b' }}>Status</td>
                    <td style={{ padding: '3px 0', fontWeight: '600', textAlign: 'right' }}>{doc.status || 'Draft'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Route */}
          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>ORIGIN</div>
              <div style={{ fontWeight: '600', color: '#0f172a' }}>{doc.consigner_address || '-'}</div>
            </div>
            <div style={{ fontSize: '22px', color: '#0284c7', fontWeight: '700' }}>→</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>DESTINATION</div>
              <div style={{ fontWeight: '600', color: '#0f172a' }}>{doc.consignee_address || '-'}</div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0284c7', color: '#ffffff' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>Service Type</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Unit</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 6px 0 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                    No service items
                  </td>
                </tr>
              )}
              {items.map((it, idx) => {
                const qty = Number(it.item_quantity) || 1;
                const price = Number(it.unit_price) || 0;
                const total = qty * price;
                return (
                  <tr key={it.document_items_id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{it.service_typename || '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{it.description || '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155' }}>{qty}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#334155' }}>{it.unit || '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#334155' }}>{formatTHB(price)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>{formatTHB(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Subtotal</span>
                <span>{formatTHB(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '17px', color: '#0284c7', borderTop: '2px solid #0284c7', paddingTop: '8px', marginTop: '4px' }}>
                <span>Grand Total</span>
                <span>{formatTHB(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {doc.remark && (
            <div style={{ textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>NOTES</div>
              <div style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-wrap' }}>{doc.remark}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '36px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Thank you for your business</span>
            <span>ST TRAN EXPRESS — Logistics &amp; Transportation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
