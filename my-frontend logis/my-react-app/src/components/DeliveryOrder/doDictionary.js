/**
 * Language Dictionary for Delivery Order (Localization / i18n)
 * แยกคลังคำศัพท์และข้อความทั้งหมดออกจากส่วนแสดงผล (Separation of Concerns)
 * รองรับการเพิ่มภาษาใหม่ๆ เช่น ภาษาจีน (cn) ได้อย่างง่ายดายในอนาคต
 */

export const doDictionary = {
  th: {
    // Right Panel Header & Labels
    modalTitle: 'ใบสั่งส่งสินค้า',
    modalSubtitle: 'DELIVERY ORDER (D.O.)',
    langSelectorLabel: 'ภาษาเอกสาร / Document Language',
    thBtn: 'ภาษาไทย',
    enBtn: 'English',
    docSummaryTitle: 'ข้อมูลการจัดส่งโดยย่อ',
    summaryDoNo: 'เลขที่ D.O.',
    summaryLoadDate: 'วันที่ขึ้นสินค้า',
    summaryEta: 'กำหนดส่งถึง (ETA)',
    summaryTruck: 'ทะเบียนรถขนส่ง',
    summaryDriver: 'พนักงานขับรถ',
    summaryConsignee: 'ผู้รับสินค้า',
    summaryDestination: 'สถานที่ปลายทาง',
    summaryItems: 'จำนวนรายการสินค้า',
    itemsUnit: 'รายการ',
    printBtn: 'Print / Export PDF',
    closeBtn: 'ปิดหน้าต่าง',
    printHint: 'เอกสารถูกจัดวางในขนาด A4 มาตรฐาน พร้อมสั่งพิมพ์หรือบันทึกเป็น PDF ได้ทันที',

    // Document Sheet Content
    companyName: 'บริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด',
    companyAddress: '123/4 หมู่ที่ 2 ต.สำนักขาม อ.สะเดา จ.สงขลา 90320',
    taxIdLabel: 'เลขประจำตัวผู้เสียภาษี: 0905566002392',
    telLabel: 'โทร. 098-2591455 / 098-0150083',
    docTitle: 'ใบสั่งส่งสินค้า',
    docSubtitle: 'DELIVERY ORDER (D.O.)',

    // 4-Box Grid
    box1Header: 'ผู้ส่งสินค้า',
    box2Header: 'รายละเอียดเอกสารและการขนส่ง',
    box3Header: 'ผู้รับสินค้า',
    box4Header: 'ข้อมูลลูกค้า',

    labelDoNo: 'เลขที่ D.O.:',
    labelDateOfLoad: 'วันที่ขึ้นสินค้า:',
    labelBookingNo: 'เลขที่การจอง:',
    labelEta: 'กำหนดส่งถึง (ETA):',
    labelTruck: 'ทะเบียนรถ:',
    labelInvoiceNo: 'เลขที่ใบแจ้งหนี้:',
    labelDriver: 'พนักงานขับรถ:',

    labelCustTax: 'เลขประจำตัวผู้เสียภาษี:',
    labelCustAddress: 'ที่อยู่:',
    labelCustContact: 'ผู้ติดต่อ:',

    // Table Headers
    thItem: 'ลำดับ',
    thDesc: 'รายการสินค้า',
    thQty: 'จำนวน',
    thLoadFrom: 'จุดขึ้นสินค้า',
    thDestination: 'ปลายทางส่งสินค้า',
    noItems: 'ไม่มีรายการสินค้า',

    // Sub-table Information Boxes
    remarkLabel: 'หมายเหตุ:',
    shippingLabel: 'การจัดส่ง:',
    warehouseLabel: 'คลังสินค้า:',

    // Signatures
    sigReceiverTitle: 'ผู้รับสินค้า',
    sigReceiverSub: '(ลงลายมือชื่อผู้รับสินค้า)',
    sigDriverTitle: 'พนักงานขับรถ / ผู้ส่งมอบ',
    sigDriverSub: 'ลงลายมือชื่อพนักงานส่งมอบ',
    sigCompanyTitle: 'ในนาม บจก. เอส.ที.ทราน เอ็กซ์เพรส',
    sigCompanySub: '(ผู้มีอำนาจลงนาม)',
    datePlaceholder: 'วันที่: ......./......./...........',

    // Footer
    pageInfo: 'หน้า 1/1'
  },
  en: {
    // Right Panel Header & Labels
    modalTitle: 'Delivery Order',
    modalSubtitle: 'ใบสั่งส่งสินค้า (D.O.)',
    langSelectorLabel: 'Document Language / ภาษาเอกสาร',
    thBtn: 'ภาษาไทย',
    enBtn: 'English',
    docSummaryTitle: 'Delivery Summary',
    summaryDoNo: 'D.O. Number',
    summaryLoadDate: 'Date of Load',
    summaryEta: 'ETA',
    summaryTruck: 'Vehicle / Truck',
    summaryDriver: 'Driver',
    summaryConsignee: 'Consignee',
    summaryDestination: 'Destination',
    summaryItems: 'Total Items',
    itemsUnit: 'items',
    printBtn: 'Print / Export PDF',
    closeBtn: 'Close',
    printHint: 'Formatted for standard A4. Ready to print or export directly as PDF.',

    // Document Sheet Content
    companyName: 'S.T. TRANS EXPRESS CO., LTD.',
    companyAddress: '123/4 Moo 2, Samnak Kham, Sadao, Songkhla 90320',
    taxIdLabel: 'Tax Identification No.: 0905566002392',
    telLabel: 'Tel. 098-2591455 / 098-0150083',
    docTitle: 'DELIVERY ORDER',
    docSubtitle: '(D.O.)',

    // 4-Box Grid
    box1Header: 'CONSIGNOR',
    box2Header: 'DOCUMENT & TRANSPORT DETAILS',
    box3Header: 'CONSIGNEE',
    box4Header: 'CUSTOMER INFORMATION',

    labelDoNo: 'D.O. No.:',
    labelDateOfLoad: 'Date of Load:',
    labelBookingNo: 'Booking No.:',
    labelEta: 'ETA:',
    labelTruck: 'Truck No.:',
    labelInvoiceNo: 'Invoice No.:',
    labelDriver: 'Driver:',

    labelCustTax: 'Tax ID:',
    labelCustAddress: 'Address:',
    labelCustContact: 'Contact Person:',

    // Table Headers
    thItem: 'ITEM',
    thDesc: 'DESCRIPTION OF GOODS',
    thQty: 'QUANTITY',
    thLoadFrom: 'LOAD FROM',
    thDestination: 'DESTINATION',
    noItems: 'No items listed',

    // Sub-table Information Boxes
    remarkLabel: 'REMARK:',
    shippingLabel: 'SHIPPING:',
    warehouseLabel: 'WAREHOUSE:',

    // Signatures
    sigReceiverTitle: 'Received By',
    sigReceiverSub: '(Consignee Signature)',
    sigDriverTitle: 'Delivered By',
    sigDriverSub: 'Driver Signature',
    sigCompanyTitle: 'For S.T. Trans Express Co., Ltd.',
    sigCompanySub: '(Authorized Signature)',
    datePlaceholder: 'Date: ......./......./...........',

    // Footer
    pageInfo: 'Page 1 of 1'
  }
};

export default doDictionary;
