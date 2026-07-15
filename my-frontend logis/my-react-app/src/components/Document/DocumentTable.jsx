function DocumentTable({ title, documents }) {
  return (
    <div>
      <h2 style={{ marginBottom: '15px' }}>{title}</h2>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th>เลขที่เอกสาร</th><th>วันที่</th><th>ยอดรวมทั้งสิ้น</th><th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr><td colSpan="4" align="center">ไม่มีข้อมูลเอกสาร</td></tr>
          ) : (
            documents.map(doc => (
              <tr key={doc.document_id}>
                <td>{doc.document_no}</td>
                <td>{doc.document_date ? new Date(doc.document_date).toLocaleDateString() : '-'}</td>
                <td>{Number(doc.grand_total).toLocaleString()} บาท</td>
                <td>{doc.status || 'รอดำเนินการ'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentTable;