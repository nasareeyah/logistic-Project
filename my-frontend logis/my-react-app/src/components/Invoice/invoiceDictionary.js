/**
 * Language Dictionary for Invoice (ใบแจ้งหนี้)
 * แยกคลังคำศัพท์และข้อความทั้งหมดออกจากส่วนแสดงผล (Separation of Concerns)
 */

export const invoiceDictionary = {
  th: {
    // Right Panel Header & Labels
    modalTitle: 'ใบแจ้งหนี้',
    modalSubtitle: 'INVOICE',
    langSelectorLabel: 'ภาษาเอกสาร / Document Language',
    thBtn: 'ภาษาไทย',
    enBtn: 'English',
    docSummaryTitle: 'ข้อมูลใบแจ้งหนี้โดยย่อ',
    summaryNo: 'เลขที่ใบแจ้งหนี้',
    summaryDate: 'วันที่ออกเอกสาร',
    summaryDueDate: 'วันครบกำหนดชำระ',
    summaryCreditTerm: 'เครดิตเทอม',
    summaryCustomer: 'ลูกค้า (ผู้รับวางบิล)',
    summaryTotal: 'ยอดรวมทั้งสิ้น',
    daysUnit: 'วัน',
    itemsUnit: 'รายการ',
    printBtn: 'Print / Export PDF',
    closeBtn: 'ปิดหน้าต่าง',
    printHint: 'เอกสารถูกจัดวางในขนาด A4 มาตรฐาน พร้อมสั่งพิมพ์หรือบันทึกเป็น PDF ได้ทันที',

    // Document Sheet Content
    companyName: 'บริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด',
    companyAddress: '123/4 หมู่ที่ 2 ต.สำนักขาม อ.สะเดา จ.สงขลา 90320',
    taxIdLabel: 'เลขประจำตัวผู้เสียภาษี: 0905566002392',
    telLabel: 'โทร. 098-2591455 / 098-0150083',
    docTitle: 'ใบแจ้งหนี้',
    docSubtitle: 'INVOICE',

    // Cards
    billToTitle: 'แจ้งหนี้ถึง (BILL TO)',
    docDetailsTitle: 'รายละเอียดเอกสาร',

    labelTax: 'เลขภาษี',
    labelAddress: 'ที่อยู่',
    labelContact: 'ผู้ติดต่อ',
    labelPhone: 'โทรศัพท์',

    labelInvoiceNo: 'Invoice No.',
    labelIssueDate: 'วันที่ออกเอกสาร',
    labelDueDate: 'วันครบกำหนด',
    labelCreditTerm: 'เครดิตเทอม',

    // Table Headers
    thItem: 'ลำดับ',
    thDesc: 'รายการบริการ / รายละเอียด',
    thQty: 'จำนวน',
    thUnit: 'หน่วย',
    thUnitPrice: 'ราคา/หน่วย',
    thAmount: 'จำนวนเงิน (บาท)',
    noItems: 'ไม่มีรายการบริการ',

    subtotalLabel: 'รวมเป็นเงิน',
    grandTotalLabel: 'จำนวนเงินรวมทั้งสิ้น',
    currencyUnit: 'บาท',
    paymentTitle: 'ข้อมูลการชำระเงิน (PAYMENT DETAILS)',
    bankLabel: 'ธนาคาร:',
    accountNameLabel: 'ชื่อบัญชี:',
    accountNoLabel: 'เลขที่บัญชี:',

    // Signatures
    inNameOfCustomer: 'ในนามลูกค้า',
    sigCustomerSub: 'ผู้รับวางบิล / ผู้มีอำนาจลงนาม',
    sigCompanyTitle: 'ในนาม บจก. เอส.ที.ทราน เอ็กซ์เพรส',
    sigCompanySub: 'ผู้วางบิล / ผู้มีอำนาจลงนาม',
    dateLabel: 'วันที่',

    // Footer
    pageInfo: 'หน้า 1/1'
  },
  en: {
    // Right Panel Header & Labels
    modalTitle: 'Invoice',
    modalSubtitle: 'ใบแจ้งหนี้',
    langSelectorLabel: 'Document Language / ภาษาเอกสาร',
    thBtn: 'ภาษาไทย',
    enBtn: 'English',
    docSummaryTitle: 'Invoice Summary',
    summaryNo: 'Invoice No.',
    summaryDate: 'Invoice Date',
    summaryDueDate: 'Due Date',
    summaryCreditTerm: 'Credit Term',
    summaryCustomer: 'Billed To',
    summaryTotal: 'Grand Total',
    daysUnit: 'days',
    itemsUnit: 'items',
    printBtn: 'Print / Export PDF',
    closeBtn: 'Close',
    printHint: 'Formatted for standard A4. Ready to print or export directly as PDF.',

    // Document Sheet Content
    companyName: 'S.T. TRANS EXPRESS CO., LTD.',
    companyAddress: '123/4 Moo 2, Samnak Kham, Sadao, Songkhla 90320',
    taxIdLabel: 'Tax Identification No.: 0905566002392',
    telLabel: 'Tel. 098-2591455 / 098-0150083',
    docTitle: 'INVOICE',
    docSubtitle: '(ใบแจ้งหนี้)',

    // Cards
    billToTitle: 'BILL TO',
    docDetailsTitle: 'DOCUMENT DETAILS',

    labelTax: 'Tax ID',
    labelAddress: 'Address',
    labelContact: 'Contact',
    labelPhone: 'Telephone',

    labelInvoiceNo: 'Invoice No.',
    labelIssueDate: 'Invoice Date',
    labelDueDate: 'Due Date',
    labelCreditTerm: 'Credit Term',

    // Table Headers
    thItem: 'ITEM',
    thDesc: 'DESCRIPTION / SERVICES',
    thQty: 'QUANTITY',
    thUnit: 'UNIT',
    thUnitPrice: 'UNIT PRICE',
    thAmount: 'AMOUNT (THB)',
    noItems: 'No items listed',

    subtotalLabel: 'Subtotal',
    grandTotalLabel: 'Total Amount',
    currencyUnit: 'THB',
    paymentTitle: 'PAYMENT DETAILS',
    bankLabel: 'Bank:',
    accountNameLabel: 'Account Name:',
    accountNoLabel: 'Account Number:',

    // Signatures
    inNameOfCustomer: 'Customer / Client',
    sigCustomerSub: 'Received By / Authorized Signature',
    sigCompanyTitle: 'For S.T. Trans Express Co., Ltd.',
    sigCompanySub: 'Authorized Signature / Collector',
    dateLabel: 'Date',

    // Footer
    pageInfo: 'Page 1 of 1'
  }
};

export default invoiceDictionary;
