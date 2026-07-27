// apiQuotation.js

const BASE_URL = 'http://localhost:3000/api';

/**
 * ดึงรายชื่อลูกค้าทั้งหมด
 */
export const fetchCustomerList = async () => {
    try {
        const response = await fetch(`${BASE_URL}/customers`);
        if (!response.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลลูกค้าได้');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching customer list:', error);
        throw error;
    }
};

/**
 * บันทึกใบเสนอราคา (สร้าง Document, Service และ Document Items)
 */
export const createQuotation = async ({ formData, routes, items, grandTotal }) => {
    // 1. บันทึกเอกสารหลัก
    const docRes = await fetch(`${BASE_URL}/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customer_id: formData.customerId || null,
            sale_name: formData.saleName,
            job_name: formData.jobName,
            document_date: formData.issueDate,
            valid_until: formData.validUntil,
            currency: formData.currency,
            remark: formData.remark,
            total_amount: grandTotal
        })
    });

    const docResult = await docRes.json();
    if (!docRes.ok) throw new Error(docResult.error || 'บันทึกเอกสารไม่สำเร็จ');

    const newDocumentId = docResult.data?.document_id;

    // 2. วนลูปบันทึก service + document_items ทีละรายการ
    if (newDocumentId && items && items.length > 0) {
        for (const item of items) {
            // 2.1 สร้าง service_id สั้น
            const serviceId = 'sv-' + Math.floor(10000 + Math.random() * 90000);

            // 2.2 สร้าง service record
            await fetch(`${BASE_URL}/service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    service_typeID: 'st-25658',
                    description: item.description,
                    quantity: Number(item.quantity) || null,
                    unit_quantity: item.unit, // ส่งหน่วยของจำนวนมาที่นี่ (เช่น 'คัน')
                    default_price: Number(item.pricePerUnit) || 0,
                    unit: item.priceUnit || item.unit // ส่งหน่วยของราคามาที่นี่ (ใช้ item.priceUnit ถ้ามี)
                })
            });

            // 2.3 สร้าง document_items record
            await fetch(`${BASE_URL}/document_items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document_id: newDocumentId,
                    service_id: serviceId,
                    description: item.description,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    price_per_unit: Number(item.pricePerUnit),
                    total_price: Number(item.total)
                })
            });
        }
    }

    return docResult;
};