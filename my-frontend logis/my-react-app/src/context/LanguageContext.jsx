import React, { createContext, useContext, useState, useEffect } from 'react';

// Common Translations Dictionary for the Entire System
export const globalTranslations = {
  th: {
    // Brand & System
    brandName: 'S.T.TRANS EXPRESS',
    brandTitle: 'S.T.TRANS EXPRESS MANAGEMENT',
    systemSubtitle: 'ระบบบริหารจัดการงานขนส่ง',

    // Header & Roles
    roleEmployee: 'พนักงานทั่วไป',
    roleOperator: 'ฝ่ายปฏิบัติการ',
    roleAccounting: 'ฝ่ายการเงิน-บัญชี',

    // Sidebar Groups
    menuMain: 'เมนูหลัก (MAIN)',
    menuMasterData: 'ข้อมูลหลักระบบ (MASTER DATA)',

    // Sidebar Items
    menuDashboard: 'แดชบอร์ด',
    menuBooking: 'การจองรถ (Booking)',
    menuDocCenter: 'ศูนย์รวมเอกสาร',
    menuQuotation: 'ใบเสนอราคา (Quotation)',
    menuInvoice: 'ใบแจ้งหนี้ (Invoice)',
    menuReceipt: 'ใบเสร็จรับเงิน (Receipt)',
    menuDeliveryOrder: 'ใบสั่งจัดส่งสินค้า (DO)',
    menuCustomers: 'ข้อมูลลูกค้า (Customers)',
    menuDrivers: 'ข้อมูลคนขับรถ (Drivers)',
    menuTrucks: 'ข้อมูลรถบรรทุก (Trucks)',
    menuBankAccounts: 'ข้อมูลบัญชีธนาคาร (Bank Accounts)',
    menuLogout: 'ออกจากระบบ',

    // Common Actions
    actionAdd: 'เพิ่มข้อมูล',
    actionEdit: 'แก้ไข',
    actionDelete: 'ลบ',
    actionSave: 'บันทึก',
    actionCancel: 'ยกเลิก',
    actionBack: 'ย้อนกลับ',
    actionNext: 'ถัดไป',
    actionSearch: 'ค้นหา...',
    actionPrint: 'พิมพ์ / ดูตัวอย่าง',
    actionFilter: 'ตัวกรอง',
    actionView: 'ดูรายละเอียด',
    actionConfirm: 'ยืนยัน',
    actionClose: 'ปิด',
    actionSaving: 'กำลังบันทึก...',
    actionSelect: '— เลือก —',
    actionActions: 'จัดการ',
    actionStatus: 'สถานะ',
    actionTotal: 'รวมทั้งหมด',
    actionAttach: 'แนบไฟล์',

    // Statuses
    statusWaiting: 'รอดำเนินการ',
    statusAssigned: 'จัดสรรรถแล้ว',
    statusCompleted: 'เสร็จสิ้น',
    statusDone: 'เสร็จสิ้น',
    statusDraft: 'แบบร่าง',
    statusConfirmed: 'ยืนยันแล้ว',
    statusPending: 'รอชำระเงิน',
    statusPaid: 'ชำระแล้ว',
    statusOverdue: 'เกินกำหนด',
    statusCancelled: 'ยกเลิก',

    // Delivery Order (DO) Module
    doPageTitle: 'ใบสั่งจัดส่งสินค้า (Delivery Order)',
    doPageSubtitle: 'สร้างและจัดการใบสั่งจัดส่งสินค้า (DO) จากงานจองรถ พร้อมติดตามการขนส่ง',
    doCreateNewBtn: 'สร้างใบ DO ใหม่',
    doSearchPlaceholder: 'ค้นหาตามเลขที่ DO, ลูกค้า, ทะเบียนรถ, หรือสินค้า...',
    doColNo: 'DO #',
    doColCustomer: 'ลูกค้า (Customer)',
    doColTruckDriver: 'รถ / พนักงานขับรถ',
    doColLoadDate: 'วันที่รับสินค้า',
    doColEta: 'กำหนดส่ง (ETA)',
    doColAction: 'จัดการ',
    doEmptyList: 'ยังไม่มีข้อมูลใบสั่งจัดส่งสินค้า (DO) คลิก "สร้างใบ DO ใหม่" เพื่อเริ่มต้น',
    doStep1: 'เลือกรอบการจอง',
    doStep2: 'คู่ค้าและสถานที่',
    doStep3: 'ข้อมูลขนส่ง',
    doStep4: 'รายการสินค้า',
    doStep5: 'การจัดส่งและหมายเหตุ',
    doStep6: 'ตรวจสอบและยืนยัน',
    doStep1Title: 'เลือกรอบการจอง (Select Booking)',
    doStep1Search: 'ค้นหาตามเลขที่จอง, ลูกค้า, ทะเบียนรถ, หรือคนขับ...',
    doStep1Empty: 'ไม่พบบุคกิ้งในระบบ (สามารถกรอกข้อมูลเองในขั้นตอนถัดไปได้)',
    doConsignorTitle: 'Consignor / ผู้ส่งสินค้า',
    doConsigneeTitle: 'Consignee / ผู้รับสินค้า',
    doDeliveryPlaceTitle: 'สถานที่จัดส่ง (ตัวเลือกเพิ่มเติม)',
    doAddDeliveryPlaceBtn: 'เพิ่มสถานที่จัดส่ง (ตัวเลือกเพิ่มเติม)',
    doRemoveDeliveryPlaceBtn: 'ลบข้อมูลสถานที่จัดส่ง',
    doCompanyName: 'ชื่อบริษัท / ผู้ส่ง',
    doAddressLine: 'ที่อยู่ / เลขที่ตั้ง',
    doCity: 'อำเภอ / เมือง',
    doState: 'จังหวัด',
    doPostalCode: 'รหัสไปรษณีย์',
    doCountry: 'ประเทศ',
    doSaveSuccess: 'สร้างเอกสาร Delivery Order สำเร็จ',
    doEditSuccess: 'แก้ไข Delivery Order สำเร็จ',

    // Booking Module
    bookingPageTitle: 'การจองรถขนส่ง (Booking)',
    bookingPageSubtitle: 'จัดการรายการจองรถขนส่ง ตารางงาน และสถานะการจัดส่ง',
    bookingCreateBtn: 'สร้าง Booking ใหม่',
    bookingSearchPlaceholder: 'ค้นหาตามเลขที่ Booking, ลูกค้า, พนักงานขับรถ...',
    bookingColNo: 'Booking #',
    bookingColCustomer: 'ลูกค้า',
    bookingColService: 'บริการขนส่ง',
    bookingColPickupDate: 'วันที่ขึ้นของ (Pickup)',
    bookingColDeliveryDate: 'วันที่ส่งมอบ (Delivery)',
    bookingColTruck: 'รถบรรทุก',
    bookingColDoFile: 'ไฟล์ DO / เอกสารแนบ',
    bookingColActions: 'จัดการ',
    bookingEmptyList: 'ยังไม่มีรายการจองรถ คลิก "สร้าง Booking ใหม่" เพื่อเริ่มต้น',

    // Dashboard Module
    dashTitle: 'ภาพรวมระบบขนส่ง',
    dashSubtitle: 'สถิติภาพรวม งานที่กำลังดำเนินการ และปฏิทินงานขนส่ง',
    dashTotalBookings: 'ยอดการจองทั้งหมด',
    dashActiveJobs: 'งานที่กำลังดำเนินการ',
    dashCompletedJobs: 'งานที่เสร็จสิ้นแล้ว',
    dashAvailableTrucks: 'รถที่พร้อมใช้งาน',
    dashCalendarTitle: 'ปฏิทินงานขนส่งประจำเดือน',
    dashRecentJobs: 'งานจองล่าสุด',
    dashJobHistory: 'ประวัติการขนส่ง',
    dashDetailTitle: 'รายละเอียดการจอง',

    // Quotation Module
    quotePageTitle: 'ใบเสนอราคา (Quotation)',
    quotePageSubtitle: 'สร้างและจัดการใบเสนอราคาสำหรับลูกค้า พร้อมอิงราคางานบริการขนส่ง',
    quoteCreateBtn: 'สร้างใบเสนอราคาใหม่',
    quoteSearchPlaceholder: 'ค้นหาตามเลขที่ใบเสนอราคา, ลูกค้า...',
    quoteColNo: 'เลขที่เอกสาร',
    quoteColDate: 'วันที่',
    quoteColCustomer: 'ลูกค้า',
    quoteColTotal: 'ยอดรวม (บาท)',
    quoteColStatus: 'สถานะ',
    quoteEmptyList: 'ยังไม่มีใบเสนอราคาในระบบ คลิก "สร้างใบเสนอราคาใหม่" เพื่อเริ่มต้น',

    // Invoice Module
    invPageTitle: 'ใบแจ้งหนี้ (Invoice)',
    invPageSubtitle: 'สร้างและจัดการใบแจ้งหนี้ สำหรับเรียกเก็บเงินค่าบริการขนส่ง',
    invCreateBtn: 'สร้างใบแจ้งหนี้ใหม่',
    invSearchPlaceholder: 'ค้นหาตามเลขที่ใบแจ้งหนี้, ลูกค้า...',
    invColNo: 'เลขที่ใบแจ้งหนี้',
    invColDate: 'วันที่',
    invColCustomer: 'ลูกค้า',
    invColTotal: 'ยอดเงินรวม',
    invColStatus: 'สถานะ',
    invEmptyList: 'ยังไม่มีข้อมูลใบแจ้งหนี้ คลิก "สร้างใบแจ้งหนี้ใหม่" เพื่อเริ่มต้น',

    // Receipt Module
    recPageTitle: 'ใบเสร็จรับเงิน (Receipt)',
    recPageSubtitle: 'ออกใบเสร็จรับเงินและบันทึกการรับชำระค่าบริการขนส่ง',
    recCreateBtn: 'สร้างใบเสร็จรับเงินใหม่',
    recSearchPlaceholder: 'ค้นหาตามเลขที่ใบเสร็จ, ใบแจ้งหนี้, ลูกค้า...',
    recColNo: 'เลขที่ใบเสร็จ',
    recColDate: 'วันที่รับเงิน',
    recColCustomer: 'ลูกค้า',
    recColTotal: 'ยอดรับชำระ',
    recColMethod: 'วิธีชำระเงิน',
    recEmptyList: 'ยังไม่มีข้อมูลใบเสร็จรับเงิน คลิก "สร้างใบเสร็จรับเงินใหม่" เพื่อเริ่มต้น',

    // Master Data Modules
    custPageTitle: 'ข้อมูลลูกค้า (Customers)',
    custPageSubtitle: 'จัดการข้อมูลลูกค้า รายละเอียดการติดต่อ และประวัติเอกสาร',
    custAddBtn: 'เพิ่มลูกค้าใหม่',
    custSearchPlaceholder: 'ค้นหาลูกค้าตามชื่อบริษัท, ผู้ติดต่อ, เบอร์โทร...',
    custColCompany: 'ชื่อบริษัท / ลูกค้า',
    custColContact: 'ผู้ติดต่อ',

    truckPageTitle: 'ข้อมูลรถบรรทุก (Trucks)',
    truckPageSubtitle: 'จัดการข้อมูลรถบรรทุก ประเภทรถ และคนขับประจำรถ',
    truckAddBtn: 'เพิ่มรถใหม่',
    truckSearchPlaceholder: 'ค้นหาตามทะเบียนรถ, ประเภทรถ, หรือคนขับ...',
    truckColPlate: 'ทะเบียนรถ',
    truckColType: 'ประเภทรถ',
    truckColDriver: 'คนขับประจำรถ',

    driverPageTitle: 'ข้อมูลคนขับรถ (Drivers)',
    driverPageSubtitle: 'จัดการข้อมูลพนักงานขับรถ เบอร์ติดต่อ และรถที่ได้รับมอบหมาย',
    driverAddBtn: 'เพิ่มคนขับใหม่',
    driverSearchPlaceholder: 'ค้นหาตามชื่อคนขับ, เบอร์โทร, หรืออีเมล...',
    driverColName: 'ชื่อ-นามสกุล',
    driverColPhone: 'เบอร์โทรศัพท์',
    driverColEmail: 'อีเมล',
    driverColLicense: 'เลขที่ใบขับขี่',
    driverColCar: 'รถที่ขับ',

    bankPageTitle: 'ข้อมูลบัญชีธนาคาร (Bank Accounts)',
    bankPageSubtitle: 'จัดการบัญชีธนาคารของบริษัท สำหรับรับชำระเงินค่าบริการขนส่ง',
    bankAddBtn: 'เพิ่มบัญชีธนาคารใหม่',
    bankSearchPlaceholder: 'ค้นหาตามเลขที่บัญชี, ชื่อบัญชี, หรือธนาคาร...',
    bankColBank: 'ธนาคาร',
    bankColAccNo: 'เลขที่บัญชี',
    bankColAccName: 'ชื่อบัญชี',
    bankColBranch: 'สาขา',

    // Language names
    langThai: 'ภาษาไทย (TH)',
    langEnglish: 'English (EN)'
  },

  en: {
    // Brand & System
    brandName: 'S.T.TRANS EXPRESS',
    brandTitle: 'S.T.TRANS EXPRESS MANAGEMENT',
    systemSubtitle: 'Transport Management System',

    // Header & Roles
    roleEmployee: 'Employee',
    roleOperator: 'Operator',
    roleAccounting: 'Accounting',

    // Sidebar Groups
    menuMain: 'MAIN',
    menuMasterData: 'MASTER DATA',

    // Sidebar Items
    menuDashboard: 'Dashboard',
    menuBooking: 'Booking',
    menuDocCenter: 'Document Center',
    menuQuotation: 'Quotation',
    menuInvoice: 'Invoice',
    menuReceipt: 'Receipt',
    menuDeliveryOrder: 'Delivery Order (DO)',
    menuCustomers: 'Customers',
    menuDrivers: 'Drivers',
    menuTrucks: 'Trucks',
    menuBankAccounts: 'Bank Accounts',
    menuLogout: 'Log out',

    // Common Actions
    actionAdd: 'Add New',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    actionSave: 'Save',
    actionCancel: 'Cancel',
    actionBack: 'Back',
    actionNext: 'Next',
    actionSearch: 'Search...',
    actionPrint: 'Print / Preview',
    actionFilter: 'Filter',
    actionView: 'View Details',
    actionConfirm: 'Confirm',
    actionClose: 'Close',
    actionSaving: 'Saving...',
    actionSelect: '— Select —',
    actionActions: 'Actions',
    actionStatus: 'Status',
    actionTotal: 'Total',
    actionAttach: 'Attach File',

    // Statuses
    statusWaiting: 'Waiting',
    statusAssigned: 'Assigned',
    statusCompleted: 'Completed',
    statusDone: 'Done',
    statusDraft: 'Draft',
    statusConfirmed: 'Confirmed',
    statusPending: 'Pending Payment',
    statusPaid: 'Paid',
    statusOverdue: 'Overdue',
    statusCancelled: 'Cancelled',

    // Delivery Order (DO) Module
    doPageTitle: 'Delivery Order (DO)',
    doPageSubtitle: 'Create and manage Delivery Orders from assigned bookings and track transportation',
    doCreateNewBtn: 'New Delivery Order',
    doSearchPlaceholder: 'Search by DO #, customer, truck plate, or goods...',
    doColNo: 'DO #',
    doColCustomer: 'Customer',
    doColTruckDriver: 'Truck / Driver',
    doColLoadDate: 'Load Date',
    doColEta: 'ETA',
    doColAction: 'Actions',
    doEmptyList: 'No Delivery Orders found. Click "New Delivery Order" to create one.',
    doStep1: 'Select Booking',
    doStep2: 'Parties & Location',
    doStep3: 'Transport',
    doStep4: 'Goods',
    doStep5: 'Shipping & Remark',
    doStep6: 'Review & Confirm',
    doStep1Title: 'Select Booking',
    doStep1Search: 'Search by booking #, customer, truck, driver...',
    doStep1Empty: 'No bookings found in system (You can manually enter details in next step)',
    doConsignorTitle: 'Consignor',
    doConsigneeTitle: 'Consignee',
    doDeliveryPlaceTitle: 'Delivery Location (Optional)',
    doAddDeliveryPlaceBtn: 'Add Delivery Location (Optional)',
    doRemoveDeliveryPlaceBtn: 'Remove Location Info',
    doCompanyName: 'Company Name',
    doAddressLine: 'Address Line',
    doCity: 'City / District',
    doState: 'State / Province',
    doPostalCode: 'Postal Code',
    doCountry: 'Country',
    doSaveSuccess: 'Delivery Order created successfully',
    doEditSuccess: 'Delivery Order updated successfully',

    // Booking Module
    bookingPageTitle: 'Transport Booking',
    bookingPageSubtitle: 'Manage transport booking records, schedules, and delivery progress',
    bookingCreateBtn: 'New Booking',
    bookingSearchPlaceholder: 'Search by booking #, customer, driver...',
    bookingColNo: 'Booking #',
    bookingColCustomer: 'Customer',
    bookingColService: 'Transport Service',
    bookingColPickupDate: 'Pickup Date',
    bookingColDeliveryDate: 'Delivery Date',
    bookingColTruck: 'Truck',
    bookingColDoFile: 'DO File / Attachment',
    bookingColActions: 'Actions',
    bookingEmptyList: 'No bookings found. Click "New Booking" to generate one.',

    // Dashboard Module
    dashTitle: 'Logistics Overview',
    dashSubtitle: 'System summary statistics, ongoing shipments, and transport calendar',
    dashTotalBookings: 'Total Bookings',
    dashActiveJobs: 'In Progress Jobs',
    dashCompletedJobs: 'Completed Jobs',
    dashAvailableTrucks: 'Available Trucks',
    dashCalendarTitle: 'Monthly Transport Calendar',
    dashRecentJobs: 'Recent Bookings',
    dashJobHistory: 'Transport History',
    dashDetailTitle: 'Booking Details',

    // Quotation Module
    quotePageTitle: 'Quotation',
    quotePageSubtitle: 'Create and manage price quotations for customers based on freight services',
    quoteCreateBtn: 'New Quotation',
    quoteSearchPlaceholder: 'Search by quotation #, customer, or project...',
    quoteColNo: 'Quotation #',
    quoteColDate: 'Issue Date',
    quoteColCustomer: 'Customer',
    quoteColProject: 'Project / Details',
    quoteColTotal: 'Total (THB)',
    quoteColStatus: 'Status',
    quoteEmptyList: 'No quotations found. Click "New Quotation" to create one.',

    // Invoice Module
    invPageTitle: 'Invoice',
    invPageSubtitle: 'Create and manage billing invoices for freight services rendered',
    invCreateBtn: 'New Invoice',
    invSearchPlaceholder: 'Search by invoice #, customer, DO #, or booking #...',
    invColNo: 'Invoice #',
    invColDate: 'Invoice Date',
    invColCustomer: 'Customer',
    invColTotal: 'Total Amount (THB)',
    invColStatus: 'Status',
    invEmptyList: 'No invoices found. Click "New Invoice" to create one.',

    // Receipt Module
    recPageTitle: 'Receipt',
    recPageSubtitle: 'Issue official receipts and record customer payment settlements',
    recCreateBtn: 'New Receipt',
    recSearchPlaceholder: 'Search by receipt #, invoice #, customer...',
    recColNo: 'Receipt #',
    recColDate: 'Payment Date',
    recColCustomer: 'Customer',
    recColInvoiceNo: 'Invoice #',
    recColTotal: 'Total Amount (THB)',
    recColMethod: 'Payment Method',
    recEmptyList: 'No receipts found. Click "New Receipt" to issue one.',

    // Master Data Modules
    custPageTitle: 'Customers',
    custPageSubtitle: 'Manage customer records, contact information, and document history',
    custAddBtn: 'Add Customer',
    custSearchPlaceholder: 'Search customers by name, contact, phone...',
    custColCompany: 'Company Name',
    custColContact: 'Contact Person',

    truckPageTitle: 'Trucks',
    truckPageSubtitle: 'Manage truck fleet, vehicle types, and assigned drivers',
    truckAddBtn: 'Add Truck',
    truckSearchPlaceholder: 'Search by plate number, truck type, or driver...',
    truckColPlate: 'License Plate',
    truckColType: 'Type',
    truckColDriver: 'Assigned Driver',

    driverPageTitle: 'Drivers',
    driverPageSubtitle: 'Manage drivers, contact info, and assigned vehicles',
    driverAddBtn: 'Add Driver',
    driverSearchPlaceholder: 'Search by driver name, phone, or email...',
    driverColName: 'Full Name',
    driverColPhone: 'Phone',
    driverColEmail: 'Email',
    driverColLicense: 'License Number',
    driverColCar: 'Assigned Truck',

    bankPageTitle: 'Bank Accounts',
    bankPageSubtitle: 'Manage company bank accounts for payment collections',
    bankAddBtn: 'Add Bank Account',
    bankSearchPlaceholder: 'Search by account number, name, or bank...',
    bankColBank: 'Bank',
    bankColAccNo: 'Account Number',
    bankColAccName: 'Account Name',
    bankColBranch: 'Branch',

    // Language names
    langThai: 'ภาษาไทย (TH)',
    langEnglish: 'English (EN)'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('app_language');
      return saved === 'en' ? 'en' : 'th';
    } catch {
      return 'th';
    }
  });

  const setLang = (newLang) => {
    const validLang = newLang === 'en' ? 'en' : 'th';
    setLangState(validLang);
    try {
      localStorage.setItem('app_language', validLang);
      // Dispatch storage event so all tabs or sub-windows stay in sync
      window.dispatchEvent(new Event('app_language_changed'));
    } catch (e) {
      console.warn('Unable to persist language setting:', e);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'th' ? 'en' : 'th');
  };

  // Helper function to translate a key with optional fallback
  const t = (key, fallback = '') => {
    const dict = globalTranslations[lang] || globalTranslations.th;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    // If key not found in current language, try fallback or English dictionary
    if (fallback) return fallback;
    const fallbackDict = globalTranslations.en || {};
    return fallbackDict[key] !== undefined ? fallbackDict[key] : key;
  };

  // Convenient inline helper: tText('ข้อความไทย', 'English Text')
  const tText = (thText, enText) => {
    return lang === 'en' ? enText : thText;
  };

  // Date formatting helper based on current language
  const formatDateLocale = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      if (lang === 'th') {
        const thaiMonths = [
          'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
      } else {
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {
      return dateStr;
    }
  };

  const isTh = lang === 'th';
  const isEn = lang === 'en';

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        tText,
        formatDateLocale,
        isTh,
        isEn
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: 'th',
      setLang: () => {},
      toggleLang: () => {},
      t: (key, fallback) => fallback || key,
      tText: (thText, enText) => thText,
      formatDateLocale: (d) => d || '-',
      isTh: true,
      isEn: false
    };
  }
  return context;
}

export default LanguageContext;
