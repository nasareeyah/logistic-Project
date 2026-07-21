import { useState } from 'react';

function DocumentTable({
    title,
    documents = [],
    customers = [],
    services = [],
    serviceTypes = [],
    onAddDocument,
    onUpdateDocument,
    onDeleteDocument
}) {
    const [newDoc, setNewDoc] = useState({
        document_no: '',
        document_date: '',
        grand_total: '',
        status: 'รอดำเนินการ',
        customer_id: '',
        service_name: ''
    });

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const handleAddSubmit = () => {
        if (!newDoc.document_no || !newDoc.document_date || !newDoc.grand_total || !newDoc.customer_id) {
            alert('กรุณากรอกข้อมูลและเลือกลูกค้าให้ครบถ้วน');
            return;
        }

        onAddDocument(newDoc, () => setNewDoc({
            document_no: '',
            document_date: '',
            grand_total: '',
            status: 'รอดำเนินการ',
            customer_id: '',
            service_name: ''
        }));
    };

    const handleSaveClick = (id) => {
        if (!editData.customer_id) {
            alert('กรุณาเลือกลูกค้า');
            return;
        }
        onUpdateDocument(id, editData, () => setEditingId(null));
    };

    return (
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '15px' }}>{title}</h2>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#f0f0f0', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th>เลขที่เอกสาร</th>
                        <th>ลูกค้า</th>
                        <th>ข้อมูลบริการ</th>
                        <th>วันที่</th>
                        <th>ยอดรวมทั้งสิ้น</th>
                        <th>สถานะ</th>
                        <th>การจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map(doc => {
                        const isEditing = editingId === doc.document_id;
                        const currentCustomer = customers.find(c => c.customer_id === doc.customer_id);

                        return (
                            <tr key={doc.document_id}>
                                <td>
                                    {isEditing ? (
                                        <input type="text" value={editData.document_no || ''} onChange={e => setEditData({ ...editData, document_no: e.target.value })} style={{ width: '90%' }} />
                                    ) : (
                                        doc.document_no
                                    )}
                                </td>

                                <td>
                                    {isEditing ? (
                                        <select value={editData.customer_id || ''} onChange={e => setEditData({ ...editData, customer_id: e.target.value })} style={{ width: '95%' }}>
                                            <option value="">-- เลือกลูกค้า --</option>
                                            {customers.map(c => (
                                                <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        currentCustomer ? currentCustomer.customer_name : doc.customer_id
                                    )}
                                </td>

                                {/* ข้อมูลบริการ (โหมดแก้ไข / โหมดแสดงผล) */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            placeholder="กรอกข้อมูลบริการ"
                                            value={editData.service_typename || ''}
                                            onChange={e => setEditData({ ...editData, service_typename: e.target.value })}
                                            style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                                        />
                                    ) : (
                                        /* ถ้าไม่มี doc.service_name ให้ค้นหาจาก services array ตาม id */
                                        doc.service_name || 
                                        services.find(s => s.service_id === doc.service_id)?.description || 
                                        '-'
                                    )}
                                </td>

                                <td>
                                    {isEditing ? (
                                        <input type="date" value={editData.document_date || ''} onChange={e => setEditData({ ...editData, document_date: e.target.value })} style={{ width: '90%' }} />
                                    ) : (
                                        doc.document_date
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <input type="number" value={editData.grand_total || ''} onChange={e => setEditData({ ...editData, grand_total: e.target.value })} style={{ width: '90%' }} />
                                    ) : (
                                        doc.grand_total
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <select value={editData.status || ''} onChange={e => setEditData({ ...editData, status: e.target.value })} style={{ width: '95%' }}>
                                            <option value="รอดำเนินการ">รอดำเนินการ</option>
                                            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                                            <option value="ยกเลิก">ยกเลิก</option>
                                        </select>
                                    ) : (
                                        doc.status
                                    )}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <>
                                            <button onClick={() => handleSaveClick(doc.document_id)}>💾</button>
                                            <button onClick={() => setEditingId(null)} style={{ marginLeft: '4px' }}>❌</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => { setEditingId(doc.document_id); setEditData({ ...doc }); }}>✏️</button>
                                            <button onClick={() => onDeleteDocument(doc.document_id)} style={{ marginLeft: '4px', color: 'red' }}>🗑️</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}

                    {/* แถวเพิ่มข้อมูลใหม่ (กรอกข้อความเพียวๆ ไม่มี dropdown/datalist) */}
                    <tr style={{ backgroundColor: '#e6f7ff' }}>
                        <td><input type="text" placeholder="เช่น QT-2026001" value={newDoc.document_no} onChange={e => setNewDoc({ ...newDoc, document_no: e.target.value })} style={{ width: '90%' }} /></td>

                        <td>
                            <select value={newDoc.customer_id} onChange={e => setNewDoc({ ...newDoc, customer_id: e.target.value })} style={{ width: '95%', padding: '4px' }}>
                                <option value="">-- เลือกลูกค้า --</option>
                                {customers.map(c => (
                                    <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
                                ))}
                            </select>
                        </td>

                        <td>
                            <input
                                type="text"
                                placeholder="กรอกข้อมูลบริการ"
                                value={newDoc.service_typename}
                                onChange={e => setNewDoc({ ...newDoc, service_typename: e.target.value })}
                                style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                            />
                        </td>

                        <td><input type="date" value={newDoc.document_date} onChange={e => setNewDoc({ ...newDoc, document_date: e.target.value })} style={{ width: '90%' }} /></td>
                        <td><input type="number" placeholder="จำนวนเงิน" value={newDoc.grand_total} onChange={e => setNewDoc({ ...newDoc, grand_total: e.target.value })} style={{ width: '90%' }} /></td>
                        <td>
                            <select value={newDoc.status} onChange={e => setNewDoc({ ...newDoc, status: e.target.value })} style={{ width: '95%', padding: '4px' }}>
                                <option value="รอดำเนินการ">รอดำเนินการ</option>
                                <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                                <option value="ยกเลิก">ยกเลิก</option>
                            </select>
                        </td>
                        <td><button onClick={handleAddSubmit} style={{ backgroundColor: '#1890ff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>➕ บันทึก</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default DocumentTable;