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
// Helper: บันทึก consigner/consignee จาก origin/destination
const saveConsignerIfNeeded = async (origin) => {
    if (!origin) return null;
    const res = await fetch(`${BASE_URL}/consigner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: origin })
    });
    const data = await res.json();
    return data.consigner_id || null;
};

const saveConsigneeIfNeeded = async (destination) => {
    if (!destination) return null;
    const res = await fetch(`${BASE_URL}/consignee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: destination })
    });
    const data = await res.json();
    return data.consignee_id || null;
};

const buildDocPayload = async (formData, routes, items, grandTotal) => {
    const route = routes?.[0] || {};
    const consignerId = await saveConsignerIfNeeded(route.origin);
    const consigneeId = await saveConsigneeIfNeeded(route.destination);

    return {
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
    };
};

export const createQuotation = async ({ formData, routes, items, grandTotal }) => {
    const payload = await buildDocPayload(formData, routes, items, grandTotal);

    const docRes = await fetch(`${BASE_URL}/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const docResult = await docRes.json();
    if (!docRes.ok) throw new Error(docResult.error || 'บันทึกเอกสารไม่สำเร็จ');

    const newDocumentId = docResult.data?.document_id;

    // วนลูปบันทึก service + document_items ทีละรายการ
    if (newDocumentId && items && items.length > 0) {
        for (const item of items) {
            const serviceId = 'sv-' + Math.floor(10000 + Math.random() * 90000);

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

export const updateQuotation = async (documentId, { formData, routes, items, grandTotal }) => {
    const payload = await buildDocPayload(formData, routes, items, grandTotal);

    const docRes = await fetch(`${BASE_URL}/document/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const docResult = await docRes.json();
    if (!docRes.ok) throw new Error(docResult.error || 'แก้ไขเอกสารไม่สำเร็จ');

    // ลบ document_items เดิม แล้วสร้างใหม่
    const itemsRes = await fetch(`${BASE_URL}/document_items?document_id=${documentId}`);
    const existingItems = await itemsRes.json();
    for (const oldItem of existingItems) {
        await fetch(`${BASE_URL}/document_items/${oldItem.document_items_id}`, { method: 'DELETE' });
    }

    if (items && items.length > 0) {
        for (const item of items) {
            const serviceId = 'sv-' + Math.floor(10000 + Math.random() * 90000);

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

            await fetch(`${BASE_URL}/document_items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    document_id: documentId,
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

export const deleteQuotation = async (documentId) => {
    const res = await fetch(`${BASE_URL}/document/${documentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'ลบเอกสารไม่สำเร็จ');
    return result;
};