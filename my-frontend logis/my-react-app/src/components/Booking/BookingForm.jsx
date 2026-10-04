
import React, { useState, useEffect, useRef } from 'react';
import {
  fetchBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  uploadCustomerAttachments,
  deleteCustomerAttachment,
  uploadDoFiles,
  deleteDoFile
} from './apiBooking';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Paperclip,
  Trash2,
  X,
  Upload,
  Download,
  Eye,
  ChevronDown,
  FileCheck,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  UserPlus,
  CheckCircle2,
  FileText,
  FolderOpen,
  Pencil,
  User
} from 'lucide-react';
import './BookingTable.css';
import './BookingWizard.css';
import ActionDropdown from '../Common/ActionDropdown';
import { useLanguage } from '../../context/LanguageContext';

// Helper to decode latin1 mojibake characters back to clean UTF-8 text (e.g. Thai characters)
const decodeAttachmentName = (name) => {
  if (!name) return '';
  try {
    if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(name)) {
      const decoded = decodeURIComponent(escape(name));
      if (decoded) return decoded;
    }
  } catch (e) {}
  return name;
};

export default function BookingForm({ customers = [], cars = [], consigners = [], consignees = [], services = [], documents = [], documentItems = [], fetchData }) {
  const { lang, t, tText, formatDateLocale } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const quotationList = (Array.isArray(documents) ? documents : []).filter(d => d.document_type === 'Quotation');

  // View Mode: 'table' or 'wizard'
  const [viewMode, setViewMode] = useState('table');
  const [editingBooking, setEditingBooking] = useState(null);

  // 1. Customer Documents Modal State (เอกสารเพิ่มเติมจากลูกค้า)
  const [selectedBookingForCustDoc, setSelectedBookingForCustDoc] = useState(null);
  const [isCustDocModalOpen, setIsCustDocModalOpen] = useState(false);
  const [uploadingCustDoc, setUploadingCustDoc] = useState(false);
  const custDocFileInputRef = useRef(null);

  // 2. Completed DO Files Modal State (เอกสารใบ DO ปิดงาน)
  const [selectedBookingForDo, setSelectedBookingForDo] = useState(null);
  const [isDoModalOpen, setIsDoModalOpen] = useState(false);
  const [uploadingDo, setUploadingDo] = useState(false);
  const doFileInputRef = useRef(null);

  // ----------------------------------------------------
  // WIZARD STATE (6 Steps)
  // ----------------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Customer
  const [customerSearch, setCustomerSearch] = useState('');
  const mergedCustomers = Array.isArray(customers) ? customers : [];

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ customer_name: '', contact_person: '', phone: '' });

  // Step 2: Pricing Mode & Service Items
  const [pricingMode, setPricingMode] = useState('quotation'); // 'quotation' | 'custom'
  const [serviceItems, setServiceItems] = useState([
    { id: 1, description: '', quantity: 1, unit: 'trip', unit_price: 0, total: 0 }
  ]);

  const handleServiceItemChange = (idx, field, value) => {
    setServiceItems(prev => {
      const updated = [...prev];
      const currentItem = { ...updated[idx], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const q = field === 'quantity' ? Number(value) || 0 : Number(currentItem.quantity) || 0;
        const p = field === 'unit_price' ? Number(value) || 0 : Number(currentItem.unit_price) || 0;
        currentItem.total = q * p;
      }
      updated[idx] = currentItem;
      return updated;
    });
  };

  const handleAddServiceItem = () => {
    setServiceItems(prev => [
      ...prev,
      { id: Date.now(), description: '', quantity: 1, unit: 'trip', unit_price: 0, total: 0 }
    ]);
  };

  const handleRemoveServiceItem = (idx) => {
    if (serviceItems.length <= 1) return;
    setServiceItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSelectQuotation = (qt) => {
    setSelectedQuotationId(qt.document_id);
    if (qt.service_id) {
      setSelectedServiceId(qt.service_id);
    }
    const matchingItems = (Array.isArray(documentItems) ? documentItems : []).filter(
      di => di.document_id === qt.document_id
    );
    if (matchingItems.length > 0) {
      setServiceItems(matchingItems.map((it, idx) => ({
        id: it.document_items_id || idx + 1,
        description: it.description || it.service_typename || 'Logistics Service',
        quantity: Number(it.item_quantity || 1),
        unit: it.unit || 'trip',
        unit_price: Number(it.unit_price || 0),
        total: (Number(it.item_quantity || 1)) * (Number(it.unit_price || 0))
      })));
    } else {
      const totalVal = Number(qt.grand_total || qt.net_total || 0);
      setServiceItems([{
        id: 1,
        description: qt.remarks || qt.remark || qt.subject || qt.customer_name || 'Logistics Service',
        quantity: 1,
        unit: 'trip',
        unit_price: totalVal,
        total: totalVal
      }]);
    }
  };

  const serviceItemsSubtotal = serviceItems.reduce(
    (acc, it) => acc + (Number(it.total) || 0),
    0
  );

  // Step 3: Cargo
  const [cargoItems, setCargoItems] = useState([
    { inv_no: '', product_name: '', quantity: '1', unit: 'box', weight: '0', wt_unit: 'kg', remark: '' }
  ]);

  // Step 3: Transport (Multiple Senders & Receivers)
  const todayStr = new Date().toISOString().slice(0, 10);

  const emptySender = { company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', pickup_date: todayStr };
  const emptyReceiver = { company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', delivery_date: todayStr };

  const [sendersList, setSendersList] = useState([{ ...emptySender }]);
  const [receiversList, setReceiversList] = useState([{ ...emptyReceiver }]);

  const handleAddSender = () => {
    setSendersList(prev => [...prev, { ...emptySender }]);
  };

  const handleRemoveSender = (index) => {
    if (sendersList.length <= 1) return;
    setSendersList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSenderChange = (index, field, value) => {
    setSendersList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddReceiver = () => {
    setReceiversList(prev => [...prev, { ...emptyReceiver }]);
  };

  const handleRemoveReceiver = (index) => {
    if (receiversList.length <= 1) return;
    setReceiversList(prev => prev.filter((_, i) => i !== index));
  };

  const handleReceiverChange = (index, field, value) => {
    setReceiversList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Step 4: Attachments
  const [wizardAttachedFiles, setWizardAttachedFiles] = useState([]);
  const [wizardNewFiles, setWizardNewFiles] = useState([]);
  const wizardFileInputRef = useRef(null);

  // Truck options derived from DB cars
  const truckOptions = [
    '— Select truck —',
    ...(Array.isArray(cars) ? cars : []).map(c => `${c.car_number} (${c.car_type || 'Truck'})`)
  ];

  // ดึงข้อมูล Bookings ทั้งหมดจากฐานข้อมูลจริง
  const loadBookingsData = async () => {
    try {
      setLoading(true);
      const data = await fetchBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingsData();
  }, []);

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '-';
    return formatDateLocale(dateString);
  };

  const getEffectivePickupDate = (booking) => {
    if (booking.pickup_date) return booking.pickup_date;
    const senders = booking.sender_details;
    if (Array.isArray(senders) && senders.length > 0) {
      return senders[0]?.pickup_date || senders[0]?.sender_date || senders[0]?.date;
    }
    if (senders && typeof senders === 'object') {
      return senders.pickup_date || senders.sender_date || senders.date;
    }
    return null;
  };

  const getEffectiveDeliveryDate = (booking) => {
    if (booking.delivery_date) return booking.delivery_date;
    const receivers = booking.receiver_details;
    if (Array.isArray(receivers) && receivers.length > 0) {
      return receivers[0]?.delivery_date || receivers[0]?.receiver_date || receivers[0]?.date;
    }
    if (receivers && typeof receivers === 'object') {
      return receivers.delivery_date || receivers.receiver_date || receivers.date;
    }
    return null;
  };

  // Inline Truck update handler
  const handleTruckChange = async (bookingId, selectedCarId) => {
    const selectedCar = (Array.isArray(cars) ? cars : []).find(c => c.car_id === selectedCarId);
    const carNumber = selectedCar ? selectedCar.car_number : '';

    setBookings(prev => prev.map(b => b.booking_id === bookingId ? {
      ...b,
      car_id: selectedCarId || null,
      car_number: carNumber || null
    } : b));

    try {
      await updateBooking(bookingId, {
        car_id: selectedCarId || null,
        truck_name: carNumber || null
      });
    } catch (err) {
      console.error('Error updating truck assignment:', err);
    }
  };

  // Open 6-Step Wizard for Create
  const handleOpenCreateWizard = () => {
    setEditingBooking(null);
    setSelectedCustomer(null);
    setSelectedServiceId('');
    setSelectedQuotationId('');
    setPricingMode('quotation');
    setServiceItems([
      { id: 1, description: '', quantity: 1, unit: 'trip', unit_price: 0, total: 0 }
    ]);
    setCargoItems([{ inv_no: '', product_name: '', quantity: '1', unit: 'box', weight: '0', wt_unit: 'kg', remark: '' }]);
    setSendersList([{ company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', pickup_date: todayStr }]);
    setReceiversList([{ company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', delivery_date: todayStr }]);
    setWizardAttachedFiles([]);
    setWizardNewFiles([]);
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Open 6-Step Wizard for Edit
  const handleOpenEditWizard = (booking) => {
    setEditingBooking(booking);
    setSelectedServiceId(booking.service_id || '');

    if (booking.quotation_id) {
      setPricingMode('quotation');
      setSelectedQuotationId(booking.quotation_id);
    } else {
      setPricingMode('custom');
      setSelectedQuotationId('');
    }

    if (Array.isArray(booking.service_items) && booking.service_items.length > 0) {
      setServiceItems(booking.service_items.map((it, idx) => ({
        id: it.id || idx + 1,
        description: it.description || '',
        quantity: it.quantity || 1,
        unit: it.unit || 'trip',
        unit_price: it.unit_price || 0,
        total: it.total || ((it.quantity || 1) * (it.unit_price || 0))
      })));
    } else if (booking.service_name || booking.service_typename) {
      setServiceItems([{
        id: 1,
        description: booking.service_name || booking.service_typename || '',
        quantity: 1,
        unit: 'trip',
        unit_price: 0,
        total: 0
      }]);
    } else {
      setServiceItems([
        { id: 1, description: '', quantity: 1, unit: 'trip', unit_price: 0, total: 0 }
      ]);
    }

    const matchCust = mergedCustomers.find(c => c.customer_name === booking.customer_name);
    setSelectedCustomer(matchCust || { customer_name: booking.customer_name || '', contact_person: '', phone: '' });

    setCargoItems(Array.isArray(booking.cargo_details) ? booking.cargo_details.map(c => ({
      inv_no: c.inv_no || '',
      product_name: c.product_name || '',
      quantity: c.quantity || '1',
      unit: c.unit || 'box',
      weight: c.weight || '0',
      wt_unit: c.wt_unit || 'kg',
      remark: c.remark || ''
    })) : [
      { inv_no: '', product_name: '', quantity: '1', unit: 'box', weight: '0', wt_unit: 'kg', remark: '' }
    ]);

    // Parse sender_details if array or single object
    if (Array.isArray(booking.sender_details) && booking.sender_details.length > 0) {
      setSendersList(booking.sender_details);
    } else if (booking.sender_details && typeof booking.sender_details === 'object') {
      setSendersList([{
        company_name: booking.sender_details.sender_name || booking.sender_details.company_name || '',
        address_line: booking.sender_details.sender_address || booking.sender_details.address_line || '',
        city: booking.sender_details.sender_city || booking.sender_details.city || '',
        state: booking.sender_details.sender_state || booking.sender_details.state || '',
        postal_code: booking.sender_details.sender_postal || booking.sender_details.postal_code || '',
        country: booking.sender_details.sender_country || booking.sender_details.country || '',
        pickup_date: booking.pickup_date ? new Date(booking.pickup_date).toISOString().slice(0, 10) : todayStr
      }]);
    } else {
      setSendersList([{ company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', pickup_date: todayStr }]);
    }

    // Parse receiver_details if array or single object
    if (Array.isArray(booking.receiver_details) && booking.receiver_details.length > 0) {
      setReceiversList(booking.receiver_details);
    } else if (booking.receiver_details && typeof booking.receiver_details === 'object') {
      setReceiversList([{
        company_name: booking.receiver_details.receiver_name || booking.receiver_details.company_name || '',
        address_line: booking.receiver_details.receiver_address || booking.receiver_details.address_line || '',
        city: booking.receiver_details.receiver_city || booking.receiver_details.city || '',
        state: booking.receiver_details.receiver_state || booking.receiver_details.state || '',
        postal_code: booking.receiver_details.receiver_postal || booking.receiver_details.postal_code || '',
        country: booking.receiver_details.receiver_country || booking.receiver_details.country || '',
        delivery_date: booking.delivery_date ? new Date(booking.delivery_date).toISOString().slice(0, 10) : todayStr
      }]);
    } else {
      setReceiversList([{ company_name: '', address_line: '', city: '', state: '', postal_code: '', country: '', delivery_date: todayStr }]);
    }

    setWizardAttachedFiles(booking.customer_attachments || booking.attachments || []);
    setWizardNewFiles([]);
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Open Summary View (Read Only Details) when clicking Booking # link
  const handleOpenSummaryView = (booking) => {
    handleOpenEditWizard(booking);
    setCurrentStep(6);
    setViewMode('summary');
  };

  // Delete Booking
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm(lang === 'th' ? 'คุณต้องการลบ Booking นี้ใช่หรือไม่?' : 'Are you sure you want to delete this booking?')) return;
    try {
      await deleteBooking(bookingId);
      alert(lang === 'th' ? 'ลบสำเร็จ' : 'Deleted successfully');
      await loadBookingsData();
      if (fetchData) fetchData();
    } catch (err) {
      alert((lang === 'th' ? 'เกิดข้อผิดพลาดในการลบ: ' : 'Error deleting booking: ') + err.message);
    }
  };

  // ----------------------------------------------------
  // 1. CUSTOMER DOCUMENTS MODAL HANDLERS
  // ----------------------------------------------------
  const handleOpenCustDocModal = (booking) => {
    setSelectedBookingForCustDoc(booking);
    setIsCustDocModalOpen(true);
  };

  const handleCustDocSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (!selectedBookingForCustDoc) return;

      try {
        setUploadingCustDoc(true);
        const resData = await uploadCustomerAttachments(selectedBookingForCustDoc.booking_id, files);
        alert(resData.message || (lang === 'th' ? 'แนบเอกสารลูกค้าสำเร็จ' : 'Customer documents attached successfully'));
        await loadBookingsData();

        if (resData.attachments) {
          setSelectedBookingForCustDoc(prev => ({
            ...prev,
            customer_attachments: [...(prev.customer_attachments || []), ...resData.attachments]
          }));
        }
      } catch (err) {
        alert((lang === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message);
      } finally {
        setUploadingCustDoc(false);
      }
    }
  };

  const handleCustDocDragOver = (e) => {
    e.preventDefault();
  };

  const handleCustDocDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (!selectedBookingForCustDoc) return;

      try {
        setUploadingCustDoc(true);
        const resData = await uploadCustomerAttachments(selectedBookingForCustDoc.booking_id, files);
        alert(resData.message || (lang === 'th' ? 'แนบเอกสารลูกค้าสำเร็จ' : 'Customer documents attached successfully'));
        await loadBookingsData();

        if (resData.attachments) {
          setSelectedBookingForCustDoc(prev => ({
            ...prev,
            customer_attachments: [...(prev.customer_attachments || []), ...resData.attachments]
          }));
        }
      } catch (err) {
        alert((lang === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message);
      } finally {
        setUploadingCustDoc(false);
      }
    }
  };

  const handleDeleteCustDoc = async (attachmentId) => {
    if (!window.confirm(lang === 'th' ? 'ยืนยันลบเอกสารลูกค้านี้?' : 'Are you sure you want to delete this customer document?')) return;
    try {
      const resData = await deleteCustomerAttachment(attachmentId);
      alert(resData.message || (lang === 'th' ? 'ลบเอกสารสำเร็จ' : 'Document deleted successfully'));
      setSelectedBookingForCustDoc(prev => ({
        ...prev,
        customer_attachments: (prev.customer_attachments || []).filter(a => a.attachment_id !== attachmentId)
      }));
      await loadBookingsData();
    } catch (err) {
      alert((lang === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message);
    }
  };

  // ----------------------------------------------------
  // 2. COMPLETED DO FILES MODAL HANDLERS
  // ----------------------------------------------------
  const handleOpenDoModal = (booking) => {
    setSelectedBookingForDo(booking);
    setIsDoModalOpen(true);
  };

  const handleDoFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (!selectedBookingForDo) return;

      try {
        setUploadingDo(true);
        const resData = await uploadDoFiles(selectedBookingForDo.booking_id, files);
        alert(resData.message || (lang === 'th' ? 'แนบไฟล์ DO สำเร็จ' : 'DO files attached successfully'));
        await loadBookingsData();

        if (resData.do_files) {
          setSelectedBookingForDo(prev => ({
            ...prev,
            do_files: [...(prev.do_files || []), ...resData.do_files]
          }));
        }
      } catch (err) {
        alert((lang === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message);
      } finally {
        setUploadingDo(false);
      }
    }
  };

  const handleDoDragOver = (e) => {
    e.preventDefault();
  };

  const handleDoDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (!selectedBookingForDo) return;

      try {
        setUploadingDo(true);
        const resData = await uploadDoFiles(selectedBookingForDo.booking_id, files);
        alert(resData.message || (lang === 'th' ? 'แนบไฟล์ DO สำเร็จ' : 'DO files attached successfully'));
        await loadBookingsData();

        if (resData.do_files) {
          setSelectedBookingForDo(prev => ({
            ...prev,
            do_files: [...(prev.do_files || []), ...resData.do_files]
          }));
        }
      } catch (err) {
        alert((lang === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message);
      } finally {
        setUploadingDo(false);
      }
    }
  };

  const handleDeleteDoFile = async (doFileId) => {
    if (!window.confirm(lang === 'th' ? 'ยืนยันลบไฟล์ DO นี้?' : 'Are you sure you want to delete this DO file?')) return;
    try {
      const resData = await deleteDoFile(doFileId);
      alert(resData.message || (lang === 'th' ? 'ลบไฟล์ DO สำเร็จ' : 'DO file deleted successfully'));
      setSelectedBookingForDo(prev => ({
        ...prev,
        do_files: (prev.do_files || []).filter(f => f.do_file_id !== doFileId)
      }));
      await loadBookingsData();
    } catch (err) {
      alert((lang === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message);
    }
  };

  // WIZARD FINAL SUBMIT
  const handleWizardSubmit = async () => {
    setSaving(true);
    try {
      const autoBookingNo = editingBooking?.booking_no || '';

      const firstDesc = serviceItems?.[0]?.description?.trim() || '';
      const payload = {
        booking_no: autoBookingNo,
        customer_id: selectedCustomer?.customer_id || null,
        customer_name: selectedCustomer?.customer_name || 'Unassigned Customer',
        pickup_date: sendersList[0]?.pickup_date || todayStr,
        delivery_date: receiversList[0]?.delivery_date || todayStr,
        truck_name: editingBooking?.truck_name || '— Select truck —',
        status: editingBooking?.status || 'Active',
        service_id: pricingMode === 'quotation' ? (selectedServiceId || null) : null,
        service_typename: firstDesc || (pricingMode === 'custom' ? 'ค่าขนส่ง' : ''),
        quotation_id: pricingMode === 'quotation' ? (selectedQuotationId || null) : null,
        cargo_details: cargoItems,
        sender_details: sendersList,
        receiver_details: receiversList,
        service_items: serviceItems,
        pricing_mode: pricingMode
      };

      let bookingId = editingBooking?.booking_id;

      if (editingBooking) {
        await updateBooking(bookingId, payload);
      } else {
        const resData = await createBooking(payload);
        bookingId = resData.booking_id;
      }

      if (wizardNewFiles.length > 0 && bookingId) {
        await uploadCustomerAttachments(bookingId, wizardNewFiles);
      }

      alert(editingBooking ? (lang === 'th' ? 'แก้ไข Booking สำเร็จ' : 'Booking updated successfully') : (lang === 'th' ? 'สร้าง Booking สำเร็จ' : 'Booking created successfully'));
      setViewMode('table');
      await loadBookingsData();
      if (fetchData) fetchData();
    } catch (err) {
      alert((lang === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter Bookings by Search Input
  const filteredBookings = bookings.filter(booking => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return true;
    const bNo = (booking.booking_no || '').toLowerCase();
    const cust = (booking.customer_name || '').toLowerCase();
    const truck = (booking.truck_name || '').toLowerCase();
    const custAtts = (booking.customer_attachments || booking.attachments || []).map(a => (a.original_name || a.file_name || '').toLowerCase()).join(' ');
    const doFiles = (booking.do_files || []).map(a => (a.original_name || a.file_name || '').toLowerCase()).join(' ');
    return bNo.includes(q) || cust.includes(q) || truck.includes(q) || custAtts.includes(q) || doFiles.includes(q);
  });

  const stepsList = [
    { num: 1, label: tText('ข้อมูลลูกค้า', 'Customer') },
    { num: 2, label: tText('ใบเสนอราคา/ราคา', 'Quotation') },
    { num: 3, label: tText('ข้อมูลสินค้า', 'Cargo') },
    { num: 4, label: tText('เส้นทาง/สถานที่', 'Route') },
    { num: 5, label: tText('เอกสารจากลูกค้า', 'Customer Docs') },
    { num: 6, label: tText('ตรวจสอบและยืนยัน', 'Review') }
  ];

  // ----------------------------------------------------
  // RENDER 5-STEP WIZARD VIEW MODE
  // ----------------------------------------------------
  if (viewMode === 'wizard') {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Back link */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0 }}
          >
            <ArrowLeft size={16} />
            <span>{tText('ย้อนกลับไปหน้ารายการจอง', 'Back to bookings')}</span>
          </button>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '24px', textAlign: 'left' }}>
          {editingBooking ? tText('แก้ไขรายการจอง (Edit Booking)', 'Edit Booking') : tText('สร้างรายการจองรถใหม่ (New Booking)', 'Create New Booking')}
        </h2>

        {/* Main Card Panel */}
        <div className="dashboard-card-panel" style={{ padding: '32px' }}>

          {/* Stepper Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', overflowX: 'auto', paddingBottom: '8px' }}>
            {stepsList.map((step, idx) => {
              const isCompleted = step.num < currentStep;
              const isActive = step.num === currentStep;

              return (
                <div
                  key={step.num}
                  onClick={() => {
                    if (step.num > 1 && !selectedCustomer) {
                      alert(lang === 'th' ? 'กรุณาเลือกลูกค้าก่อนดำเนินการต่อ' : 'Please select a customer before continuing');
                      return;
                    }
                    setCurrentStep(step.num);
                  }}
                  style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '160px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Step Circle */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      backgroundColor: isCompleted || isActive ? '#0284c7' : '#f1f5f9',
                      color: isCompleted || isActive ? '#ffffff' : '#64748b',
                      border: isCompleted || isActive ? 'none' : '1px solid #cbd5e1'
                    }}>
                      {isCompleted ? <Check size={18} /> : step.num}
                    </div>
                    {/* Step Label */}
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#0f172a' : isCompleted ? '#334155' : '#94a3b8',
                      whiteSpace: 'nowrap'
                    }}>
                      {step.label}
                    </span>
                  </div>

                  {/* Line connector between steps */}
                  {idx < stepsList.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: step.num < currentStep ? '#0284c7' : '#e2e8f0',
                      margin: '0 12px',
                      minWidth: '20px'
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* STEP 1: SELECT CUSTOMER */}
          {currentStep === 1 && (
            <div className="wizard-step-body">
              <div className="step-header-title-row">
                <User size={18} color="#0284c7" />
                <span>{tText('เลือกลูกค้า', 'Select Customer')}</span>
              </div>

              <div className="customer-search-field-container">
                <Search size={16} className="search-icon-inside" />
                <input
                  type="text"
                  placeholder={tText('ค้นหาตามชื่อบริษัท, ผู้ติดต่อ, เบอร์โทร...', 'Search by company, contact, phone...')}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {mergedCustomers
                  .filter(c => {
                    const q = customerSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (c.customer_name || '').toLowerCase().includes(q) ||
                      (c.contact_person || '').toLowerCase().includes(q) ||
                      (c.phone || '').toLowerCase().includes(q);
                  })
                  .map((cust, idx) => {
                    const isSelected = selectedCustomer?.customer_id === cust.customer_id ||
                      (cust.customer_name && selectedCustomer?.customer_name === cust.customer_name);

                    return (
                      <div
                        key={cust.customer_id || idx}
                        className={`single-customer-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedCustomer(cust);
                          const custQts = quotationList.filter(q =>
                            (q.customer_id && q.customer_id === cust.customer_id) ||
                            (q.customer_name && q.customer_name.trim().toLowerCase() === cust.customer_name?.trim().toLowerCase())
                          );
                          if (custQts.length > 0) {
                            handleSelectQuotation(custQts[0]);
                          } else {
                            setSelectedQuotationId('');
                          }
                        }}
                      >
                        <div className="cust-name">{cust.customer_name}</div>
                        <div className="cust-contact">{cust.contact_person || tText('ผู้ติดต่อ', 'Contact Person')}</div>
                        <div className="cust-phone">{cust.phone || tText('เบอร์โทรศัพท์', 'Phone number')}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 2: PRICING MODE & SERVICE ITEMS */}
          {currentStep === 2 && (
            <div className="wizard-step-body">
              <div className="step-header-title-row">
                <FileText size={18} color="#0284c7" />
                <span>{tText('รูปแบบราคา', 'Pricing Mode')}</span>
              </div>

              {/* Pricing Mode Dual Toggle Cards */}
              {(() => {
                const customerQuotations = quotationList.filter(q => {
                  if (!selectedCustomer) return false;
                  return (q.customer_id && q.customer_id === selectedCustomer.customer_id) ||
                         (q.customer_name && selectedCustomer.customer_name && q.customer_name.trim().toLowerCase() === selectedCustomer.customer_name.trim().toLowerCase());
                });

                return (
                  <div>
                    <div className="pricing-mode-cards-grid">
                      {/* Option 1: เลือกจากใบเสนอราคา */}
                      <div
                        className={`pricing-mode-toggle-card ${pricingMode === 'quotation' ? 'active' : ''}`}
                        onClick={() => {
                          setPricingMode('quotation');
                          if (!selectedQuotationId && customerQuotations.length > 0) {
                            handleSelectQuotation(customerQuotations[0]);
                          }
                        }}
                      >
                        <div className="pricing-mode-icon-circle">
                          <FileText size={18} />
                        </div>
                        <div className="pricing-mode-text-wrap">
                          <div className="pricing-mode-title-row">
                            <span>{tText('เลือกจากใบเสนอราคา', 'Select from Quotation')}</span>
                            {pricingMode === 'quotation' && <Check size={16} color="#0284c7" />}
                          </div>
                          <span className="pricing-mode-subtitle">{tText('เลือกใบเสนอราคาที่เคยทำไว้', 'Select an existing quotation')}</span>
                        </div>
                      </div>

                      {/* Option 2: กำหนดราคาเอง */}
                      <div
                        className={`pricing-mode-toggle-card ${pricingMode === 'custom' ? 'active' : ''}`}
                        onClick={() => {
                          setPricingMode('custom');
                          setSelectedQuotationId('');
                        }}
                      >
                        <div className="pricing-mode-icon-circle">
                          <Pencil size={18} />
                        </div>
                        <div className="pricing-mode-text-wrap">
                          <div className="pricing-mode-title-row">
                            <span>{tText('กำหนดราคาเอง', 'Custom Pricing')}</span>
                            {pricingMode === 'custom' && <Check size={16} color="#0284c7" />}
                          </div>
                          <span className="pricing-mode-subtitle">{tText('งานด่วน ยังไม่มีใบเสนอ', 'Urgent job, no quotation yet')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quotation Cards in Quotation Mode */}
                    {pricingMode === 'quotation' && (
                      <div>
                        {customerQuotations.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {customerQuotations.map(qt => {
                              const isSelected = selectedQuotationId === qt.document_id;
                              const qtItems = (Array.isArray(documentItems) ? documentItems : []).filter(di => di.document_id === qt.document_id);
                              const itemCount = qtItems.length > 0 ? qtItems.length : 1;
                              const totalAmount = qt.grand_total || qt.net_total || 0;

                              return (
                                <div
                                  key={qt.document_id}
                                  className="selected-quotation-card"
                                  style={{
                                    cursor: 'pointer',
                                    borderColor: isSelected ? '#0284c7' : '#e2e8f0',
                                    backgroundColor: isSelected ? '#f8fafc' : '#ffffff'
                                  }}
                                  onClick={() => handleSelectQuotation(qt)}
                                >
                                  <div className="qt-top-row">
                                    <span className="qt-code">{qt.document_no || qt.document_id}</span>
                                    <span className="qt-status-badge">
                                      <span className="qt-status-dot" style={{ backgroundColor: qt.status === 'Approved' ? '#16a34a' : '#94a3b8' }} />
                                      <span>{qt.status || 'Draft'}</span>
                                    </span>
                                  </div>
                                  <div className="qt-remark">
                                    {qt.remarks || qt.remark || qt.subject || tText('ใบเสนอราคาบริการขนส่ง', 'Freight Quotation')}
                                  </div>
                                  <div className="qt-summary">
                                    {itemCount} {tText('รายการ', 'items')} · THB {Number(totalAmount).toLocaleString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{
                            padding: '16px 20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <AlertCircle size={20} color="#0284c7" />
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              {tText(
                                'ลูกค้ารายนี้ยังไม่มีประวัติใบเสนอราคาในระบบ ท่านสามารถเลือกโหมด "กำหนดราคาเอง" เพื่อระบุรายการบริการได้ทันที',
                                'This customer does not have any quotations in the system yet. You can choose "Custom Pricing" mode to enter services immediately.'
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Service Items Table (Rendered in BOTH Modes) */}
                    <div className="service-items-container">
                      <div className="service-items-header-bar">
                        <span className="service-items-header-title">{tText('รายการบริการ', 'Service Items')}</span>
                        <button
                          type="button"
                          className="btn-add-service-item"
                          onClick={handleAddServiceItem}
                        >
                          <Plus size={15} />
                          <span>{tText('เพิ่มรายการ', 'Add Item')}</span>
                        </button>
                      </div>

                      <div className="service-items-table-wrap">
                        <div className="service-items-table-grid">
                          <div className="service-items-cols-header">
                            <div>{tText('รายละเอียดบริการ', 'Description')}</div>
                            <div style={{ textAlign: 'center' }}>{tText('จำนวน', 'Qty')}</div>
                            <div style={{ textAlign: 'center' }}>{tText('หน่วย', 'Unit')}</div>
                            <div style={{ textAlign: 'right' }}>{tText('ราคา/หน่วย', 'Unit Price')}</div>
                            <div style={{ textAlign: 'right' }}>{tText('รวมเงิน', 'Total')}</div>
                            <div></div>
                          </div>

                          {serviceItems.map((item, idx) => (
                            <div key={item.id || idx} className="service-item-row-input">
                              <div className="col-desc">
                                <input
                                  type="text"
                                  placeholder={tText('รายละเอียดบริการ', 'Description')}
                                  value={item.description}
                                  onChange={(e) => handleServiceItemChange(idx, 'description', e.target.value)}
                                />
                              </div>
                              <div className="col-qty">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleServiceItemChange(idx, 'quantity', e.target.value)}
                                />
                              </div>
                              <div className="col-unit">
                                <input
                                  type="text"
                                  placeholder={tText('เที่ยว', 'trip')}
                                  value={item.unit}
                                  onChange={(e) => handleServiceItemChange(idx, 'unit', e.target.value)}
                                />
                              </div>
                              <div className="col-price">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={item.unit_price}
                                  onChange={(e) => handleServiceItemChange(idx, 'unit_price', e.target.value)}
                                />
                              </div>
                              <div className="col-total">
                                {Number(item.total || 0).toLocaleString()}
                              </div>
                              <div className="col-action">
                                {serviceItems.length > 1 && (
                                  <button
                                    type="button"
                                    className="btn-remove-item"
                                    onClick={() => handleRemoveServiceItem(idx)}
                                    title={tText('ลบรายการ', 'Remove item')}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Subtotal Row */}
                        <div className="service-subtotal-row">
                          <span className="service-subtotal-label">{tText('ยอดรวม', 'Subtotal')}</span>
                          <span className="service-subtotal-amount">
                            THB {serviceItemsSubtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 3: CARGO INFORMATION */}
          {currentStep === 3 && (
            <div className="wizard-step-body">
              <div className="step-header-with-action">
                <h2 className="step-section-heading">{tText('ข้อมูลสินค้า / สินค้าบรรทุก', 'Cargo Information')}</h2>
                <button type="button" className="btn-outline-action" onClick={() => setCargoItems(prev => [...prev, { inv_no: '', product_name: '', quantity: '1', unit: 'box', weight: '0', wt_unit: 'kg', remark: '' }])}>
                  <Plus size={16} />
                  <span>{tText('เพิ่มรายการสินค้า', 'Add Item')}</span>
                </button>
              </div>

              <div className="cargo-items-container">
                {cargoItems.map((item, idx) => (
                  <div key={idx} className="cargo-item-row-form">
                    <div className="cargo-field col-inv">
                      <label>INV.No</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 100234"
                        value={item.inv_no || ''}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].inv_no = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-product">
                      <label>{tText('ชื่อสินค้า', 'Product Name')}</label>
                      <input
                        type="text"
                        placeholder={tText('เช่น ชิ้นส่วนพลาสติก', 'e.g. plastics')}
                        value={item.product_name}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].product_name = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-qty">
                      <label>{tText('จำนวน', 'Quantity')}</label>
                      <input
                        type="number"
                        placeholder="500"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].quantity = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-unit">
                      <label>{tText('หน่วย', 'Unit')}</label>
                      <input
                        type="text"
                        placeholder="tun"
                        value={item.unit}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].unit = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-weight">
                      <label>{tText('น้ำหนัก', 'Weight')}</label>
                      <input
                        type="number"
                        placeholder="3000"
                        value={item.weight}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].weight = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    <div className="cargo-field col-wtunit">
                      <label>{tText('หน่วย น.น.', 'Wt Unit')}</label>
                      <select
                        value={item.wt_unit || 'kg'}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].wt_unit = e.target.value;
                          setCargoItems(updated);
                        }}
                      >
                        <option value="kg">kg</option>
                        <option value="ton">ton</option>
                        <option value="g">g</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>

                    <div className="cargo-field col-remark">
                      <label>{tText('หมายเหตุ', 'Remark')}</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={item.remark}
                        onChange={(e) => {
                          const updated = [...cargoItems];
                          updated[idx].remark = e.target.value;
                          setCargoItems(updated);
                        }}
                      />
                    </div>

                    {cargoItems.length > 1 && (
                      <button
                        type="button"
                        className="remove-cargo-btn"
                        onClick={() => setCargoItems(prev => prev.filter((_, i) => i !== idx))}
                        title={tText('ลบรายการสินค้านี้', 'Remove Cargo')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: TRANSPORT */}
          {currentStep === 4 && (
            <div className="wizard-step-body">
              <div className="transport-dual-grid">
                {/* PICKUP (SENDER) COLUMN */}
                <div className="transport-box-card">
                  <div className="box-header-row">
                    <h3>{tText('สถานที่รับสินค้า (ต้นทาง)', 'Pickup (Sender)')}</h3>
                    <button type="button" className="btn-small-add" onClick={handleAddSender}>
                      <Plus size={14} />
                      <span>{tText('เพิ่มจุดรับ', 'Add')}</span>
                    </button>
                  </div>

                  {sendersList.map((sender, idx) => (
                    <div key={idx} className="location-block-card">
                      <div className="location-block-header">
                        <span className="location-block-index">{tText('จุดรับสินค้าที่', 'Pickup Location #')} {idx + 1}</span>
                      </div>

                      <div className="form-group-vertical">
                        <label>{tText('ชื่อบริษัท / ผู้ส่งสินค้า', 'Sender Company Name')}</label>
                        <input
                          type="text"
                          placeholder={tText('ชื่อบริษัท / โรงงาน / คลัง', 'Company name')}
                          value={sender.company_name}
                          onChange={(e) => handleSenderChange(idx, 'company_name', e.target.value)}
                        />
                      </div>

                      <div className="form-group-vertical">
                        <label>{tText('ที่อยู่', 'Address Line')}</label>
                        <input
                          type="text"
                          placeholder={tText('ที่อยู่ / ถนน / ซอย / ตำบล', 'Street address / Location')}
                          value={sender.address_line}
                          onChange={(e) => handleSenderChange(idx, 'address_line', e.target.value)}
                        />
                      </div>

                      <div className="form-row-two-cols">
                        <div className="form-group-vertical">
                          <label>{tText('อำเภอ/เขต', 'City / District')}</label>
                          <input
                            type="text"
                            placeholder={tText('อำเภอ/เขต', 'City')}
                            value={sender.city}
                            onChange={(e) => handleSenderChange(idx, 'city', e.target.value)}
                          />
                        </div>
                        <div className="form-group-vertical">
                          <label>{tText('จังหวัด', 'State / Province')}</label>
                          <input
                            type="text"
                            placeholder={tText('จังหวัด', 'State / Province')}
                            value={sender.state}
                            onChange={(e) => handleSenderChange(idx, 'state', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row-two-cols">
                        <div className="form-group-vertical">
                          <label>{tText('รหัสไปรษณีย์', 'Postal Code')}</label>
                          <input
                            type="text"
                            placeholder={tText('รหัสไปรษณีย์', 'Postal code')}
                            value={sender.postal_code}
                            onChange={(e) => handleSenderChange(idx, 'postal_code', e.target.value)}
                          />
                        </div>
                        <div className="form-group-vertical">
                          <label>{tText('ประเทศ', 'Country')}</label>
                          <input
                            type="text"
                            placeholder={tText('ประเทศ', 'Country')}
                            value={sender.country}
                            onChange={(e) => handleSenderChange(idx, 'country', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group-vertical">
                        <label>{tText('วันที่รับสินค้า', 'Pickup Date')}</label>
                        <input
                          type="date"
                          value={sender.pickup_date || todayStr}
                          onChange={(e) => handleSenderChange(idx, 'pickup_date', e.target.value)}
                        />
                      </div>

                      {sendersList.length > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn-remove-location"
                            onClick={() => handleRemoveSender(idx)}
                          >
                            <Trash2 size={13} />
                            <span>{tText('ลบจุดรับนี้', 'Remove')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* DELIVERY (RECEIVER) COLUMN */}
                <div className="transport-box-card">
                  <div className="box-header-row">
                    <h3>{tText('สถานที่ส่งสินค้า (ปลายทาง)', 'Delivery (Receiver)')}</h3>
                    <button type="button" className="btn-small-add" onClick={handleAddReceiver}>
                      <Plus size={14} />
                      <span>{tText('เพิ่มจุดส่ง', 'Add')}</span>
                    </button>
                  </div>

                  {receiversList.map((receiver, idx) => (
                    <div key={idx} className="location-block-card">
                      <div className="location-block-header">
                        <span className="location-block-index">{tText('จุดส่งสินค้าที่', 'Delivery Location #')} {idx + 1}</span>
                      </div>

                      <div className="form-group-vertical">
                        <label>{tText('ชื่อบริษัท / ผู้รับสินค้า', 'Receiver Company Name')}</label>
                        <input
                          type="text"
                          placeholder={tText('ชื่อบริษัท / โรงงาน / คลัง', 'Company name')}
                          value={receiver.company_name}
                          onChange={(e) => handleReceiverChange(idx, 'company_name', e.target.value)}
                        />
                      </div>

                      <div className="form-group-vertical">
                        <label>{tText('ที่อยู่', 'Address Line')}</label>
                        <input
                          type="text"
                          placeholder={tText('ที่อยู่ / ถนน / ซอย / ตำบล', 'Street address / Location')}
                          value={receiver.address_line}
                          onChange={(e) => handleReceiverChange(idx, 'address_line', e.target.value)}
                        />
                      </div>

                      <div className="form-row-two-cols">
                        <div className="form-group-vertical">
                          <label>{tText('อำเภอ/เขต', 'City / District')}</label>
                          <input
                            type="text"
                            placeholder={tText('อำเภอ/เขต', 'City')}
                            value={receiver.city}
                            onChange={(e) => handleReceiverChange(idx, 'city', e.target.value)}
                          />
                        </div>
                        <div className="form-group-vertical">
                          <label>{tText('จังหวัด', 'State / Province')}</label>
                          <input
                            type="text"
                            placeholder={tText('จังหวัด', 'State / Province')}
                            value={receiver.state}
                            onChange={(e) => handleReceiverChange(idx, 'state', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row-two-cols">
                        <div className="form-group-vertical">
                          <label>{tText('รหัสไปรษณีย์', 'Postal Code')}</label>
                          <input
                            type="text"
                            placeholder={tText('รหัสไปรษณีย์', 'Postal code')}
                            value={receiver.postal_code}
                            onChange={(e) => handleReceiverChange(idx, 'postal_code', e.target.value)}
                          />
                        </div>
                        <div className="form-group-vertical">
                          <label>{tText('ประเทศ', 'Country')}</label>
                          <input
                            type="text"
                            placeholder={tText('ประเทศ', 'Country')}
                            value={receiver.country}
                            onChange={(e) => handleReceiverChange(idx, 'country', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group-vertical">
                        <label>{tText('วันที่ส่งสินค้า', 'Delivery Date')}</label>
                        <input
                          type="date"
                          value={receiver.delivery_date || todayStr}
                          onChange={(e) => handleReceiverChange(idx, 'delivery_date', e.target.value)}
                        />
                      </div>

                      {receiversList.length > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button
                            type="button"
                            className="btn-remove-location"
                            onClick={() => handleRemoveReceiver(idx)}
                          >
                            <Trash2 size={13} />
                            <span>{tText('ลบจุดส่งนี้', 'Remove')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CUSTOMER DOCUMENTS */}
          {currentStep === 5 && (
            <div className="wizard-step-body">
              <h2 className="step-section-heading">{tText('เอกสารเพิ่มเติมจากลูกค้า', 'Additional Customer Documents')}</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-10px', marginBottom: '18px' }}>
                {tText('แนบเอกสารที่ได้รับจากทางบริษัท/ลูกค้าที่มาติดต่อ เช่น ใบสั่งซื้อ (PO), เอกสารเปิดงาน, รายละเอียดสินค้า (PDF, รูปภาพ, Excel)', 'Attach additional documents provided by the customer (e.g. PO, cargo specifications, job order)')}
              </p>

              <div className="attachments-large-dropzone">
                <input
                  type="file"
                  multiple
                  ref={wizardFileInputRef}
                  onChange={(e) => e.target.files && setWizardNewFiles(prev => [...prev, ...Array.from(e.target.files)])}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                />
                <div
                  className="dropzone-inner"
                  onClick={() => wizardFileInputRef.current?.click()}
                >
                  <Upload size={38} className="upload-tray-icon" />
                  <span className="upload-click-title">{tText('คลิกเพื่อเลือกไฟล์เอกสารจากลูกค้า', 'Click to upload customer documents')}</span>
                  <span className="upload-click-sub">{tText('รองรับ PDF, รูปภาพ, Excel, Word, เอกสารทั่วไป', 'Supports PDF, images, Excel, Word, documents')}</span>
                </div>
              </div>

              {(wizardAttachedFiles.length > 0 || wizardNewFiles.length > 0) && (
                <div className="attached-files-list-box">
                  <h4>{tText('ไฟล์เอกสารลูกค้าที่แนบแล้ว:', 'Attached Customer Documents:')}</h4>
                  <ul>
                    {wizardAttachedFiles.map((att, i) => (
                      <li key={`existing-${i}`}>
                        <Paperclip size={14} color="#0284c7" />
                        <span>{decodeAttachmentName(att.original_name) || att.file_name}</span>
                        <small>({tText('มีอยู่ในระบบ', 'Existing')})</small>
                      </li>
                    ))}
                    {wizardNewFiles.map((file, i) => (
                      <li key={`new-${i}`}>
                        <FileText size={14} color="#16a34a" />
                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          className="btn-remove-new-file"
                          onClick={() => setWizardNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: REVIEW */}
          {currentStep === 6 && (
            <div className="wizard-step-body">
              <h2 className="step-section-heading">{tText('ตรวจสอบและยืนยันข้อมูล', 'Review & Confirm')}</h2>

              <div className="review-summary-grid">
                <div className="review-card-item">
                  <span className="review-label">{tText('ลูกค้า', 'CUSTOMER')}</span>
                  <span className="review-value-bold">{selectedCustomer?.customer_name || '-'}</span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">{tText('รูปแบบราคาและใบเสนอราคา', 'PRICING MODE & QUOTATION')}</span>
                  <span className="review-value-bold">
                    {pricingMode === 'quotation'
                      ? (lang === 'th'
                          ? `เลือกจากใบเสนอราคา (${quotationList.find(q => q.document_id === selectedQuotationId)?.document_no || selectedQuotationId || 'ไม่ได้ระบุ'})`
                          : `Quotation Ref (${quotationList.find(q => q.document_id === selectedQuotationId)?.document_no || selectedQuotationId || 'Not specified'})`)
                      : tText('กำหนดราคาเอง (Custom Pricing)', 'Custom Pricing')}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">{tText('รายการบริการ', 'SERVICE ITEMS')}</span>
                  <span className="review-value">
                    {serviceItems.map((it, idx) => (
                      <div key={idx} style={{ marginBottom: '2px' }}>
                        • {it.description || tText('บริการขนส่ง', 'Freight Service')} ({it.quantity} {it.unit}) — THB {Number(it.total || 0).toLocaleString()}
                      </div>
                    ))}
                    <div style={{ marginTop: '4px', fontWeight: 700, color: '#0284c7' }}>
                      {tText('ยอดรวม:', 'Subtotal:')} THB {serviceItemsSubtotal.toLocaleString()}
                    </div>
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">{tText('วันที่จอง/รับสินค้า', 'BOOKING DATE')}</span>
                  <span className="review-value-bold">
                    {formatDateLocale(sendersList[0]?.pickup_date || todayStr)}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">{tText('สินค้าบรรทุก', 'CARGO')}</span>
                  <span className="review-value">
                    {cargoItems.map(c => `${c.inv_no ? `[INV: ${c.inv_no}] ` : ''}${c.product_name || 'cargo'} — ${c.quantity} ${c.unit} (${c.weight} ${c.wt_unit})`).join(', ')}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">{tText('สถานที่รับสินค้า (ต้นทาง)', 'PICKUP (SENDER)')} ({sendersList.length} {tText('จุด', 'Location(s)')})</span>
                  <span className="review-value">
                    {sendersList.map((s, i) => (
                      <div key={i} style={{ marginBottom: '6px' }}>
                        <strong>#{i + 1} {s.company_name || tText('ผู้ส่งสินค้า', 'Sender')}</strong><br />
                        {s.address_line || '-'}<br />
                        {tText('วันที่รับสินค้า', 'Date')}: {s.pickup_date ? formatDateLocale(s.pickup_date) : '-'}
                      </div>
                    ))}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">{tText('สถานที่ส่งสินค้า (ปลายทาง)', 'DELIVERY (RECEIVER)')} ({receiversList.length} {tText('จุด', 'Location(s)')})</span>
                  <span className="review-value">
                    {receiversList.map((r, i) => (
                      <div key={i} style={{ marginBottom: '6px' }}>
                        <strong>#{i + 1} {r.company_name || tText('ผู้รับสินค้า', 'Receiver')}</strong><br />
                        {r.address_line || '-'}<br />
                        {tText('วันที่ส่งสินค้า', 'Date')}: {r.delivery_date ? formatDateLocale(r.delivery_date) : '-'}
                      </div>
                    ))}
                  </span>
                </div>

                <div className="review-card-item">
                  <span className="review-label">{tText('เอกสารแนบ', 'ATTACHMENTS')}</span>
                  <span className="review-value">
                    {wizardAttachedFiles.length + wizardNewFiles.length} {tText('ไฟล์', 'file(s)')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* WIZARD FOOTER NAV */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div>
              <button
                type="button"
                className="btn-secondary"
                disabled={currentStep === 1}
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(prev => prev - 1);
                  else setViewMode('table');
                }}
                style={{
                  opacity: currentStep === 1 ? 0.5 : 1,
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>{t('actionBack', 'ย้อนกลับ')}</span>
              </button>
            </div>

            <div>
              {currentStep < 6 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (currentStep === 1 && !selectedCustomer) {
                      alert(lang === 'th' ? 'กรุณาเลือกลูกค้าก่อนดำเนินการต่อ' : 'Please select a customer before continuing');
                      return;
                    }
                    setCurrentStep(prev => Math.min(6, prev + 1));
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{t('actionNext', 'ถัดไป')}</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={saving}
                  onClick={handleWizardSubmit}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>{saving ? t('actionSaving', 'กำลังบันทึก...') : editingBooking ? tText('บันทึกการแก้ไข', 'Save Changes') : tText('ยืนยันสร้าง Booking', 'Create Booking')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER BOOKING SUMMARY / DETAILS VIEW MODE
  // ----------------------------------------------------
  if (viewMode === 'summary') {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Back link */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0 }}
          >
            <ArrowLeft size={16} />
            <span>{tText('ย้อนกลับไปหน้ารายการจอง', 'Back to bookings')}</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0, textAlign: 'left' }}>
            {tText('สรุปข้อมูลการจอง: ', 'Booking Summary: ')}{editingBooking?.booking_no}
          </h2>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setCurrentStep(1);
              setViewMode('wizard');
            }}
          >
            <Pencil size={16} />
            <span>{tText('แก้ไข Booking', 'Edit Booking')}</span>
          </button>
        </div>

        {/* SUMMARY DETAILS CARD */}
        <div className="dashboard-card-panel" style={{ padding: '32px' }}>
          <div className="wizard-step-body">
            <h2 className="step-section-heading">{tText('รายละเอียดข้อมูลการจองรถขนส่ง', 'Transport Booking Details')}</h2>

            <div className="review-summary-grid">
              <div className="review-card-item">
                <span className="review-label">{tText('เลขที่ Booking', 'BOOKING NUMBER')}</span>
                <span className="review-value-bold">{editingBooking?.booking_no || '-'}</span>
              </div>

              <div className="review-card-item">
                <span className="review-label">{tText('ลูกค้า', 'CUSTOMER')}</span>
                <span className="review-value-bold">{selectedCustomer?.customer_name || editingBooking?.customer_name || '-'}</span>
              </div>

              <div className="review-card-item">
                <span className="review-label">{tText('ใบเสนอราคาอ้างอิง', 'QUOTATION REF')}</span>
                <span className="review-value-bold">
                  {quotationList.find(q => q.document_id === (selectedQuotationId || editingBooking?.quotation_id))?.document_no ||
                   editingBooking?.quotation_no || '-'}
                </span>
              </div>

              <div className="review-card-item">
                <span className="review-label">{tText('บริการ', 'SERVICE')}</span>
                <span className="review-value-bold">
                  {(Array.isArray(services) ? services : []).find(s => s.service_id === (selectedServiceId || editingBooking?.service_id))?.description ||
                   editingBooking?.service_name ||
                   editingBooking?.service_typename ||
                   editingBooking?.service_items?.[0]?.description ||
                   serviceItems?.[0]?.description || '-'}
                </span>
              </div>

              <div className="review-card-item">
                <span className="review-label">{tText('รถบรรทุกที่ได้รับมอบหมาย', 'ASSIGNED TRUCK')}</span>
                <span className="review-value-bold">{editingBooking?.truck_name || tText('— เลือกรถบรรทุก —', '— Select truck —')}</span>
              </div>

              <div className="review-card-item">
                <span className="review-label">{tText('วันที่จอง', 'BOOKING DATE')}</span>
                <span className="review-value-bold">
                  {formatDateLocale(sendersList[0]?.pickup_date || todayStr)}
                </span>
              </div>

              <div className="review-card-item" style={{ gridColumn: 'span 2' }}>
                <span className="review-label">{tText('รายละเอียดสินค้า', 'CARGO DETAILS')}</span>
                <span className="review-value">
                  {cargoItems.map((c, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      📦 {c.inv_no ? <span style={{ color: '#2563eb', fontWeight: 600, marginRight: '6px' }}>[INV: {c.inv_no}]</span> : ''}<strong>{c.product_name || 'Cargo'}</strong> — {tText('จำนวน', 'Quantity')}: {c.quantity} {c.unit} | {tText('น้ำหนัก', 'Weight')}: {c.weight} {c.wt_unit} {c.remark ? `(${tText('หมายเหตุ', 'Remark')}: ${c.remark})` : ''}
                    </div>
                  ))}
                </span>
              </div>

              <div className="review-card-item">
                <span className="review-label">{tText('สถานที่รับสินค้า (ต้นทาง)', 'PICKUP LOCATIONS (SENDER)')} ({sendersList.length})</span>
                <span className="review-value">
                  {sendersList.map((s, i) => (
                    <div key={i} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: i < sendersList.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                      <strong>#{i + 1} {s.company_name || tText('ผู้ส่งสินค้า', 'Sender Company')}</strong><br />
                      {s.address_line || '-'}<br />
                      {s.city ? `${s.city}, ` : ''}{s.state ? `${s.state} ` : ''}{s.postal_code || ''} {s.country || ''}<br />
                      {tText('วันที่รับสินค้า', 'Pickup Date')}: {s.pickup_date ? formatDateLocale(s.pickup_date) : '-'}
                    </div>
                  ))}
                </span>
              </div>

              <div className="review-card-item">
                <span className="review-label">{tText('สถานที่ส่งสินค้า (ปลายทาง)', 'DELIVERY LOCATIONS (RECEIVER)')} ({receiversList.length})</span>
                <span className="review-value">
                  {receiversList.map((r, i) => (
                    <div key={i} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: i < receiversList.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                      <strong>#{i + 1} {r.company_name || tText('ผู้รับสินค้า', 'Receiver Company')}</strong><br />
                      {r.address_line || '-'}<br />
                      {r.city ? `${r.city}, ` : ''}{r.state ? `${r.state} ` : ''}{r.postal_code || ''} {r.country || ''}<br />
                      {tText('วันที่ส่งสินค้า', 'Delivery Date')}: {r.delivery_date ? formatDateLocale(r.delivery_date) : '-'}
                    </div>
                  ))}
                </span>
              </div>

              <div className="review-card-item" style={{ gridColumn: 'span 2' }}>
                <span className="review-label">{tText('เอกสารเพิ่มเติมจากลูกค้า', 'CUSTOMER DOCUMENTS')} ({wizardAttachedFiles.length + wizardNewFiles.length})</span>
                <span className="review-value">
                  {wizardAttachedFiles.length === 0 && wizardNewFiles.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>{tText('ไม่มีเอกสารเพิ่มเติมจากลูกค้า', 'No customer documents for this booking.')}</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                      {wizardAttachedFiles.map((att, i) => (
                        <a
                          key={i}
                          href={`http://localhost:3000${att.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attached-preview-chip"
                          style={{ textDecoration: 'none' }}
                        >
                          <Paperclip size={13} className="chip-paperclip-icon" />
                          <span>{decodeAttachmentName(att.original_name) || att.file_name}</span>
                          <Eye size={13} className="chip-eye-icon" />
                        </a>
                      ))}
                      {wizardNewFiles.map((file, i) => (
                        <div key={`new-${i}`} className="attached-preview-chip" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
                          <FileText size={13} style={{ color: '#16a34a' }} />
                          <span>{file.name}</span>
                          <small>({tText('ใหม่', 'New')})</small>
                        </div>
                      ))}
                    </div>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #e2e8f0', marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode('table')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} />
              <span>{tText('ย้อนกลับไปหน้ารายการจอง', 'Back to bookings')}</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setCurrentStep(1);
                setViewMode('wizard');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Pencil size={16} />
              <span>{tText('แก้ไข Booking', 'Edit Booking')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER MAIN TABLE VIEW MODE
  // ----------------------------------------------------
  return (
    <div>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="dashboard-view-title" style={{ marginBottom: '4px' }}>{t('bookingPageTitle', 'การจองรถขนส่ง (Booking)')}</h2>
          <p className="dashboard-view-subtitle" style={{ margin: 0 }}>{t('bookingPageSubtitle', 'จัดการรายการจองรถขนส่ง ตารางงาน และสถานะการจัดส่ง')}</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateWizard}>
          <Plus size={16} />
          <span>{t('bookingCreateBtn', 'สร้าง Booking ใหม่')}</span>
        </button>
      </div>

      {/* Table Panel */}
      <div className="dashboard-card-panel" style={{ padding: '24px 0 0 0' }}>
        <div style={{ padding: '0 24px' }}>
          <div className="panel-search-bar">
            <Search size={16} className="panel-search-icon" />
            <input
              type="text"
              placeholder={t('bookingSearchPlaceholder', 'ค้นหาตามเลขที่ Booking, ลูกค้า, พนักงานขับรถ...')}
              className="panel-search-input"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive-wrapper"> 
          <table className="custom-clean-table">
            <thead>
              <tr>
                <th style={{ width: '12%', paddingLeft: '24px', whiteSpace: 'nowrap' }}>{t('bookingColNo', 'Booking #')}</th>
                <th style={{ width: '14%', whiteSpace: 'nowrap' }}>{t('bookingColCustomer', 'ลูกค้า')}</th>
                <th style={{ width: '13%', whiteSpace: 'nowrap' }}>{t('bookingColService', 'บริการขนส่ง')}</th>
                <th style={{ width: '11%', whiteSpace: 'nowrap' }}>{t('bookingColPickupDate', 'วันที่ขึ้นของ (Pickup)')}</th>
                <th style={{ width: '11%', whiteSpace: 'nowrap' }}>{t('bookingColDeliveryDate', 'วันที่ส่งมอบ (Delivery)')}</th>
                <th style={{ width: '13%', whiteSpace: 'nowrap' }}>{t('bookingColTruck', 'รถบรรทุก')}</th>
                <th style={{ width: '13%', whiteSpace: 'nowrap' }}>{tText('เอกสารจากลูกค้า', 'Customer Docs')}</th>
                <th style={{ width: '13%', whiteSpace: 'nowrap' }}>{tText('เอกสารใบ DO ปิดงาน', 'Signed DO (POD)')}</th>
                <th style={{ width: '8%', textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>{t('bookingColActions', 'จัดการ')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    ⏳ {tText('กำลังโหลดข้อมูลการจอง...', 'Loading bookings...')}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const custDocs = booking.customer_attachments || booking.attachments || [];
                  const doDocs = booking.do_files || [];

                  return (
                    <tr key={booking.booking_id}>
                      {/* Booking # */}
                      <td style={{ paddingLeft: '24px', fontWeight: '600', color: '#0284c7', whiteSpace: 'nowrap' }}>
                        <span
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenSummaryView(booking)}
                          title={tText('คลิกเพื่อดูสรุปรายละเอียดการจอง', 'Click to view booking summary')}
                        >
                          {booking.booking_no}
                        </span>
                      </td>

                      {/* Customer */}
                      <td style={{ color: '#334155', whiteSpace: 'nowrap' }}>
                        {booking.customer_name || '-'}
                      </td>

                      {/* Service */}
                      <td style={{ color: '#334155', whiteSpace: 'nowrap' }}>
                        {booking.service_name || booking.service_typename || booking.service_items?.[0]?.description || '-'}
                      </td>

                      {/* Pickup Date */}
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDateDisplay(getEffectivePickupDate(booking))}
                      </td>

                      {/* Delivery Date */}
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDateDisplay(getEffectiveDeliveryDate(booking))}
                      </td>

                      {/* Truck Select Dropdown */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="truck-select-container">
                          <select
                            className="truck-select-input"
                            value={booking.car_id || ''}
                            onChange={(e) => handleTruckChange(booking.booking_id, e.target.value)}
                          >
                            <option value="">{tText('— เลือกรถบรรทุก —', '— Select truck —')}</option>
                            {(Array.isArray(cars) ? cars : []).map((car) => (
                              <option key={car.car_id} value={car.car_id}>
                                {car.car_number}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="truck-select-arrow" />
                        </div>
                      </td>

                      {/* 1. CUSTOMER DOCUMENTS (เอกสารเพิ่มเติมจากลูกค้า) */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {custDocs.length > 0 ? (
                          <div
                            className="attached-preview-chip"
                            onClick={() => handleOpenCustDocModal(booking)}
                            title={tText('คลิกเพื่อดูเอกสารเพิ่มเติมจากลูกค้า', 'Click to view customer documents')}
                          >
                            <Paperclip size={13} className="chip-paperclip-icon" />
                            <span className="chip-filename-text">
                              {decodeAttachmentName(custDocs[0]?.original_name) || custDocs[0]?.file_name}
                            </span>
                            {custDocs.length > 1 && (
                              <span className="chip-count-badge">+{custDocs.length - 1}</span>
                            )}
                            <Eye size={13} className="chip-eye-icon" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="attach-do-ghost-btn"
                            onClick={() => handleOpenCustDocModal(booking)}
                            title={tText('แนบเอกสารเพิ่มเติมจากลูกค้า', 'Attach customer document')}
                          >
                            <Paperclip size={13} />
                            <span>{tText('+ แนบเอกสาร', '+ Attach')}</span>
                          </button>
                        )}
                      </td>

                      {/* 2. COMPLETED DO FILES (เอกสารใบ DO ปิดงาน) */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {doDocs.length > 0 ? (
                          <div
                            className="attached-preview-chip"
                            onClick={() => handleOpenDoModal(booking)}
                            title={tText('คลิกเพื่อดูเอกสารใบ DO ปิดงาน', 'Click to view completed DO files')}
                            style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}
                          >
                            <FileCheck size={13} style={{ color: '#059669', flexShrink: 0 }} />
                            <span className="chip-filename-text" style={{ color: '#047857', fontWeight: 600 }}>
                              {decodeAttachmentName(doDocs[0]?.original_name) || doDocs[0]?.file_name}
                            </span>
                            {doDocs.length > 1 && (
                              <span className="chip-count-badge" style={{ backgroundColor: '#059669', color: '#fff' }}>
                                +{doDocs.length - 1}
                              </span>
                            )}
                            <Eye size={13} style={{ color: '#059669' }} />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="attach-do-ghost-btn"
                            onClick={() => handleOpenDoModal(booking)}
                            title={tText('แนบเอกสารใบ DO เมื่องานเสร็จสิ้น', 'Attach completed DO file')}
                            style={{ borderColor: '#bbf7d0', color: '#059669', backgroundColor: '#f0fdf4' }}
                          >
                            <Plus size={13} />
                            <span>{tText('+ แนบใบ DO', '+ Attach DO')}</span>
                          </button>
                        )}
                      </td>

                      {/* Action Menu (3 Dots Dropdown) */}
                      <td style={{ textAlign: 'right', paddingRight: '24px', whiteSpace: 'nowrap' }}>
                        <ActionDropdown
                          items={[
                            {
                              label: t('actionEdit', 'แก้ไข'),
                              icon: <Edit size={16} className="menu-icon" />,
                              onClick: () => handleOpenEditWizard(booking)
                            },
                            {
                              label: t('actionDelete', 'ลบ'),
                              icon: <Trash2 size={16} className="menu-icon danger" />,
                              danger: true,
                              onClick: () => handleDeleteBooking(booking.booking_id)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && !loading && (
          <div className="empty-state-wrapper">
            <FolderOpen size={48} className="empty-state-icon" />
            <p className="empty-state-text">{t('bookingEmptyList', 'ยังไม่มีรายการจองรถ คลิก "สร้าง Booking ใหม่" เพื่อเริ่มต้น')}</p>
          </div>
        )}
      </div>

      {/* ====================================================
          MODAL 1: CUSTOMER DOCUMENTS (เอกสารเพิ่มเติมจากลูกค้า)
          ==================================================== */}
      {isCustDocModalOpen && selectedBookingForCustDoc && (() => {
        const custDocsList = selectedBookingForCustDoc.customer_attachments || selectedBookingForCustDoc.attachments || [];

        return (
          <div className="modal-backdrop-overlay">
            <div className="attachment-modal-card">
              <div className="modal-header-bar">
                <div className="modal-header-title">
                  <Paperclip size={22} color="#0284c7" />
                  <div>
                    <h2>{tText('เอกสารเพิ่มเติมจากลูกค้า', 'Customer Additional Documents')}</h2>
                    <p className="modal-subtitle">
                      {tText('การจอง:', 'Booking:')} <strong>{selectedBookingForCustDoc.booking_no}</strong> ({selectedBookingForCustDoc.customer_name})
                    </p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setIsCustDocModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-content">
                {/* Customer Dropzone */}
                <div
                  className="upload-dropzone"
                  onClick={() => !uploadingCustDoc && custDocFileInputRef.current?.click()}
                  onDragOver={handleCustDocDragOver}
                  onDrop={handleCustDocDrop}
                >
                  <input
                    type="file"
                    multiple
                    ref={custDocFileInputRef}
                    onChange={handleCustDocSelect}
                    style={{ display: 'none' }}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                    disabled={uploadingCustDoc}
                  />
                  {uploadingCustDoc ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                      <span style={{ fontSize: '24px' }}>⏳</span>
                      <p style={{ margin: 0, fontWeight: 600, color: '#0284c7' }}>
                        {tText('กำลังอัปโหลดเอกสารลูกค้า กรุณารอสักครู่...', 'Uploading customer documents, please wait...')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload size={36} className="dropzone-upload-icon" />
                      <p className="dropzone-text">
                        {tText('ลากและวางเอกสารที่ได้รับจากลูกค้าที่นี่ หรือ', 'Drag & drop customer documents here, or')}{' '}
                        <span className="browse-link">{tText('เลือกไฟล์', 'browse')}</span>
                      </p>
                      <p className="dropzone-hint">
                        {tText('สำหรับใบสั่งซื้อ (PO), เอกสารเปิดงาน, รายละเอียดสินค้า (PDF, รูปภาพ, Excel, Word)', 'For purchase orders (PO), job orders, cargo specifications (PDF, Images, Excel, Word)')}
                      </p>
                    </>
                  )}
                </div>

                {/* List of Attached Customer Files */}
                <div className="attached-files-section">
                  <h3>
                    {tText('รายการเอกสารจากลูกค้า', 'Customer Documents')} ({custDocsList.length})
                  </h3>

                  {custDocsList.length === 0 ? (
                    <div className="no-attachments-placeholder">
                      <AlertCircle size={24} color="#9ca3af" />
                      <span>{tText('ยังไม่มีเอกสารจากลูกค้าในรายการนี้ (ใช้พื้นที่ด้านบนเพื่อแนบใบ PO หรือเอกสารเปิดงาน)', 'No customer documents attached yet. (Use the area above to attach PO or job order documents)')}</span>
                    </div>
                  ) : (
                    <div className="attachments-grid">
                      {custDocsList.map((att) => (
                        <div key={att.attachment_id} className="attachment-item-card">
                          <div className="att-file-icon">
                            <Paperclip size={24} color="#0284c7" />
                          </div>
                          <div className="att-file-info">
                            <span className="att-file-name" title={decodeAttachmentName(att.original_name) || att.file_name}>
                              {decodeAttachmentName(att.original_name) || att.file_name}
                            </span>
                            <span className="att-file-meta">
                              {att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : tText('แนบแล้ว', 'Attached')}
                              {' • '}
                              <strong style={{ color: '#0284c7' }}>{tText('เอกสารลูกค้า', 'Customer Doc')}</strong>
                            </span>
                          </div>
                          <div className="att-file-actions">
                            <a
                              href={`http://localhost:3000${att.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="att-action-btn view"
                              title={tText('เปิดดูไฟล์', 'Preview / View File')}
                            >
                              <Eye size={16} />
                            </a>
                            <a
                              href={`http://localhost:3000${att.file_path}`}
                              download
                              className="att-action-btn download"
                              title={tText('ดาวน์โหลดไฟล์', 'Download File')}
                            >
                              <Download size={16} />
                            </a>
                            <button
                              type="button"
                              className="att-action-btn delete"
                              onClick={() => handleDeleteCustDoc(att.attachment_id)}
                              title={tText('ลบไฟล์แนบ', 'Delete Attachment')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer-bar">
                <button className="btn-secondary" onClick={() => setIsCustDocModalOpen(false)}>
                  {tText('เสร็จสิ้น', 'Done')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====================================================
          MODAL 2: COMPLETED DO FILES (เอกสารใบ DO เมื่องานเสร็จสิ้น)
          ==================================================== */}
      {isDoModalOpen && selectedBookingForDo && (() => {
        const doList = selectedBookingForDo.do_files || [];

        return (
          <div className="modal-backdrop-overlay">
            <div className="attachment-modal-card">
              <div className="modal-header-bar">
                <div className="modal-header-title">
                  <FileCheck size={22} color="#059669" />
                  <div>
                    <h2>{tText('เอกสารใบ DO ปิดงาน (Signed DO / POD)', 'Completed DO & POD Files')}</h2>
                    <p className="modal-subtitle">
                      {tText('การจอง:', 'Booking:')} <strong>{selectedBookingForDo.booking_no}</strong> ({selectedBookingForDo.customer_name})
                    </p>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={() => setIsDoModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-content">
                {/* DO Dropzone */}
                <div
                  className="upload-dropzone do-dropzone"
                  onClick={() => !uploadingDo && doFileInputRef.current?.click()}
                  onDragOver={handleDoDragOver}
                  onDrop={handleDoDrop}
                >
                  <input
                    type="file"
                    multiple
                    ref={doFileInputRef}
                    onChange={handleDoFileSelect}
                    style={{ display: 'none' }}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                    disabled={uploadingDo}
                  />
                  {uploadingDo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                      <span style={{ fontSize: '24px' }}>⏳</span>
                      <p style={{ margin: 0, fontWeight: 600, color: '#059669' }}>
                        {tText('กำลังอัปโหลดไฟล์ DO กรุณารอสักครู่...', 'Uploading DO files, please wait...')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload size={36} className="dropzone-upload-icon" />
                      <p className="dropzone-text">
                        {tText('ลากและวางไฟล์ใบ DO / POD ที่เซ็นรับมอบแล้วที่นี่ หรือ', 'Drag & drop signed DO / POD files here, or')}{' '}
                        <span className="browse-link">{tText('เลือกไฟล์', 'browse')}</span>
                      </p>
                      <p className="dropzone-hint">
                        {tText('สำหรับเอกสาร DO เมื่องานขนส่งเสร็จสิ้น, ใบส่งของที่ลูกค้าเซ็นรับแล้ว, รูปถ่ายส่งมอบสินค้า (PDF, รูปภาพ)', 'For signed DO after delivery completion, POD, proof of delivery photos (PDF, images)')}
                      </p>
                    </>
                  )}
                </div>

                {/* List of Attached DO Files */}
                <div className="attached-files-section">
                  <h3>
                    {tText('รายการเอกสารใบ DO ปิดงาน', 'Completed DO Files')} ({doList.length})
                  </h3>

                  {doList.length === 0 ? (
                    <div className="no-attachments-placeholder">
                      <AlertCircle size={24} color="#9ca3af" />
                      <span>{tText('ยังไม่มีไฟล์ DO ในรายการนี้ (อัปโหลดเมื่อขนส่งเสร็จสิ้นและลูกค้าเซ็นรับมอบแล้ว)', 'No DO files attached yet. (Upload when delivery is done and signed by customer)')}</span>
                    </div>
                  ) : (
                    <div className="attachments-grid">
                      {doList.map((file) => (
                        <div key={file.do_file_id} className="attachment-item-card">
                          <div className="att-file-icon">
                            <FileCheck size={24} color="#059669" />
                          </div>
                          <div className="att-file-info">
                            <span className="att-file-name" title={decodeAttachmentName(file.original_name) || file.file_name}>
                              {decodeAttachmentName(file.original_name) || file.file_name}
                            </span>
                            <span className="att-file-meta">
                              {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : tText('แนบแล้ว', 'Attached')}
                              {' • '}
                              <strong style={{ color: '#059669' }}>{tText('DO ปิดงาน', 'Signed DO')}</strong>
                            </span>
                          </div>
                          <div className="att-file-actions">
                            <a
                              href={`http://localhost:3000${file.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="att-action-btn view"
                              title={tText('เปิดดูไฟล์', 'Preview / View File')}
                            >
                              <Eye size={16} />
                            </a>
                            <a
                              href={`http://localhost:3000${file.file_path}`}
                              download
                              className="att-action-btn download"
                              title={tText('ดาวน์โหลดไฟล์', 'Download File')}
                            >
                              <Download size={16} />
                            </a>
                            <button
                              type="button"
                              className="att-action-btn delete"
                              onClick={() => handleDeleteDoFile(file.do_file_id)}
                              title={tText('ลบไฟล์ DO', 'Delete DO File')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer-bar">
                <button className="btn-secondary" onClick={() => setIsDoModalOpen(false)}>
                  {tText('เสร็จสิ้น', 'Done')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}