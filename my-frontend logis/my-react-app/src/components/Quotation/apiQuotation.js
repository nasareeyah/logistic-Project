const BASE_URL = 'http://localhost:3000/api';


 //1. ดึงรายชื่อลูกค้าทั้งหมดจากฐานข้อมูล เพื่อนำมาแสดงในฟอร์มออกใบเสนอราคา
 
export const fetchCustomerList = async () => {
    const response = await fetch(`${BASE_URL}/customers`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลลูกค้าได้');
    return await response.json();
};

/**
 * 2. บันทึกข้อมูลที่อยู่ต้นทาง (ผู้ส่ง - Consigner) ลงในระบบหากไม่มีอยู่เดิม
 * @param {string} origin - ที่อยู่ต้นทาง
 * @returns {number|null} ID ของผู้ส่งที่เพิ่งบันทึกสำเร็จ
 */
const saveConsignerIfNeeded = async (origin) => {
    if (!origin) return null;
    const res = await fetch(`${BASE_URL}/consigner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: origin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึกผู้ส่งไม่สำเร็จ');
    return data.consigner_id || null;
};

/**
 * 3. บันทึกข้อมูลที่อยู่ปลายทาง (ผู้รับ - Consignee) ลงในระบบหากไม่มีอยู่เดิม
 * @param {string} destination - ที่อยู่ปลายทาง
 * @returns {number|null} ID ของผู้รับที่เพิ่งบันทึกสำเร็จ
 */
const saveConsigneeIfNeeded = async (destination) => {
    if (!destination) return null;
    const res = await fetch(`${BASE_URL}/consignee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: destination })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึกผู้รับไม่สำเร็จ');
    return data.consignee_id || null;
};

/**
 * 4. บันทึกประเภทของการให้บริการ (เช่น รถกระบะตู้ทึบ, รถ 6 ล้อ) ลงในระบบหากไม่มีอยู่เดิม
 * @param {string} typeName - ชื่อประเภทบริการ
 * @returns {number|null} ID ของประเภทบริการที่เพิ่งบันทึกสำเร็จ
 */
const saveServiceTypeIfNeeded = async (typeName) => {
    if (!typeName) return null;
    const res = await fetch(`${BASE_URL}/service_type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_typename: typeName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึกประเภทบริการไม่สำเร็จ');
    return data.service_typeid || null;
};

/**
 * 5. บันทึกรายการบริการแต่ละแถวลงในฐานข้อมูล
 * @param {number} serviceTypeId - ID ประเภทบริการ
 * @param {object} item - รายการข้อมูลบริการ เช่น คำอธิบาย จำนวน ราคาต่อหน่วย
 * @returns {number} ID ของบริการที่เพิ่งบันทึกสำเร็จ
 */
const createServiceRecord = async (serviceTypeId, item) => {
    const res = await fetch(`${BASE_URL}/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_typeID: serviceTypeId,
            description: item.description,
            quantity: Number(item.quantity) || null,
            unit_quantity: item.unitQuantity || '',
            default_price: Number(item.pricePerUnit) || 0,
            unit: item.unit || 'THB'
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึก service ไม่สำเร็จ');
    return data.service_id;
};

/**
 * 6. สร้างประวัติไอเทมเอกสาร (document_items) เพื่อเชื่อมโยงตัวเอกสาร (Quotation) เข้ากับบริการที่ทำรายการ
 * @param {number} documentId - ID ของเอกสาร
 * @param {number} serviceId - ID ของบริการ
 */
const createDocItemRecord = async (documentId, serviceId) => {
    const res = await fetch(`${BASE_URL}/document_items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            document_id: documentId,
            service_id: serviceId
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึก document_items ไม่สำเร็จ');
    return data;
};

/**
 * 7. ฟังก์ชันหลักสำหรับ "สร้างใบเสนอราคาใหม่ (Create)" พร้อมทั้งบันทึกข้อมูลย่อยอย่างเป็นลำดับขั้นตอน
 */
export const createQuotation = async ({ formData, routes, items, grandTotal }) => {
    // 7.1 บันทึกต้นทางและปลายทาง (ถ้ามี)
    const route = routes?.[0] || {};
    const consignerId = await saveConsignerIfNeeded(route.origin);
    const consigneeId = await saveConsigneeIfNeeded(route.destination);

    // 7.2 วนลูปบันทึกประเภทบริการและสร้างรายการ Service ทั้งหมดในฟอร์ม พร้อมเก็บ IDs ไว้
    const serviceIds = [];
    if (items && items.length > 0) {
        for (const item of items) {
            const serviceTypeId = await saveServiceTypeIfNeeded(item.serviceType);
            const serviceId = await createServiceRecord(serviceTypeId, item);
            serviceIds.push(serviceId);
        }
    }

    // 7.3 บันทึกตัวเอกสารหลัก (document) ลงฐานข้อมูล พร้อมอ้างอิง Service ตัวแรก
    const docRes = await fetch(`${BASE_URL}/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            document_no: formData.documentNo || null,
            document_type: 'Quotation',
            customer_id: formData.customerId || null,
            sale_name: formData.salesperson || '',
            job_name: formData.projectName || '',
            document_date: formData.issueDate || null,
            valid_until: formData.expiryDate || null,
            currency: 'THB',
            remark: formData.remark || '',
            total_amount: grandTotal || 0,
            consigner_id: consignerId,
            consignee_id: consigneeId,
            service_id: serviceIds[0] || null
        })
    });
    const docResult = await docRes.json();
    if (!docRes.ok) throw new Error(docResult.error || 'บันทึกเอกสารไม่สำเร็จ');

    const newDocumentId = docResult.data?.document_id;
    if (!newDocumentId) throw new Error('ไม่ได้รับ document_id จากระบบ');

    // 7.4 บันทึกความเชื่อมโยงในตาราง document_items ให้ครบทุกรายการบริการที่มี
    for (const serviceId of serviceIds) {
        await createDocItemRecord(newDocumentId, serviceId);
    }

    return docResult;
};

