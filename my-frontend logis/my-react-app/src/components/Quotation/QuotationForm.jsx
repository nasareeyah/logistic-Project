import React, { useState, useEffect } from 'react';

// =========================================================================
// 🛠️ HELPER FUNCTIONS (ฟังก์ชันช่วยจัดการเกี่ยวกับวันที่)
// =========================================================================

// ดึงวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD (เพื่อนำไปตั้งค่าเริ่มต้นให้ช่อง issueDate)
const getTodayDate = () => new Date().toISOString().split('T')[0];

// คำนวณวันที่ในอนาคต โดยบวกเพิ่มตามจำนวนวันที่ระบุ (ใช้ตั้งค่าวันหมดอายุใบเสนอราคา)
const getFutureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export default function CreateQuotationForm() {
  
  // =========================================================================
  // 📦 STATE MANAGEMENT (การจัดการสถานะและข้อมูลภายในฟอร์ม)
  // =========================================================================

  // 1. เก็บรายชื่อลูกค้าที่ดึงมาจาก Database (ผ่าน API Backend)
  const [customerList, setCustomerList] = useState([]);
  // เก็บสถานะการโหลดรายชื่อลูกค้า (แสดงข้อความ "กำลังโหลด..." ขณะรอข้อมูล)
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // 2. เก็บข้อมูลฟอร์มหลัก ( section 01 ข้อมูลเอกสาร และ section 02 ข้อมูลลูกค้า )
  const [formData, setFormData] = useState({
    documentNo: '',                  // เลขที่เอกสาร (ระบบอัตโนมัติ)
    issueDate: getTodayDate(),        // วันที่ออกเอกสาร (ค่าเริ่มต้น: วันนี้)
    validUntil: getFutureDate(15),   // วันหมดอายุเอกสาร (ค่าเริ่มต้น: +15 วัน)
    saleName: '',                    // พนักงานขาย (เปิดเป็นช่องว่างให้กรอกเอง)
    jobName: '',                     // ชื่องาน/โครงการ
    currency: 'THB',                 // สกุลเงินที่เสนอราคา (ค่าเริ่มต้น: THB)
    
    // ข้อมูลลูกค้า (จะถูก Auto-fill เมื่อเลือกจาก Dropdown หรือกรอกเอง)
    customerId: '',                  // รหัสลูกค้าใน DB
    customerName: '',                // ชื่อบริษัท/ชื่อลูกค้า
    address: '',                     // ที่อยู่
    taxId: '',                       // เลขประจำตัวผู้เสียภาษี
    contactPerson: '',               // ชื่อผู้ติดต่อ
    phone: '',                       // เบอร์โทรศัพท์
    email: '',                       // อีเมล
    
    remark: 'กรณีกระดกตู้สินค้า คิดค่าเสียเวลาวันละ 3,000 บาท/คัน' // หมายเหตุเริ่มต้น
  });

  // 3. เก็บรายการเส้นทางขนส่ง (Section 03) - เป็น Array รองรับการเพิ่มหลายเส้นทาง
  const [routes, setRoutes] = useState([
    { id: 1, origin: '', destination: '' }
  ]);

  // 4. เก็บรายการบริการ/ค่าใช้จ่าย (Section 04) - เป็น Array รองรับการเพิ่มหลายรายการ
  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, unit: 'คัน', pricePerUnit: 0, total: 0 }
  ]);

  // =========================================================================
  // 🌐 API CALLS & LOGIC HANDLERS (ฟังก์ชันดึงข้อมูลและจัดการเหตุการณ์)
  // =========================================================================

  // 🔄 [API GET]: ดึงรายชื่อลูกค้าจาก Backend ทันทีเมื่อเปิดหน้านี้ขึ้นมา
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // ยิงคำขอไปที่ Express Backend ที่เส้นทาง /api/customers
        const response = await fetch('http://localhost:3000/api/customers'); 
        if (response.ok) {
          const data = await response.json();
          setCustomerList(data); // นำรายการลูกค้าที่ได้มาเก็บลง State customerList
        } else {
          console.error('Failed to fetch customer list');
        }
      } catch (error) {
        console.error('Error connecting to backend:', error);
      } finally {
        setLoadingCustomers(false); // ปิดสถานะการโหลด
      }
    };

    fetchCustomers();
  }, []); // [] หมายถึงให้ทำงานเพียงครั้งเดียวตอนโหลดคอมโพเนนต์

  // 👤 [Logic Customer Select]: Auto-fill ข้อมูลลูกค้าเมื่อเลือกจาก Dropdown
  const handleCustomerSelect = (e) => {
    const selectedId = e.target.value;
    
    // ถ้าผู้ใช้เลือกว่า "-- เลือกบริษัทลูกค้า..." ให้ล้างข้อมูลลูกค้าทั้งหมดเป็นค่าว่าง
    if (!selectedId) {
      setFormData(prev => ({
        ...prev, customerId: '', customerName: '', address: '', taxId: '', contactPerson: '', phone: '', email: ''
      }));
      return;
    }

    // ค้นหาข้อมูลลูกค้าที่ตรงกับ ID ที่เลือกใน customerList
    const customer = customerList.find(c => String(c.customer_id || c.id) === String(selectedId));
    
    // ถ้าเจอข้อมูล ให้นำข้อมูลลูกค้านั้นมาอัปเดตลง State formData ทันที
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.customer_id || customer.id,
        customerName: customer.customer_name || customer.name || '',
        address: customer.address || '',
        taxId: customer.tax_id || customer.taxId || '',
        contactPerson: customer.contact_person || customer.contactPerson || '',
        phone: customer.phone || '',
        email: customer.email || ''
      }));
    }
  };

  // 📍 [Logic Routes]: ฟังก์ชันจัดการเกี่ยวกับเส้นทางขนส่ง
  const handleAddRoute = () => { // เพิ่มแถวเส้นทางใหม่
    setRoutes([...routes, { id: Date.now(), origin: '', destination: '' }]);
  };
  const handleRemoveRoute = (id) => { // ลบแถวเส้นทางตาม ID (ต้องเหลืออย่างน้อย 1 แถว)
    if (routes.length > 1) setRoutes(routes.filter(r => r.id !== id));
  };
  const handleRouteChange = (id, field, value) => { // อัปเดตข้อมูลต้นทาง/ปลายทาง
    setRoutes(routes.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // 🛒 [Logic Items]: ฟังก์ชันจัดการรายการค่าบริการ และการคำนวณเงิน
  const handleAddItem = () => { // เพิ่มแถวรายการบริการใหม่
    setItems([...items, { id: Date.now(), description: '', quantity: 1, unit: 'คัน', pricePerUnit: 0, total: 0 }]);
  };
  const handleRemoveItem = (id) => { // ลบแถวรายการบริการตาม ID
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };
  const handleItemChange = (id, field, value) => { // อัปเดตข้อมูลและคำนวณราคารวมอัตโนมัติ
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // ถ้ามีการเปลี่ยนจำนวน หรือ ราคาต่อหน่วย ให้คำนวณยอดรวม (total = qty * price) ใหม่
        if (field === 'quantity' || field === 'pricePerUnit') {
          const qty = field === 'quantity' ? Number(value) : Number(item.quantity);
          const price = field === 'pricePerUnit' ? Number(value) : Number(item.pricePerUnit);
          updated.total = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };

  // 💰 คำนวณราคารวมทั้งหมด (Grand Total) โดยบวกยอดรวมของทุกรายการย่อยเข้าด้วยกัน
  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  // 💾 [API POST]: ฟังก์ชันบันทึกข้อมูลใบเสนอราคาลงฐานข้อมูลผ่าน Backend
  const handleSubmit = async (e) => {
    e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บ Refresh เมื่อกด Submit ฟอร์ม

    // 1. จัดโครงสร้างข้อมูลส่วนเอกสารหลัก ให้ตรงกับ Column ของตาราง document ใน Postgres
    const documentPayload = {
      customer_id: formData.customerId || null,
      sale_name: formData.saleName,
      job_name: formData.jobName,
      document_date: formData.issueDate,
      valid_until: formData.validUntil,
      currency: formData.currency,
      remark: formData.remark,
      total_amount: grandTotal
    };

    try {
      // 2. ยิง POST บันทึกเอกสารหลักเข้าตาราง document
      const docRes = await fetch('http://localhost:3000/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentPayload)
      });

      const docResult = await docRes.json();

      if (!docRes.ok) {
        throw new Error(docResult.error || 'เกิดข้อผิดพลาดในการบันทึกเอกสาร');
      }

      // ดึง ID ของเอกสารที่เพิ่งถูกสร้างขึ้นมาใหม่ในตาราง document
      const newDocumentId = docResult.data?.document_id || docResult.data?.id;

      // 3. วนลูปยิง POST บันทึกรายการบริการย่อยลงตาราง document_items โดยอ้างอิง document_id
      if (newDocumentId && items.length > 0) {
        for (const item of items) {
          const itemPayload = {
            document_id: newDocumentId,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            price_per_unit: Number(item.pricePerUnit),
            total_price: Number(item.total)
          };

          await fetch('http://localhost:3000/api/document_items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemPayload)
          });
        }
      }

      alert('✅ บันทึกใบเสนอราคาและรายการสำเร็จเรียบร้อย!');
      
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  // =========================================================================
  // 🖥️ UI / VIEW RENDER (ส่วนแสดงผลหน้าจอ HTML/JSX)
  // =========================================================================
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      
      {/* 🟢 HEADER: หัวข้อและขั้นตอนการกรอกเอกสาร (Stepper 01 - 05) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-2 text-slate-800 mb-1">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h1 className="text-lg font-bold">สร้างใบเสนอราคา</h1>
        </div>
        <p className="text-xs text-slate-400 mb-6">กรอกรายละเอียดของงานขนส่งเพื่อออกใบเสนอราคาให้ลูกค้า</p>

        {/* วนลูปสร้างไอคอนหมายเลขขั้นตอน 01-05 */}
        <div className="flex items-center justify-center space-x-3">
          {[1, 2, 3, 4, 5].map((step, idx) => (
            <React.Fragment key={step}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0F3661] text-white text-xs font-bold shadow-sm">
                {String(step).padStart(2, '0')}
              </div>
              {idx < 4 && <div className="w-12 h-0.5 bg-slate-200"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 🟢 FORM PRINCIPAL: ฟอร์มหลักทั้งหมด ถูกหุ้มด้วยแท็ก <form> */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ==================== SECTION 01: ข้อมูลเอกสาร ==================== */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-bold">01</span>
            <h2 className="text-sm font-bold text-slate-700">ข้อมูลเอกสาร</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* ช่องแสดงเลขที่เอกสาร (Disabled ไว้ ให้ระบบรันอัตโนมัติ) */}
            <div>
              <label className="block text-slate-600 mb-1">เลขที่ใบเสนอราคา</label>
              <input 
                type="text" 
                value={formData.documentNo || 'ระบบจะออกให้อัตโนมัติ'} 
                disabled 
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-400 cursor-not-allowed font-medium" 
              />
            </div>
            {/* ช่องเลือกว่าที่ออกเอกสาร */}
            <div>
              <label className="block text-slate-600 mb-1">วันที่ออกเอกสาร <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                value={formData.issueDate} 
                onChange={e => setFormData({...formData, issueDate: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                required 
              />
            </div>
            {/* ช่องเลือกวันหมดอายุ */}
            <div>
              <label className="block text-slate-600 mb-1">ใช้ได้ถึงวันที่</label>
              <input 
                type="date" 
                value={formData.validUntil} 
                onChange={e => setFormData({...formData, validUntil: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
              />
            </div>
            {/* ช่องกรอกชื่อพนักงานขาย (ให้กรอกเอง) */}
            <div>
              <label className="block text-slate-600 mb-1">พนักงานขาย (ผู้ขาย) <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="กรอกชื่อ-นามสกุล พนักงานขาย" 
                value={formData.saleName} 
                onChange={e => setFormData({...formData, saleName: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                required 
              />
            </div>
            {/* ช่องกรอกชื่องาน */}
            <div>
              <label className="block text-slate-600 mb-1">ชื่องาน <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="เช่น ชิ้นงานหล่อ UHPC DURA" 
                value={formData.jobName} 
                onChange={e => setFormData({...formData, jobName: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                required 
              />
            </div>
            {/* ช่องเลือกสกุลเงิน */}
            <div>
              <label className="block text-slate-600 mb-1">สกุลเงินที่เสนอราคา <span className="text-red-500">*</span></label>
              <select 
                value={formData.currency} 
                onChange={e => setFormData({...formData, currency: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400 bg-white"
              >
                <option value="THB">บาท (THB)</option>
                <option value="USD">ดอลลาร์ (USD)</option>
                <option value="MYR">ริงกิต (MYR)</option>
                <option value="CNY">หยวน (CNY)</option>
                <option value="EUR">ยูโร (EUR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ==================== SECTION 02: ข้อมูลลูกค้า ==================== */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-bold">02</span>
            <h2 className="text-sm font-bold text-slate-700">ข้อมูลลูกค้า</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-600 mb-1">เลือกบริษัท / ลูกค้าเดิม <span className="text-red-500">*</span></label>
              
              {/* Dropdown เลือกรายชื่อลูกค้าที่มีใน DB */}
              <select 
                value={formData.customerId} 
                onChange={handleCustomerSelect} 
                disabled={loadingCustomers}
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400 bg-white mb-2 font-medium"
              >
                <option value="">
                  {loadingCustomers ? '-- กำลังโหลดข้อมูลลูกค้า... --' : '-- เลือกบริษัทลูกค้า หรือพิมพ์กรอกเองด้านล่าง --'}
                </option>
                {/* วนลูปแสดงรายชื่อลูกค้าที่ดึงมาจาก API */}
                {customerList.map(c => (
                  <option key={c.customer_id || c.id} value={c.customer_id || c.id}>
                    {c.customer_name || c.name}
                  </option>
                ))}
              </select>
              
              {/* ช่องกรอก/แสดงชื่อบริษัทลูกค้า */}
              <input 
                type="text" 
                placeholder="ชื่อบริษัท / ชื่อลูกค้า" 
                value={formData.customerName} 
                onChange={e => setFormData({...formData, customerName: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                required 
              />
            </div>
            {/* ช่องกรอกที่อยู่ */}
            <div className="md:col-span-2">
              <label className="block text-slate-600 mb-1">ที่อยู่ <span className="text-slate-400">(ไม่บังคับ)</span></label>
              <input 
                type="text" 
                placeholder="เลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
              />
            </div>
            {/* ช่องกรอกเลขประจำตัวผู้เสียภาษี */}
            <div>
              <label className="block text-slate-600 mb-1">เลขประจำตัวผู้เสียภาษี <span className="text-slate-400">(ไม่บังคับ)</span></label>
              <input 
                type="text" 
                placeholder="0-0000-00000-00-0" 
                value={formData.taxId} 
                onChange={e => setFormData({...formData, taxId: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
              />
            </div>
            {/* ช่องกรอกชื่อผู้ติดต่อ */}
            <div>
              <label className="block text-slate-600 mb-1">ผู้ติดต่อ <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="ชื่อผู้ติดต่อ" 
                value={formData.contactPerson} 
                onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                required 
              />
            </div>
            {/* ช่องกรอกเบอร์โทรศัพท์ */}
            <div>
              <label className="block text-slate-600 mb-1">เบอร์โทร <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="0X-XXXX-XXXX" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                required 
              />
            </div>
            {/* ช่องกรอกอีเมล */}
            <div>
              <label className="block text-slate-600 mb-1">อีเมล <span className="text-slate-400">(ไม่บังคับ)</span></label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
              />
            </div>
          </div>
        </div>

        {/* ==================== SECTION 03: เส้นทางขนส่ง ==================== */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-bold">03</span>
            <h2 className="text-sm font-bold text-slate-700">เส้นทางขนส่ง</h2>
          </div>
          
          {/* วนลูปแสดงแถวรายการเส้นทางตาม State routes */}
          {routes.map((route) => (
            <div key={route.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs mb-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-slate-600 mb-1">ต้นทาง <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="เช่น สงขลา, ไทย" 
                  value={route.origin} 
                  onChange={e => handleRouteChange(route.id, 'origin', e.target.value)} 
                  className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                  required 
                />
              </div>
              <div className="md:col-span-5">
                <label className="block text-slate-600 mb-1">ปลายทาง <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="เช่น ชลบุรี, ไทย" 
                  value={route.destination} 
                  onChange={e => handleRouteChange(route.id, 'destination', e.target.value)} 
                  className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                  required 
                />
              </div>
              {/* ปุ่มลบเส้นทาง (ซ่อนไว้ถ้ามีแค่แถวเดียว) */}
              <div className="md:col-span-2">
                {routes.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveRoute(route.id)} 
                    className="w-full py-2 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 transition"
                  >
                    ลบสถานที่
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* ปุ่มกดเพิ่มแถวเส้นทางขนส่ง */}
          <button 
            type="button" 
            onClick={handleAddRoute} 
            className="w-full py-2 bg-slate-50 border border-dashed border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-100 transition font-medium mt-2"
          >
            + เพิ่มสถานที่
          </button>
        </div>

        {/* ==================== SECTION 04: รายการค่าบริการ ==================== */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-bold">04</span>
            <h2 className="text-sm font-bold text-slate-700">รายการค่าบริการ</h2>
          </div>
          
          {/* หัวตารางรายการ (แสดงเฉพาะบนจอคอมพิวเตอร์/หน้าจอใหญ่) */}
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 mb-2">
            <div className="col-span-5">รายละเอียด</div>
            <div className="col-span-2">จำนวน</div>
            <div className="col-span-2">หน่วย</div>
            <div className="col-span-2">ราคาต่อหน่วย</div>
            <div className="col-span-1 text-right">ยอดรวม</div>
          </div>

          {/* วนลูปแสดงรายการบริการย่อยตาม State items */}
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 text-xs items-center mb-3">
              {/* รายละเอียดบริการ */}
              <div className="col-span-12 md:col-span-5">
                <textarea 
                  rows="2" 
                  placeholder="เช่น ค่าขนส่งไทย-มาเลเซีย" 
                  value={item.description} 
                  onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                  className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                  required 
                />
              </div>
              {/* จำนวน */}
              <div className="col-span-3 md:col-span-2">
                <input 
                  type="number" 
                  min="1" 
                  value={item.quantity} 
                  onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} 
                  className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                />
              </div>
              {/* หน่วยนับ */}
              <div className="col-span-3 md:col-span-2">
                <input 
                  type="text" 
                  value={item.unit} 
                  onChange={e => handleItemChange(item.id, 'unit', e.target.value)} 
                  className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                />
              </div>
              {/* ราคาต่อหน่วย */}
              <div className="col-span-4 md:col-span-2">
                <input 
                  type="number" 
                  min="0" 
                  value={item.pricePerUnit} 
                  onChange={e => handleItemChange(item.id, 'pricePerUnit', e.target.value)} 
                  className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400" 
                />
              </div>
              {/* ราคารวมของรายการนี้ (คำนวณให้อัตโนมัติ) + ปุ่มลบรายการ */}
              <div className="col-span-2 md:col-span-1 flex items-center justify-end space-x-2">
                <span className="font-bold text-slate-700">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
                )}
              </div>
            </div>
          ))}

          {/* ปุ่มกดเพิ่มแถวรายการบริการ */}
          <button 
            type="button" 
            onClick={handleAddItem} 
            className="w-full py-2 bg-slate-50 border border-dashed border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-100 transition font-medium mb-4"
          >
            + เพิ่มรายการ
          </button>

          {/* สรุปยอดรวมราคาทั้งหมด (Grand Total) ด้านล่างตาราง */}
          <div className="border-t pt-4 flex justify-end text-sm">
            <div className="text-right space-y-1">
              <span className="text-slate-500 mr-4 font-medium">ยอดรวมทั้งสิ้น ({formData.currency}):</span>
              <span className="text-xl font-bold text-[#0F3661]">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* ==================== SECTION 05: เงื่อนไขและหมายเหตุ ==================== */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-bold">05</span>
            <h2 className="text-sm font-bold text-slate-700">เงื่อนไขและหมายเหตุ</h2>
          </div>
          <div className="text-xs">
            <label className="block text-slate-600 mb-1">หมายเหตุ</label>
            <textarea 
              rows="3" 
              placeholder="กรอกเงื่อนไขเพิ่มเติม..." 
              value={formData.remark} 
              onChange={e => setFormData({...formData, remark: e.target.value})} 
              className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-slate-400"
            ></textarea>
          </div>
        </div>

        {/* ==================== ACTION BUTTONS: ปุ่มกดยืนยันบันทึกข้อมูล ==================== */}
        <div className="flex justify-end space-x-3 text-xs pt-2">
          <button 
            type="submit" 
            className="px-6 py-2.5 bg-[#0F3661] text-white rounded-lg hover:bg-slate-900 transition font-medium shadow-sm flex items-center space-x-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
            <span>บันทึกใบเสนอราคา</span>
          </button>
        </div>

      </form>
    </div>
  );
}