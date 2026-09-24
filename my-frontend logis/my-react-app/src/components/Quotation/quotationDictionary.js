/**
 * Language Dictionary for Quotation (ใบเสนอราคา)
 * แยกคลังคำศัพท์และข้อความทั้งหมดออกจากส่วนแสดงผล (Separation of Concerns)
 */

export const quotationDictionary = {
  th: {
    // Right Panel Header & Labels
    modalTitle: 'ใบเสนอราคา',
    modalSubtitle: 'QUOTATION',
    langSelectorLabel: 'ภาษาเอกสาร / Document Language',
    thBtn: 'ภาษาไทย',
    enBtn: 'English',
    docSummaryTitle: 'ข้อมูลใบเสนอราคาโดยย่อ',
    summaryNo: 'เลขที่เอกสาร',
    summaryDate: 'วันที่ออกเอกสาร',
    summaryCustomer: 'ลูกค้า',
    summaryJob: 'ชื่องาน',
    summarySales: 'ผู้เสนอราคา',
    summaryGrandTotal: 'ยอดรวมทั้งสิ้น',
    itemsUnit: 'รายการ',
    printBtn: 'Print / Export PDF',
    closeBtn: 'ปิดหน้าต่าง',
    printHint: 'เอกสารถูกจัดวางในขนาด A4 มาตรฐาน พร้อมสั่งพิมพ์หรือบันทึกเป็น PDF ได้ทันที',

    // Document Sheet Content
    companyName: 'บริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด',
    companyAddress: '123/4 หมู่ที่ 2 ต.สำนักขาม อ.สะเดา จ.สงขลา 90320',
    taxIdLabel: 'เลขประจำตัวผู้เสียภาษี: 0905566002392',
    telLabel: 'โทร. 098-2591455 / 098-0150083',
    docTitle: 'ใบเสนอราคา',
    docSubtitle: 'QUOTATION',

    // Cards
    billToTitle: 'เสนอราคาถึง (BILL TO)',
    docDetailsTitle: 'รายละเอียดเอกสาร',

    labelTax: 'เลขภาษี',
    labelAddress: 'ที่อยู่',
    labelContact: 'ผู้ติดต่อ',
    labelEmail: 'อีเมล',

    labelDocNo: 'Quotation No.',
    labelDocDate: 'วันที่ออก',
    labelSales: 'ผู้เสนอ',
    labelJob: 'ชื่องาน',

    // Table Headers
    thItem: 'ลำดับ',
    thDesc: 'รายการบริการ / รายละเอียด',
    thQty: 'จำนวน',
    thUnit: 'หน่วย',
    thUnitPrice: 'ราคา/หน่วย',
    thAmount: 'จำนวนเงิน (บาท)',
    noItems: 'ไม่มีรายการบริการ',

    defaultService: 'บริการขนส่ง',
    subtotalLabel: 'รวมเป็นเงิน',
    grandTotalLabel: 'จำนวนเงินรวมทั้งสิ้น',
    currencyUnit: 'บาท',
    remarkLabel: 'หมายเหตุ:',

    // Signatures
    inNameOfCustomer: 'ในนามลูกค้า',
    sigCustomerSub: 'ผู้สั่งซื้อสินค้า',
    sigCompanyTitle: 'ในนาม บจก. เอส.ที.ทราน เอ็กซ์เพรส',
    sigCompanySub: 'ผู้อนุมัติ (ผู้มีอำนาจลงนาม)',
    dateLabel: 'วันที่',

    // Footer
    pageInfo: 'หน้า 1/1'
  },
  en: {
    // Right Panel Header & Labels
    modalTitle: 'Quotation',
    modalSubtitle: 'ใบเสนอราคา',
    langSelectorLabel: 'Document Language / ภาษาเอกสาร',
    thBtn: 'ภาษาไทย',
    enBtn: 'English',
    docSummaryTitle: 'Quotation Summary',
    summaryNo: 'Quotation No.',
    summaryDate: 'Issue Date',
    summaryCustomer: 'Customer',
    summaryJob: 'Job / Project',
    summarySales: 'Salesperson',
    summaryGrandTotal: 'Grand Total',
    itemsUnit: 'items',
    printBtn: 'Print / Export PDF',
    closeBtn: 'Close',
    printHint: 'Formatted for standard A4. Ready to print or export directly as PDF.',

    // Document Sheet Content
    companyName: 'S.T. TRANS EXPRESS CO., LTD.',
    companyAddress: '123/4 Moo 2, Samnak Kham, Sadao, Songkhla 90320',
    taxIdLabel: 'Tax Identification No.: 0905566002392',
    telLabel: 'Tel. 098-2591455 / 098-0150083',
    docTitle: 'QUOTATION',
    docSubtitle: '(ใบเสนอราคา)',

    // Cards
    billToTitle: 'BILL TO',
    docDetailsTitle: 'DOCUMENT DETAILS',

    labelTax: 'Tax ID',
    labelAddress: 'Address',
    labelContact: 'Contact',
    labelEmail: 'Email',

    labelDocNo: 'Quotation No.',
    labelDocDate: 'Date',
    labelSales: 'Prepared By',
    labelJob: 'Job / Project',

    // Table Headers
    thItem: 'ITEM',
    thDesc: 'DESCRIPTION / SERVICE',
    thQty: 'QUANTITY',
    thUnit: 'UNIT',
    thUnitPrice: 'UNIT PRICE',
    thAmount: 'AMOUNT (THB)',
    noItems: 'No items listed',

    defaultService: 'Freight Transportation Service',
    subtotalLabel: 'Subtotal',
    grandTotalLabel: 'Total Amount',
    currencyUnit: 'THB',
    remarkLabel: 'REMARK:',

    // Signatures
    inNameOfCustomer: 'Customer Authorized Signature',
    sigCustomerSub: 'Purchaser / Client',
    sigCompanyTitle: 'For S.T. Trans Express Co., Ltd.',
    sigCompanySub: 'Authorized Signature',
    dateLabel: 'Date',

    // Footer
    pageInfo: 'Page 1 of 1'
  }
};

export default quotationDictionary;
