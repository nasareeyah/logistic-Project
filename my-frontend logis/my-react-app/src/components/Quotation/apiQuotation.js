const BASE_URL = 'http://localhost:3000/api';

/**
 * 1. ดึงรายชื่อลูกค้าทั้งหมดจากฐานข้อมูล เพื่อนำมาแสดงในฟอร์มออกใบเสนอราคา
 */
export const fetchCustomerList = async () => {
    const response = await fetch(`${BASE_URL}/customers`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลลูกค้าได้');
    return await response.json();
};

/**
 * 2. ดึงรายการใบเสนอราคาทั้งหมดพร้อม items
 */
export const fetchQuotations = async () => {
    const response = await fetch(`${BASE_URL}/quotations`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลใบเสนอราคาได้');
    return await response.json();
};

/**
 * 3. ดึงรายละเอียดใบเสนอราคาตาม ID
 */
export const fetchQuotationById = async (id) => {
    const response = await fetch(`${BASE_URL}/quotations/${id}`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลใบเสนอราคาได้');
    return await response.json();
};

/**
 * 4. ขอเลขที่ใบเสนอราคาถัดไป (เช่น QT-YYYYMMDD-0001)
 */
export const fetchNextQuotationNo = async (date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const response = await fetch(`${BASE_URL}/quotations/next-no${query}`);
    if (!response.ok) throw new Error('ไม่สามารถสร้างเลขที่ใบเสนอราคาได้');
    return await response.json();
};

/**
 * 5. ฟังก์ชันหลักสำหรับ "สร้างใบเสนอราคาใหม่ (Create)"
 * บันทึกตาราง quotations + quotation_items และ auto-sync ลง Central Document Registry อัตโนมัติ
 */
export const createQuotation = async ({ formData, routes, items, grandTotal }) => {
    const res = await fetch(`${BASE_URL}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, routes, items, grandTotal })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึกใบเสนอราคาไม่สำเร็จ');
    return data;
};

/**
 * 6. ฟังก์ชันสำหรับ "แก้ไขใบเสนอราคาเดิม (Update)"
 */
export const updateQuotation = async (quotationId, { formData, routes, items, grandTotal }) => {
    const res = await fetch(`${BASE_URL}/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, routes, items, grandTotal })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'แก้ไขใบเสนอราคาไม่สำเร็จ');
    return data;
};

/**
 * 7. ลบใบเสนอราคาออกจากระบบโดยระบุ ID ของเอกสาร
 */
export const deleteQuotation = async (quotationId) => {
    const res = await fetch(`${BASE_URL}/quotations/${quotationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ลบใบเสนอราคาไม่สำเร็จ');
    return data;
};