/**
 * 8. ฟังก์ชันสำหรับ "แก้ไขใบเสนอราคาเดิม (Update)"
 */
export const updateQuotation = async (documentId, { formData, routes, items, grandTotal }) => {
    // 8.1 บันทึกต้นทางและปลายทาง (ถ้ามีอัปเดต)
    const route = routes?.[0] || {};
    const consignerId = await saveConsignerIfNeeded(route.origin);
    const consigneeId = await saveConsigneeIfNeeded(route.destination);

    // 8.2 เคลียร์/ลบรายการไอเทมเอกสาร (document_items) เดิมออกก่อนเพื่อเตรียมเขียนทับ
    const oldRes = await fetch(`${BASE_URL}/document_items?document_id=${documentId}`);
    const oldItems = await oldRes.json();
    for (const oldItem of oldItems) {
        await fetch(`${BASE_URL}/document_items/${oldItem.document_items_id}`, { method: 'DELETE' });
    }

    // 8.3 สร้างรายการ Services ชุดใหม่ขึ้นมาทดแทน
    const serviceIds = [];
    if (items && items.length > 0) {
        for (const item of items) {
            const serviceTypeId = await saveServiceTypeIfNeeded(item.serviceType);
            const serviceId = await createServiceRecord(serviceTypeId, item);
            serviceIds.push(serviceId);
        }
    }

    // 8.4 ทำการอัปเดตตัวเอกสารหลัก (document) ในฐานข้อมูลด้วยค่าล่าสุด
    const docRes = await fetch(`${BASE_URL}/document/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            document_no: formData.documentNo || null,
            document_type: 'Quotation',
            customer_id: formData.customerId || null,
            sale_name: formData.salesperson || '',
            job_name: formData.projectName || '',
            document_date: formData.issueDate || null,
            valid_until: formData.expiryDate || null,
            currency: 'THB',
            remark: formData.remark || '',
            grand_total: grandTotal || 0,
            consigner_id: consignerId,
            consignee_id: consigneeId,
            service_id: serviceIds[0] || null
        })
    });
    const docResult = await docRes.json();
    if (!docRes.ok) throw new Error(docResult.error || 'แก้ไขเอกสารไม่สำเร็จ');

    // 8.5 เชื่อมโยงไอเทมใหม่ทั้งหมดลงในตาราง document_items
    for (const serviceId of serviceIds) {
        await createDocItemRecord(documentId, serviceId);
    }

    return docResult;
};

/**
 * 9. ลบใบเสนอราคาออกจากระบบโดยระบุ ID ของเอกสาร
 */
export const deleteQuotation = async (documentId) => {
    const res = await fetch(`${BASE_URL}/document/${documentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'ลบเอกสารไม่สำเร็จ');
    return result;
};
