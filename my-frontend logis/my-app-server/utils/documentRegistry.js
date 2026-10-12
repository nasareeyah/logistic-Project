const db = require('../config/db');
const { nextId } = require('./dbHelpers');

/**
 * Sync document entry into Central Document Registry (table `document`)
 * Supports Quotation, Invoice, Receipt, DeliveryOrder, Booking
 */
async function syncDocumentRegistry({
    documentType,
    refId,
    documentNo,
    customerId = null,
    customerName = null,
    documentDate = null,
    grandTotal = 0,
    status = 'Active',
    remark = null
}) {
    if (!refId || !documentNo || !documentType) return null;

    try {
        // If customerName is not provided but customerId is, resolve customerName
        let resolvedCustName = customerName;
        if (!resolvedCustName && customerId) {
            try {
                const cRes = await db.query('SELECT customer_name FROM customers WHERE customer_id = $1', [customerId]);
                if (cRes.rows.length > 0) resolvedCustName = cRes.rows[0].customer_name;
            } catch {}
        }

        const parsedDate = documentDate ? new Date(documentDate) : new Date();
        const finalDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        const finalTotal = parseFloat(grandTotal) || 0;

        const checkRes = await db.query(
            'SELECT document_id FROM document WHERE ref_id = $1 OR (document_type = $2 AND document_no = $3)',
            [refId, documentType, documentNo]
        );

        if (checkRes.rows.length > 0) {
            const docId = checkRes.rows[0].document_id;
            await db.query(`
                UPDATE document SET
                    document_type = $1,
                    ref_id = $2,
                    document_no = $3,
                    customer_id = $4,
                    customer_name = $5,
                    document_date = $6,
                    grand_total = $7,
                    remark = $8,
                    updated_at = CURRENT_TIMESTAMP
                WHERE document_id = $9
            `, [
                documentType,
                refId,
                documentNo,
                customerId || null,
                resolvedCustName || null,
                finalDate,
                finalTotal,
                remark || null,
                docId
            ]);
            return docId;
        } else {
            const docId = await nextId('seq_document', 'doc-', 6);
            await db.query(`
                INSERT INTO document (
                    document_id, document_type, ref_id, document_no,
                    customer_id, customer_name, document_date,
                    grand_total, remark
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                docId,
                documentType,
                refId,
                documentNo,
                customerId || null,
                resolvedCustName || null,
                finalDate,
                finalTotal,
                remark || null
            ]);
            return docId;
        }
    } catch (err) {
        console.error('Error syncing document registry:', err);
        return null;
    }
}

/**
 * Remove document from Central Document Registry by ref_id or document_no
 */
async function removeDocumentRegistry(refIdOrNo) {
    if (!refIdOrNo) return;
    try {
        await db.query('DELETE FROM document WHERE ref_id = $1 OR document_no = $1', [refIdOrNo]);
    } catch (err) {
        console.error('Error removing document from registry:', err);
    }
}

module.exports = {
    syncDocumentRegistry,
    removeDocumentRegistry
};
