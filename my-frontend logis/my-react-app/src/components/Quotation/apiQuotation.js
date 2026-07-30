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
    // 0. บันทึก consigner/consignee จากเส้นทางขนส่ง
    const route = routes?.[0] || {};
    let consignerId = null;
    let consigneeId = null;

    if (route.origin) {
        try {
            const res = await fetch(`${BASE_URL}/consigner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: route.origin })
            });
            const data = await res.json();
            if (data.consigner_id) consignerId = data.consigner_id;
        } catch (e) {
            console.error('Consigner save error:', e);
        }
    }

    if (route.destination) {
        try {
            const res = await fetch(`${BASE_URL}/consignee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: route.destination })
            });
            const data = await res.json();
            if (data.consignee_id) consigneeId = data.consignee_id;
        } catch (e) {
            console.error('Consignee save error:', e);
        }
    }

    // 1. บันทึกเอกสารหลัก
    const docRes = await fetch(`${BASE_URL}/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            document_no: formData.documentNo || null,
            document_type: 'Quotation',
            customer_id: formData.customerId || null,
            sale_name: formData.salesperson || formData.saleName || '',
            job_name: formData.projectName || formData.jobName || '',
            document_date: formData.issueDate || null,
            valid_until: formData.expiryDate || formData.validUntil || null,
            currency: formData.currency || 'THB',
            remark: formData.remark || '',
            total_amount: grandTotal || 0,
            status: 'Draft',
            consigner_id: consignerId,
            consignee_id: consigneeId
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
                    unit_quantity: item.unitQuantity || item.unit_quantity || 'trip',
                    default_price: Number(item.pricePerUnit) || 0,
                    unit: item.unit || 'THB'
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
                    unit: item.unitQuantity || item.unit_quantity || 'trip',
                    price_per_unit: Number(item.pricePerUnit),
                    total_price: Number(item.total)
                })
            });
        }
    }

    return docResult;
};