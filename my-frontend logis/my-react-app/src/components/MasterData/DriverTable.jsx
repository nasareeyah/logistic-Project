import { useState } from 'react';

function DriverTable({ drivers, onAdd, onUpdate, onDelete }) {
  const [newDriver, setNewDriver] = useState({ full_name: '', phone: '' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const handleAddSubmit = () => {
    onAdd(newDriver, () => setNewDriver({ full_name: '', phone: '' }));
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b' }}>ตารางข้อมูลพนักงานขับรถ (Drivers)</h2>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#f0f0f0', textAlign: 'center' }}>
        <thead>
          <tr style={{ backgroundColor: '#feffe6', color: '#555' }}>
            <th>ชื่อ-นามสกุล (Full Name)</th><th>เบอร์โทรศัพท์ (Phone)</th><th>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(drivers) && drivers.map(d => (
            <tr key={d.driver_id}>
              <td>{editingId === d.driver_id ? <input type="text" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} /> : d.full_name}</td>
              <td>{editingId === d.driver_id ? <input type="text" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} /> : d.phone}</td>
              <td>
                {editingId === d.driver_id ? (
                  <><button onClick={() => onUpdate(d.driver_id, editData, () => setEditingId(null))}>💾</button> <button onClick={() => setEditingId(null)}>❌</button></>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(d.driver_id); setEditData({ ...d }); }}>✏️</button>
                    <button onClick={() => onDelete(d.driver_id)} style={{ marginLeft: '5px', color: 'red' }}>🗑️</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: '#fff7e6' }}>
            <td><input type="text" placeholder="ชื่อคนขับ" value={newDriver.full_name} onChange={e => setNewDriver({ ...newDriver, full_name: e.target.value })} style={{ width: '90%' }} /></td>
            <td><input type="text" placeholder="เบอร์โทร" value={newDriver.phone} onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })} style={{ width: '90%' }} /></td>
            <td><button onClick={handleAddSubmit} style={{ backgroundColor: '#faad14', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>➕ บันทึก</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default DriverTable;