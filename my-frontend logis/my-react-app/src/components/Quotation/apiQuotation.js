// apiQuotation.js

const BASE_URL = 'http://localhost:3000/api';

export const fetchCustomerList = async () => {
    const response = await fetch(`${BASE_URL}/customers`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลลูกค้าได้');
    return await response.json();
};

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

const createServiceRecord = async (serviceTypeId, item) => {
    const res = await fetch(`${BASE_URL}/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_typeID: serviceTypeId,
            description: item.description,
            quantity: Number(item.quantity) || null,
            unit_quantity: item.unitQuantity || 'trip',
            default_price: Number(item.pricePerUnit) || 0,
            unit: item.unit || 'THB'
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'บันทึก service ไม่สำเร็จ');
    return data.service_id;
};

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

export const createQuotation = async ({ formData, routes, items, grandTotal }) => {
    const route = routes?.[0] || {};
    const consignerId = await saveConsignerIfNeeded(route.origin);
    const consigneeId = await saveConsigneeIfNeeded(route.destination);

    // สร้าง ALL services ก่อน แล้วเก็บ serviceIds
    const serviceIds = [];
    if (items && items.length > 0) {
        for (const item of items) {
            const serviceTypeId = await saveServiceTypeIfNeeded(item.serviceType);
            const serviceId = await createServiceRecord(serviceTypeId, item);
            serviceIds.push(serviceId);
        }
    }

    // สร้าง document พร้อมส่ง service_id ตัวแรก
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

    // สร้าง document_items เชื่อมทุก service กับ document
    for (const serviceId of serviceIds) {
        await createDocItemRecord(newDocumentId, serviceId);
    }

    return docResult;
};

export const updateQuotation = async (documentId, { formData, routes, items, grandTotal }) => {
    const route = routes?.[0] || {};
    const consignerId = await saveConsignerIfNeeded(route.origin);
    const consigneeId = await saveConsigneeIfNeeded(route.destination);

    // ลบ document_items เดิม
    const oldRes = await fetch(`${BASE_URL}/document_items?document_id=${documentId}`);
    const oldItems = await oldRes.json();
    for (const oldItem of oldItems) {
        await fetch(`${BASE_URL}/document_items/${oldItem.document_items_id}`, { method: 'DELETE' });
    }

    // สร้าง services ก่อน แล้วเก็บ serviceIds
    const serviceIds = [];
    if (items && items.length > 0) {
        for (const item of items) {
            const serviceTypeId = await saveServiceTypeIfNeeded(item.serviceType);
            const serviceId = await createServiceRecord(serviceTypeId, item);
            serviceIds.push(serviceId);
        }
    }

    // แก้ไข document พร้อมส่ง service_id ตัวแรก
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

    // สร้าง document_items ใหม่ทุก serviceId
    for (const serviceId of serviceIds) {
        await createDocItemRecord(documentId, serviceId);
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
