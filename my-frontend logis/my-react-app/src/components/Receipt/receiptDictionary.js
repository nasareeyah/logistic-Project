/**
 * Language Dictionary for Receipt (ใบเสร็จรับเงิน)
 * แยกคลังคำศัพท์และข้อความทั้งหมดออกจากส่วนแสดงผล (Separation of Concerns)
 */

export const receiptDictionary = {
  th: {
    // Right Panel Header & Labels
    modalTitle: 'ใบเสร็จรับเงิน',
    modalSubtitle: 'RECEIPT',
    langSelectorLabel: 'ภาษาเอกสาร / Document Language',
    thBtn: 'ภาษาไทย',
    enBtn: 'English',
    docSummaryTitle: 'ข้อมูลใบเสร็จรับเงินโดยย่อ',
    summaryNo: 'เลขที่ใบเสร็จ',
    summaryDate: 'วันที่รับชำระ',
    summaryRefInvoice: 'อ้างอิงใบแจ้งหนี้',
    summaryMethod: 'วิธีชำระเงิน',
    summaryCustomer: 'ได้รับเงินจาก',
    summaryTotal: 'ยอดเงินรับชำระทั้งสิ้น',
    itemsUnit: 'รายการ',
    printBtn: 'Print / Export PDF',
    closeBtn: 'ปิดหน้าต่าง',
    printHint: 'เอกสารถูกจัดวางในขนาด A4 มาตรฐาน พร้อมสั่งพิมพ์หรือบันทึกเป็น PDF ได้ทันที',

    // Document Sheet Content
    companyName: 'บริษัท เอส.ที.ทราน เอ็กซ์เพรส จำกัด',
    companyAddress: '123/4 หมู่ที่ 2 ต.สำนักขาม อ.สะเดา จ.สงขลา 90320',
    taxIdLabel: 'เลขประจำตัวผู้เสียภาษี: 0905566002392',
    telLabel: 'โทร. 098-2591455 / 098-0150083',
    docTitle: 'ใบเสร็จรับเงิน',
    docSubtitle: 'RECEIPT',

    // Cards
    receivedFromTitle: 'ได้รับเงินจาก (RECEIVED FROM)',
    docDetailsTitle: 'รายละเอียดเอกสาร',

    labelTax: 'เลขภาษี',
    labelAddress: 'ที่อยู่',
    labelPhone: 'โทรศัพท์',

    labelReceiptNo: 'Receipt No.',
    labelReceiptDate: 'วันที่รับชำระ',
    labelRefInvoice: 'อ้างอิงใบแจ้งหนี้',
    labelPaymentMethod: 'วิธีชำระเงิน',

    // Table Headers
    thItem: 'ลำดับ',
    thDesc: 'รายการบริการ / รายละเอียด',
    thQty: 'จำนวน',
    thUnit: 'หน่วย',
    thUnitPrice: 'ราคา/หน่วย',
    thAmount: 'จำนวนเงิน (บาท)',
    defaultService: 'ค่าบริการขนส่งตามใบแจ้งหนี้',
    unitTrip: 'เที่ยว',

    subtotalLabel: 'รวมเป็นเงิน',
    grandTotalLabel: 'จำนวนเงินรวมทั้งสิ้น',
    currencyUnit: 'บาท',

    // Payment Section
    paymentTitle: 'ข้อมูลการรับชำระเงิน (PAYMENT DETAILS)',
    paymentMethodLabel: 'วิธีชำระ:',
    bankLabel: 'ธนาคาร:',
    accountNoLabel: 'เลขที่บัญชี:',
    actualPaidLabel: 'ยอดเงินที่รับชำระจริง:',

    // Signatures
    inNameOfCustomer: 'ในนามลูกค้า',
    sigCustomerSub: 'ผู้จ่ายเงิน / ผู้รับมอบฉันทะ',
    sigCompanyTitle: 'ในนาม บจก. เอส.ที.ทราน เอ็กซ์เพรส',
    sigCompanySub: 'ผู้รับเงิน / เจ้าหน้าที่การเงิน',
    dateLabel: 'วันที่',

    // Footer
    pageInfo: 'หน้า 1/1'
  },
  en: {
    // Right Panel Header & Labels
    modalTitle: 'Receipt',
    modalSubtitle: 'ใบเสร็จรับเงิน',
    langSelectorLabel: 'Document Language / ภาษาเอกสาร',
    thBtn: 'ภาษาไทย',
    enBtn: 'English',
    docSummaryTitle: 'Receipt Summary',
    summaryNo: 'Receipt No.',
    summaryDate: 'Receipt Date',
    summaryRefInvoice: 'Ref. Invoice No.',
    summaryMethod: 'Payment Method',
    summaryCustomer: 'Received From',
    summaryTotal: 'Total Amount Paid',
    itemsUnit: 'items',
    printBtn: 'Print / Export PDF',
    closeBtn: 'Close',
    printHint: 'Formatted for standard A4. Ready to print or export directly as PDF.',

    // Document Sheet Content
    companyName: 'S.T. TRANS EXPRESS CO., LTD.',
    companyAddress: '123/4 Moo 2, Samnak Kham, Sadao, Songkhla 90320',
    taxIdLabel: 'Tax Identification No.: 0905566002392',
    telLabel: 'Tel. 098-2591455 / 098-0150083',
    docTitle: 'RECEIPT',
    docSubtitle: '(ใบเสร็จรับเงิน)',

    // Cards
    receivedFromTitle: 'RECEIVED FROM',
    docDetailsTitle: 'DOCUMENT DETAILS',

    labelTax: 'Tax ID',
    labelAddress: 'Address',
    labelPhone: 'Telephone',

    labelReceiptNo: 'Receipt No.',
    labelReceiptDate: 'Payment Date',
    labelRefInvoice: 'Ref. Invoice',
    labelPaymentMethod: 'Payment Method',

    // Table Headers
    thItem: 'ITEM',
    thDesc: 'DESCRIPTION / SERVICES',
    thQty: 'QUANTITY',
    thUnit: 'UNIT',
    thUnitPrice: 'UNIT PRICE',
    thAmount: 'AMOUNT (THB)',
    defaultService: 'Transportation service as per invoice',
    unitTrip: 'trip',

    subtotalLabel: 'Subtotal',
    grandTotalLabel: 'Total Amount',
    currencyUnit: 'THB',

    // Payment Section
    paymentTitle: 'PAYMENT DETAILS',
    paymentMethodLabel: 'Method:',
    bankLabel: 'Bank:',
    accountNoLabel: 'Account Number:',
    actualPaidLabel: 'Net Amount Paid:',

    // Signatures
    inNameOfCustomer: 'Payer / Client',
    sigCustomerSub: 'Payer Signature / Authorized Proxy',
    sigCompanyTitle: 'For S.T. Trans Express Co., Ltd.',
    sigCompanySub: 'Cashier / Collector Signature',
    dateLabel: 'Date',

    // Footer
    pageInfo: 'Page 1 of 1'
  }
};

export default receiptDictionary;
