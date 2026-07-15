import { useState } from 'react';

function CarTable({ cars, onAdd, onUpdate, onDelete }) {
  const [newCar, setNewCar] = useState({ car_number: '', car_type: '' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const handleAddSubmit = () => {
    onAdd(newCar, () => setNewCar({ car_number: '', car_type: '' }));
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b' }}>ตารางข้อมูลยานพาหนะ (Cars)</h2>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#f0f0f0', textAlign: 'center' }}>
        <thead>
          <tr style={{ backgroundColor: '#e6f7ff', color: '#555' }}>
            <th>ทะเบียนรถ</th><th>ประเภทรถ</th><th>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {cars.map(car => (
            <tr key={car.car_id}>
              <td>{editingId === car.car_id ? <input type="text" value={editData.car_number} onChange={e => setEditData({ ...editData, car_number: e.target.value })} /> : car.car_number}</td>
              <td>{editingId === car.car_id ? <input type="text" value={editData.car_type} onChange={e => setEditData({ ...editData, car_type: e.target.value })} /> : car.car_type}</td>
              <td>
                {editingId === car.car_id ? (
                  <><button onClick={() => onUpdate(car.car_id, editData, () => setEditingId(null))}>💾</button> <button onClick={() => setEditingId(null)}>❌</button></>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(car.car_id); setEditData({ ...car }); }}>✏️</button>
                    <button onClick={() => onDelete(car.car_id)} style={{ marginLeft: '5px', color: 'red' }}>🗑️</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: '#f0f5ff' }}>
            <td><input type="text" placeholder="ทะเบียนรถ" value={newCar.car_number} onChange={e => setNewCar({ ...newCar, car_number: e.target.value })} style={{ width: '90%' }} /></td>
            <td><input type="text" placeholder="ประเภทรถ" value={newCar.car_type} onChange={e => setNewCar({ ...newCar, car_type: e.target.value })} style={{ width: '90%' }} /></td>
            <td><button onClick={handleAddSubmit} style={{ backgroundColor: '#52c41a', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>➕ บันทึก</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CarTable;