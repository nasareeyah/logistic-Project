const BASE_URL = 'http://localhost:3000/api';

export const fetchBookings = async () => {
    const res = await fetch(`${BASE_URL}/bookings`);
    if (!res.ok) throw new Error('ดึงข้อมูลไม่สำเร็จ');
    return await res.json();
};

export const createBooking = async (data) => {
    const res = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'บันทึกไม่สำเร็จ');
    return result;
};

export const updateBooking = async (id, data) => {
    const res = await fetch(`${BASE_URL}/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'แก้ไขไม่สำเร็จ');
    return result;
};

export const deleteBooking = async (id) => {
    const res = await fetch(`${BASE_URL}/bookings/${id}`, {
        method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'ลบไม่สำเร็จ');
    return result;
};

// 1. CUSTOMER ATTACHMENTS (เอกสารเพิ่มเติมจากลูกค้า)
export const uploadCustomerAttachments = async (bookingId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const res = await fetch(`${BASE_URL}/bookings/${bookingId}/customer-attachments`, {
        method: 'POST',
        body: formData
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'อัปโหลดเอกสารลูกค้าไม่สำเร็จ');
    return result;
};

export const deleteCustomerAttachment = async (attachmentId) => {
    const res = await fetch(`${BASE_URL}/customer-attachments/${attachmentId}`, {
        method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'ลบเอกสารลูกค้าไม่สำเร็จ');
    return result;
};

// 2. COMPLETED DO FILES (เอกสารใบ DO เมื่องานเสร็จสิ้น)
export const uploadDoFiles = async (bookingId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const res = await fetch(`${BASE_URL}/bookings/${bookingId}/do-files`, {
        method: 'POST',
        body: formData
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'อัปโหลดไฟล์ DO ไม่สำเร็จ');
    return result;
};

export const deleteDoFile = async (doFileId) => {
    const res = await fetch(`${BASE_URL}/do-files/${doFileId}`, {
        method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'ลบไฟล์ DO ไม่สำเร็จ');
    return result;
};

// Legacy generic attachments aliases
export const uploadAttachments = uploadCustomerAttachments;
export const deleteAttachment = deleteCustomerAttachment;
