const BASE_URL = 'http://localhost:3000/api';

export const fetchReceipts = async () => {
    const res = await fetch(`${BASE_URL}/receipts`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลใบเสร็จรับเงินได้');
    return await res.json();
};

export const fetchReceiptById = async (id) => {
    const res = await fetch(`${BASE_URL}/receipts/${id}`);
    if (!res.ok) throw new Error('ไม่สามารถดึงรายละเอียดใบเสร็จรับเงินได้');
    return await res.json();
};

export const fetchInvoices = async () => {
    const res = await fetch(`${BASE_URL}/invoices`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้');
    return await res.json();
};

export const fetchAccounts = async () => {
    const res = await fetch(`${BASE_URL}/accounts`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลบัญชีธนาคารได้');
    return await res.json();
};

export const createReceipt = async (data) => {
    const res = await fetch(`${BASE_URL}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'สร้างใบเสร็จรับเงินไม่สำเร็จ');
    return result;
};

export const updateReceipt = async (id, data) => {
    const res = await fetch(`${BASE_URL}/receipts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'แก้ไขใบเสร็จรับเงินไม่สำเร็จ');
    return result;
};

export const deleteReceipt = async (id) => {
    const res = await fetch(`${BASE_URL}/receipts/${id}`, {
        method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'ลบใบเสร็จรับเงินไม่สำเร็จ');
    return result;
};
