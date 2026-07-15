import { useState } from 'react';

function CustomerTable({ customers, onAdd, onUpdate, onDelete }) {
  const [newCustomer, setNewCustomer] = useState({ customer_name: '', tax_id: '', address: '', phone: '', email: '', contact_person: '' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const handleAddSubmit = () => {
    if (!newCustomer.customer_name) {
      alert('กรุณากรอกชื่อลูกค้า');
      return;
    }
    onAdd(newCustomer, () => setNewCustomer({ customer_name: '', tax_id: '', address: '', phone: '', email: '', contact_person: '' }));
  };

  const handleSaveClick = (id) => {
    onUpdate(id, editData, () => setEditingId(null));
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b' }}>ตารางข้อมูลลูกค้า (Customers)</h2>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#f0f0f0', textAlign: 'center' }}>
        <thead>
          <tr style={{ backgroundColor: '#fafafa', color: '#555' }}>
            <th>ชื่อลูกค้า</th><th>เลขผู้เสียภาษี</th><th>ที่อยู่</th><th>เบอร์โทร</th><th>อีเมล</th><th>ชื่อผู้ติดต่อ</th><th>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(customers) && customers.map(c => (
            <tr key={c.customer_id}>
              <td>{editingId === c.customer_id ? <input type="text" value={editData.customer_name} onChange={e => setEditData({ ...editData, customer_name: e.target.value })} /> : c.customer_name}</td>
              <td>{editingId === c.customer_id ? <input type="text" value={editData.tax_id || ''} onChange={e => setEditData({ ...editData, tax_id: e.target.value })} /> : (c.tax_id || '-')}</td>
              <td>{editingId === c.customer_id ? <input type="text" value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} /> : (c.address || '-')}</td>
              <td>{editingId === c.customer_id ? <input type="text" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} /> : c.phone}</td>
              <td>{editingId === c.customer_id ? <input type="text" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} /> : c.email}</td>
              <td>{editingId === c.customer_id ? <input type="text" value={editData.contact_person || ''} onChange={e => setEditData({ ...editData, contact_person: e.target.value })} /> : (c.contact_person || '-')}</td>
              <td>
                {editingId === c.customer_id ? (
                  <>
                    <button onClick={() => handleSaveClick(c.customer_id)}>💾</button>
                    <button onClick={() => setEditingId(null)}>❌</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(c.customer_id); setEditData({ ...c }); }} style={{ marginRight: '5px', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => onDelete(c.customer_id)} style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: '#fffbe6' }}>
            <td><input type="text" placeholder="ชื่อลูกค้า" value={newCustomer.customer_name} onChange={e => setNewCustomer({ ...newCustomer, customer_name: e.target.value })} style={{ width: '90%' }} /></td>
            <td><input type="text" placeholder="เลขผู้เสียภาษี" value={newCustomer.tax_id} onChange={e => setNewCustomer({ ...newCustomer, tax_id: e.target.value })} style={{ width: '90%' }} /></td>
            <td><input type="text" placeholder="ที่อยู่" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} style={{ width: '90%' }} /></td>
            <td><input type="text" placeholder="เบอร์โทร" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={{ width: '90%' }} /></td>
            <td><input type="text" placeholder="อีเมล" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} style={{ width: '90%' }} /></td>
            <td><input type="text" placeholder="ชื่อผู้ติดต่อ" value={newCustomer.contact_person} onChange={e => setNewCustomer({ ...newCustomer, contact_person: e.target.value })} style={{ width: '90%' }} /></td>
            <td><button onClick={handleAddSubmit} style={{ backgroundColor: '#1890ff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>➕ บันทึก</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CustomerTable;