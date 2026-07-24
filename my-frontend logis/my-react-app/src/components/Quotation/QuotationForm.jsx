import React, { useState, useEffect } from 'react';
import { createQuotation, fetchCustomerList } from '../Quotation/apiQuotation';

// =========================================================================
// 🛠️ HELPER FUNCTIONS
// =========================================================================
const getTodayDate = () => new Date().toISOString().split('T')[0];

const getFutureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export default function QuotationForm() {
  // =========================================================================
  // 📦 STATE MANAGEMENT
  // =========================================================================
  const [customerList, setCustomerList] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    documentNo: '',
    issueDate: getTodayDate(),
    validUntil: getFutureDate(15),
    saleName: '',
    jobName: '',
    currency: 'บาท (THB)',

    customerId: '',
    customerName: '',
    address: '',
    taxId: '',
    contactPerson: '',
    phone: '',
    email: '',

    remark: 'กรณีกระดกตู้สินค้าคิดค่าเสียเวลาวันละ 3,000 บาท/คัน'
  });

  const [routes, setRoutes] = useState([
    { id: 1, origin: '', destination: '' }
  ]);

 const [items, setItems] = useState([{
    id: 1,
    description: '',
    quantity: 1,
    unit: 'คัน',
    pricePerUnit: 0,
    total: 0
}]);

  // =========================================================================
  // 🌐 API CALLS & HANDLERS
  // =========================================================================

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const data = await fetchCustomerList();
        setCustomerList(data);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  const handleCustomerSelect = (e) => {
    const selectedId = e.target.value;

    if (!selectedId) {
      setFormData(prev => ({
        ...prev, customerId: '', customerName: '', address: '', taxId: '', contactPerson: '', phone: '', email: ''
      }));
      return;
    }

    const customer = customerList.find(c => String(c.customer_id || c.id) === String(selectedId));

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

  const handleAddRoute = () => {
    setRoutes([...routes, { id: Date.now(), origin: '', destination: '' }]);
  };

  const handleRemoveRoute = (id) => {
    if (routes.length > 1) setRoutes(routes.filter(r => r.id !== id));
  };

  const handleRouteChange = (id, field, value) => {
    setRoutes(routes.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddItem = () => {
    setItems([...items, {
        id: Date.now(),
        serviceTypeId: 'st-25658',
        description: '',
        quantity: 1,
        unit: 'คัน',
        pricePerUnit: 0,
        total: 0
    }]);
};
 
  const handleRemoveItem = (id) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
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

  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createQuotation({
        formData,
        routes,
        items,
        grandTotal
      });

      alert('บันทึกใบเสนอราคาสำเร็จ!');
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert(' เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // 🖥️ UI RENDER
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 font-sans text-slate-700 text-xs">

      {/* 🟢 TOP HEADER CARD: Title & Stepper */}
      <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200">
        <div className="flex items-center space-x-2 text-slate-800 mb-0.5">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-base font-bold text-slate-800">สร้างใบเสนอราคา</h2>
        </div>
        <p className="text-[11px] text-slate-400 mb-6">กรอกรายละเอียดงานขนส่งเพื่อออกใบเสนอราคาให้ลูกค้า</p>

        {/* Stepper */}
        <div className="flex items-center justify-center space-x-2 md:space-x-4 py-1">
          {['01', '02', '03', '04', '05'].map((step, idx) => (
            <React.Fragment key={step}>
              <div className="flex items-center justify-center px-4 py-1 rounded-full bg-[#e6f4f1] text-[#0d9488] text-xs font-semibold border border-[#c4e8e3] min-w-[50px] text-center">
                {step}
              </div>
              {idx < 4 && <div className="w-8 md:w-16 h-[1.5px] bg-slate-300"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 🟢 FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* SECTION 01: ข้อมูลเอกสาร */}
        <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="bg-[#e6f4f1] text-[#0d9488] text-[11px] px-2 py-0.5 rounded font-semibold border border-[#c4e8e3]">01</span>
            <h2 className="text-xs font-bold text-slate-800">ข้อมูลเอกสาร</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 text-[11px]">เลขที่ใบเสนอราคา</label>
              <input
                type="text"
                value={formData.documentNo || 'QT202607060001'}
                disabled
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-400 cursor-not-allowed text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">สร้างอัตโนมัติเมื่อกดบันทึก</span>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 text-[11px]">
                วันที่ออกเอกสาร <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 text-[11px]">ใช้ได้ถึงวันที่</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 text-[11px]">
                พนักงานขาย (ผู้ขาย) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={formData.saleName}
                onChange={e => setFormData({ ...formData, saleName: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 text-[11px]">
                ชื่องาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น ชิ้นงานหล่อ UHPC DURA"
                value={formData.jobName}
                onChange={e => setFormData({ ...formData, jobName: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 text-[11px]">
                สกุลเงินที่เสนอราคา <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="บาท (THB)">บาท (THB)</option>
                <option value="ดอลลาร์ (USD)">ดอลลาร์ (USD)</option>
                <option value="ริงกิต (MYR)">ริงกิต (MYR)</option>
                <option value="หยวน (CNY)">หยวน (CNY)</option>
                <option value="ยูโร (EUR)">ยูโร (EUR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 02: ข้อมูลลูกค้า */}
        <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="bg-[#e6f4f1] text-[#0d9488] text-[11px] px-2 py-0.5 rounded font-semibold border border-[#c4e8e3]">02</span>
            <h2 className="text-xs font-bold text-slate-800">ข้อมูลลูกค้า</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-600 mb-1 text-[11px]">
                ชื่อบริษัท / ข้อมูลลูกค้า <span className="text-red-500">*</span>
              </label>
              {customerList.length > 0 && (
                <select
                  value={formData.customerId}
                  onChange={handleCustomerSelect}
                  disabled={loadingCustomers}
                  className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white mb-2 text-slate-700"
                >
                  <option value="">-- เลือกลูกค้าเดิมจากระบบ --</option>
                  {customerList.map(c => (
                    <option key={c.customer_id || c.id} value={c.customer_id || c.id}>
                      {c.customer_name || c.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                placeholder="บริษัท ตัวอย่าง จำกัด"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 text-[11px]">
                ที่อยู่ <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <input
                type="text"
                placeholder="เลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px]">
                  เลขประจำตัวผู้เสียภาษี <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                </label>
                <input
                  type="text"
                  placeholder="0-0000-00000-00-0"
                  value={formData.taxId}
                  onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-[11px]">
                  ผู้ติดต่อ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ชื่อผู้ติดต่อ"
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px]">
                  เบอร์โทร <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="0X-XXXX-XXXX"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-[11px]">
                  อีเมล <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 03: เส้นทางขนส่ง */}
        <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="bg-[#e6f4f1] text-[#0d9488] text-[11px] px-2 py-0.5 rounded font-semibold border border-[#c4e8e3]">03</span>
            <h2 className="text-xs font-bold text-slate-800">เส้นทางขนส่ง</h2>
          </div>

          <div className="space-y-3">
            {routes.map((route) => (
              <div key={route.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className={routes.length > 1 ? "md:col-span-5" : "md:col-span-6"}>
                  <label className="block text-slate-600 mb-1 text-[11px]">
                    ต้นทาง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น สงขลา, ไทย"
                    value={route.origin}
                    onChange={e => handleRouteChange(route.id, 'origin', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                    required
                  />
                </div>
                <div className={routes.length > 1 ? "md:col-span-5" : "md:col-span-6"}>
                  <label className="block text-slate-600 mb-1 text-[11px]">
                    ปลายทาง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ชลบุรี, ไทย"
                    value={route.destination}
                    onChange={e => handleRouteChange(route.id, 'destination', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                    required
                  />
                </div>
                {routes.length > 1 && (
                  <div className="md:col-span-2 pt-5">
                    <button
                      type="button"
                      onClick={() => handleRemoveRoute(route.id)}
                      className="w-full py-2 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 transition text-[11px] font-medium"
                    >
                      ลบรายการ
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddRoute}
              className="w-full py-2 bg-[#e6f4f1]/60 hover:bg-[#e6f4f1] border border-dashed border-[#aadae0] rounded-lg text-xs text-[#0d9488] transition font-medium flex items-center justify-center space-x-1 mt-2"
            >
              <span>+ เพิ่มรายการ</span>
            </button>
          </div>
        </div>

        {/* SECTION 04: รายการค่าบริการ */}
        <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="bg-[#e6f4f1] text-[#0d9488] text-[11px] px-2 py-0.5 rounded font-semibold border border-[#c4e8e3]">04</span>
            <h2 className="text-xs font-bold text-slate-800">รายการค่าบริการ</h2>
          </div>

          <div className="hidden md:grid grid-cols-12 gap-2 text-[11px] font-normal text-slate-400 mb-2 px-1">
            <div className="col-span-5">รายละเอียด</div>
            <div className="col-span-2 text-center">จำนวน</div>
            <div className="col-span-2 text-center">หน่วย</div>
            <div className="col-span-2 text-center">ราคาต่อหน่วย</div>
            <div className="col-span-1 text-right">ยอดรวม</div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 md:col-span-5">
                  <input
                    type="text"
                    placeholder="เช่น ค่าขนส่งไทย-มาเลเซีย..."
                    value={item.description}
                    onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
                    required
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white text-center"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    type="text"
                    value={item.unit}
                    onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white text-center"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    min="0"
                    value={item.pricePerUnit}
                    onChange={e => handleItemChange(item.id, 'pricePerUnit', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white text-right font-medium"
                  />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-center justify-end space-x-2">
                  <span className="text-slate-400 text-xs">
                    {item.total ? item.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-5 h-5 rounded border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center transition text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2 bg-[#e6f4f1]/60 hover:bg-[#e6f4f1] border border-dashed border-[#aadae0] rounded-lg text-xs text-[#0d9488] transition font-medium flex items-center justify-center space-x-1 mt-2"
            >
              <span>+ เพิ่มรายการ</span>
            </button>
          </div>
        </div>

        {/* SECTION 05: เงื่อนไขและหมายเหตุ */}
        <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="bg-[#e6f4f1] text-[#0d9488] text-[11px] px-2 py-0.5 rounded font-semibold border border-[#c4e8e3]">05</span>
            <h2 className="text-xs font-bold text-slate-800">เงื่อนไขและหมายเหตุ</h2>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 text-[11px]">หมายเหตุ</label>
            <textarea
              rows="3"
              placeholder="เช่น กรณีกระดกตู้สินค้าคิดค่าเสียเวลาวันละ 3,000 บาท/คัน"
              value={formData.remark}
              onChange={e => setFormData({ ...formData, remark: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 bg-white placeholder-slate-300"
            ></textarea>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end items-center space-x-3 text-xs pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#0f2d5c] hover:bg-[#0a2044] disabled:bg-slate-400 text-white rounded-full transition font-medium shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</span>
          </button>

          <button
            type="button"
            onClick={() => alert('แสดงตัวอย่างใบเสนอราคา (Preview)')}
            className="px-6 py-2.5 bg-[#0f2d5c] hover:bg-[#0a2044] text-white rounded-full transition font-medium shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview</span>
          </button>
        </div>

      </form>
    </div>
  );
}