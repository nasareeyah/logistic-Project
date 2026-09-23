const BASE_URL = 'http://localhost:3000/api';

export const fetchInvoices = async () => {
    const res = await fetch(`${BASE_URL}/invoices`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้');
    return await res.json();
};

export const fetchInvoiceById = async (id) => {
    const res = await fetch(`${BASE_URL}/invoices/${id}`);
    if (!res.ok) throw new Error('ไม่สามารถดึงรายละเอียดใบแจ้งหนี้ได้');
    return await res.json();
};

export const fetchEligibleBookings = async () => {
    const res = await fetch(`${BASE_URL}/invoices-eligible-bookings`);
    if (!res.ok) throw new Error('ไม่สามารถดึงรายการ Booking ที่พร้อมออกใบแจ้งหนี้ได้');
    return await res.json();
};

export const createInvoice = async (data) => {
    const res = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'สร้างใบแจ้งหนี้ไม่สำเร็จ');
    return result;
};

export const updateInvoice = async (id, data) => {
    const res = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'แก้ไขใบแจ้งหนี้ไม่สำเร็จ');
    return result;
};

export const deleteInvoice = async (id) => {
    const res = await fetch(`${BASE_URL}/invoices/${id}`, {
        method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'ลบใบแจ้งหนี้ไม่สำเร็จ');
    return result;
};

export const fetchAccounts = async () => {
    const res = await fetch(`${BASE_URL}/accounts`);
    if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลบัญชีธนาคารได้');
    return await res.json();
};

export const fetchBanks = async () => {
    const res = await fetch(`${BASE_URL}/banks`);
    if (!res.ok) throw new Error('ไม่สามารถดึงรายชื่อธนาคารได้');
    return await res.json();
};

