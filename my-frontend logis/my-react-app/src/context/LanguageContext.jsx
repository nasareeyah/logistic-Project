import React, { createContext, useContext, useState, useEffect } from 'react';

// Common Translations Dictionary
export const globalTranslations = {
  th: {
    // Brand & System
    brandName: 'S.T.TRANS EXPRESS',
    systemSubtitle: 'ระบบบริหารจัดการงานขนส่ง',
    
    // Header & Roles
    roleEmployee: 'พนักงานทั่วไป (Employee)',
    roleOperator: 'ฝ่ายปฏิบัติการ (Operator)',
    roleAccounting: 'ฝ่ายการเงิน-บัญชี (Accounting)',
    
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
    menuLogout: 'ออกจากระบบ',
    
    // Common Actions
    actionAdd: 'เพิ่มข้อมูล',
    actionEdit: 'แก้ไข',
    actionDelete: 'ลบ',
    actionSave: 'บันทึก',
    actionCancel: 'ยกเลิก',
    actionBack: 'ย้อนกลับ',
    actionSearch: 'ค้นหา...',
    actionPrint: 'พิมพ์ PDF',
    actionFilter: 'ตัวกรอง',
    actionView: 'ดูรายละเอียด',
    actionConfirm: 'ยืนยัน',
    
    // Language names
    langThai: 'ภาษาไทย',
    langEnglish: 'English'
  },
  en: {
    // Brand & System
    brandName: 'S.T.TRANS EXPRESS',
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
    menuLogout: 'Log out',
    
    // Common Actions
    actionAdd: 'Add New',
    actionEdit: 'Edit',
    actionDelete: 'Delete',
    actionSave: 'Save',
    actionCancel: 'Cancel',
    actionBack: 'Back',
    actionSearch: 'Search...',
    actionPrint: 'Print PDF',
    actionFilter: 'Filter',
    actionView: 'View Details',
    actionConfirm: 'Confirm',
    
    // Language names
    langThai: 'ภาษาไทย',
    langEnglish: 'English'
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
    if (dict[key]) {
      return dict[key];
    }
    // If key not found in current language, try opposite or fallback
    return fallback || globalTranslations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return safe default if used outside Provider
    return {
      lang: 'th',
      setLang: () => {},
      toggleLang: () => {},
      t: (key, fallback) => fallback || key
    };
  }
  return context;
}
