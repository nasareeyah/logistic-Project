// // src/views/Quotation.jsx
// import React, { useState } from 'react';

// function Quotation() {
//     // 1. สร้าง State สำหรับเก็บค่าที่คีย์จากหน้าจอ
//     const [formData, setFormData] = useState({
//         documentNumber: '',
//         customerId: '',
//         quotationDate: '',
//         totalAmount: 0,
//         status: 'รอดำเนินการ'
//     });

//     // 2. ฟังก์ชันอัปเดตค่าเมื่อพิมพ์
//     const handleChange = (e) => {
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value
//         });
//     };

//     // 3. ฟังก์ชันยิง API ไปหา Backend Service (เหมือนสไตล์ใน App.jsx ของคุณ)
//     const handleSaveQuotation = () => {
//         const payload = {
//             ...formData,
//             totalAmount: parseFloat(formData.totalAmount),
//             items: [
//                 {
//                     serviceName: "บริการคีย์ใหม่", 
//                     quantity: 1,
//                     price: parseFloat(formData.totalAmount)
//                 }
//             ]
//         };

//         fetch('http://localhost:3000/api/quotations', { // ปรับ URL API ให้ตรงกับฝั่งหลังบ้าน
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         })
//         .then(res => res.json())
//         .then(data => {
//             if(data.success) {
//                 alert('บันทึกใบเสนอราคาสำเร็จ');
//                 // โค้ดเคลียร์ฟอร์ม หรือสั่งล้างค่าตรงนี้
//             } else {
//                 alert('ข้อผิดพลาด: ' + data.message);
//             }
//         })
//         .catch(err => alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message));
//     };

//     return (
//         <div className="quotation-container">
//             {/* โค้ด HTML/JSX หน้าเอกสารใบเสนอราคาของคุณ */}
//             <input type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} placeholder="เช่น QT-2026001" />
//             <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} placeholder="จำนวนเงิน" />
            
//             <button onClick={handleSaveQuotation}>บันทึก</button>
//         </div>
//     );
// }

// export default Quotation;