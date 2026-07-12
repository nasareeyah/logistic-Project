import { useState, useEffect } from 'react';

function GenericTable({ tableName, title, hiddenFields = [], labels = {} }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newRow, setNewRow] = useState({});

  const fields = data.length > 0 ? Object.keys(data[0]) : [];
  const visibleFields = fields.filter(f => !hiddenFields.includes(f));

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/${tableName}`)
      .then(r => r.json())
      .then(arr => { setData(arr); setLoading(false); })
      .catch(err => { setError('โหลดข้อมูลไม่สำเร็จ: ' + err.message); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, [tableName]);

  const handleAdd = () => {
    const empty = visibleFields.some(f => {
      const val = newRow[f];
      return val === undefined || val === '';
    });
    if (empty) { alert('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return; }
    fetch(`/api/${tableName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRow)
    })
      .then(r => r.json())
      .then(d => { alert(d.message); setNewRow({}); fetchData(); });
  };

  const handleSave = (id) => {
    fetch(`/api/${tableName}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    })
      .then(r => r.json())
      .then(d => { setEditingId(null); fetchData(); });
  };

  const handleDelete = (id) => {
    if (!confirm('ยืนยันการลบ?')) return;
    fetch(`/api/${tableName}/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(d => { alert(d.message); fetchData(); });
  };

  const renderCell = (val) => {
    if (val === null || val === undefined) return '—';
    return String(val);
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>⏳ กำลังโหลด...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b' }}>{title}</h2>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#f0f0f0', textAlign: 'center', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', color: '#555' }}>
            {visibleFields.map(f => (
              <th key={f}>{labels[f] || f}</th>
            ))}
            <th style={{ width: '100px' }}>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={visibleFields.length + 1} style={{ padding: '20px', color: '#ccc' }}>— ไม่มีข้อมูล —</td></tr>
          ) : (
            data.map(row => {
              const pkVal = row[fields[0]];
              return (
                <tr key={pkVal}>
                  {visibleFields.map(f => (
                    <td key={f}>
                      {editingId === pkVal ? (
                        <input
                          type="text"
                          value={editData[f] ?? ''}
                          onChange={e => setEditData({ ...editData, [f]: e.target.value })}
                          style={{ width: '90%' }}
                        />
                      ) : (
                        renderCell(row[f])
                      )}
                    </td>
                  ))}
                  <td>
                    {editingId === pkVal ? (
                      <>
                        <button onClick={() => handleSave(pkVal)}>💾</button>
                        <button onClick={() => setEditingId(null)} style={{ marginLeft: '4px' }}>❌</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(pkVal); setEditData({ ...row }); }}>✏️</button>
                        <button onClick={() => handleDelete(pkVal)} style={{ marginLeft: '4px', color: 'red' }}>🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })
          )}
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {visibleFields.map(f => (
              <td key={f}>
                <input
                  type="text"
                  placeholder={labels[f] || f}
                  value={newRow[f] ?? ''}
                  onChange={e => setNewRow({ ...newRow, [f]: e.target.value })}
                  style={{ width: '90%' }}
                />
              </td>
            ))}
            <td>
              <button onClick={handleAdd} style={{ backgroundColor: '#1890ff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>➕ เพิ่ม</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default GenericTable;
