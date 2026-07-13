"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDFBuffer = generatePDFBuffer;
// pdf.service.ts - Complete working version
const pdf_lib_1 = require("pdf-lib");
const models_1 = require("../models");
// ------------------------------------------------------------------------------------
// COLOURS
// ------------------------------------------------------------------------------------
const NAVY = (0, pdf_lib_1.rgb)(0.039, 0.059, 0.118);
const GOLD = (0, pdf_lib_1.rgb)(0.910, 0.631, 0.125);
const BLACK = (0, pdf_lib_1.rgb)(0, 0, 0);
const GREY = (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5);
const WHITE = (0, pdf_lib_1.rgb)(1, 1, 1);
const LIGHT = (0, pdf_lib_1.rgb)(0.95, 0.95, 0.95);
// ------------------------------------------------------------------------------------
// HELPER - GET COMPANY SETTINGS FROM DATABASE
// ------------------------------------------------------------------------------------
async function getCompanySettingsFromDB() {
    try {
        let settings = await models_1.CompanySettings.findOne();
        if (!settings) {
            settings = await models_1.CompanySettings.create({
                companyName: process.env.COMPANY_NAME || 'Leapback',
                companyEmail: process.env.COMPANY_EMAIL || null,
                companyPhone: process.env.COMPANY_PHONE || null,
                companyAddress: process.env.COMPANY_ADDRESS || null,
                invoiceFooter: process.env.INVOICE_FOOTER || 'Thank you for your business.',
                defaultVatRate: Number(process.env.DEFAULT_VAT_RATE) || 7.5,
                bankAccounts: [
                    {
                        id: 'default',
                        bankName: process.env.COMPANY_BANK || 'GTBank',
                        accountNumber: process.env.COMPANY_ACCOUNT || '0123456789',
                        accountName: process.env.COMPANY_ACCOUNT_NAME || 'Leapback Limited',
                        isDefault: true,
                        currency: 'NGN',
                    }
                ],
            });
        }
        return {
            companyName: settings.companyName,
            companyAddress: settings.companyAddress ?? null,
            companyEmail: settings.companyEmail ?? null,
            companyPhone: settings.companyPhone ?? null,
            invoiceFooter: settings.invoiceFooter ?? null,
            bankAccounts: settings.bankAccounts ?? [],
        };
    }
    catch (error) {
        console.error('Error fetching company settings:', error);
        return {
            companyName: process.env.COMPANY_NAME || 'Leapback',
            companyAddress: process.env.COMPANY_ADDRESS || null,
            companyEmail: process.env.COMPANY_EMAIL || null,
            companyPhone: process.env.COMPANY_PHONE || null,
            invoiceFooter: process.env.INVOICE_FOOTER || 'Thank you for your business.',
            bankAccounts: [
                {
                    id: 'default',
                    bankName: process.env.COMPANY_BANK || 'GTBank',
                    accountNumber: process.env.COMPANY_ACCOUNT || '0123456789',
                    accountName: process.env.COMPANY_ACCOUNT_NAME || 'Leapback Limited',
                    isDefault: true,
                    currency: 'NGN',
                }
            ],
        };
    }
}
// ------------------------------------------------------------------------------------
// HELPER - FORMAT CURRENCY
// ------------------------------------------------------------------------------------
const fmt = (n) => 'NGN ' + Number(n).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
// ------------------------------------------------------------------------------------
// GENERATE PDF BUFFER (NO FILE SAVING)
// Returns Uint8Array that can be streamed to client
// ------------------------------------------------------------------------------------
async function generatePDFBuffer(data) {
    const { type, refNumber, linkedRef, client, items, subtotal, vatRate, vatAmount, grandTotal, issueDate, dueDate, status, } = data;
    const company = await getCompanySettingsFromDB();
    const doc = await pdf_lib_1.PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const fontBold = await doc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const fontReg = await doc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    const fontItalic = await doc.embedFont(pdf_lib_1.StandardFonts.HelveticaOblique);
    // ── Header bar ──────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: NAVY });
    page.drawText(company.companyName.toUpperCase(), {
        x: 40, y: height - 38, size: 18, font: fontBold, color: GOLD,
    });
    page.drawText('Your Partner in IT, Energy & Business Transformation', {
        x: 40, y: height - 58, size: 8, font: fontReg, color: (0, pdf_lib_1.rgb)(0.75, 0.75, 0.75),
    });
    const docLabel = type === 'invoice' ? 'INVOICE' : 'QUOTATION';
    const labelW = fontBold.widthOfTextAtSize(docLabel, 22);
    page.drawText(docLabel, {
        x: width - 40 - labelW, y: height - 48, size: 22, font: fontBold, color: WHITE,
    });
    let y = height - 110;
    // ── Reference & dates ──────────────────────────────────────────────────────
    page.drawText(`#${refNumber}`, { x: 40, y, size: 13, font: fontBold, color: NAVY });
    page.drawText(`Issue Date: ${issueDate}`, { x: 40, y: y - 18, size: 9, font: fontReg, color: GREY });
    if (dueDate)
        page.drawText(`Due Date: ${dueDate}`, { x: 40, y: y - 32, size: 9, font: fontReg, color: GREY });
    if (linkedRef)
        page.drawText(`Quote Ref: ${linkedRef}`, { x: 40, y: y - 46, size: 9, font: fontReg, color: GREY });
    if (status) {
        const statusColor = status === 'paid' ? (0, pdf_lib_1.rgb)(0.1, 0.6, 0.1) : NAVY;
        page.drawText(`Status: ${status.toUpperCase()}`, {
            x: 40, y: y - 60, size: 9, font: fontBold, color: statusColor,
        });
    }
    // ── Billed To ──────────────────────────────────────────────────────────────
    const bx = width / 2;
    page.drawText('BILLED TO', { x: bx, y, size: 9, font: fontBold, color: GREY });
    page.drawText(client.clientName, { x: bx, y: y - 16, size: 11, font: fontBold, color: BLACK });
    if (client.contactPerson)
        page.drawText(`Attn: ${client.contactPerson}`, { x: bx, y: y - 30, size: 9, font: fontReg, color: BLACK });
    if (client.email)
        page.drawText(client.email, { x: bx, y: y - 44, size: 9, font: fontReg, color: GREY });
    if (client.phone)
        page.drawText(client.phone, { x: bx, y: y - 58, size: 9, font: fontReg, color: GREY });
    // ── Items table ────────────────────────────────────────────────────────────
    y -= 90;
    const cols = { item: 40, type: 240, qty: 310, price: 390, total: 490 };
    page.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 22, color: NAVY });
    const headers = ['ITEM', 'TYPE', 'QTY', 'UNIT PRICE', 'TOTAL'];
    const colX = [cols.item, cols.type, cols.qty, cols.price, cols.total];
    headers.forEach((h, i) => {
        page.drawText(h, { x: colX[i], y: y + 4, size: 9, font: fontBold, color: GOLD });
    });
    y -= 24;
    items.forEach((item, i) => {
        const rowColor = i % 2 === 0 ? WHITE : LIGHT;
        page.drawRectangle({ x: 30, y: y - 6, width: width - 60, height: 20, color: rowColor });
        page.drawText(item.itemName.substring(0, 35), { x: cols.item, y, size: 9, font: fontReg, color: BLACK });
        page.drawText(item.itemType, { x: cols.type, y, size: 9, font: fontReg, color: GREY });
        page.drawText(String(item.quantity), { x: cols.qty, y, size: 9, font: fontReg, color: BLACK });
        page.drawText(fmt(item.unitPrice), { x: cols.price, y, size: 9, font: fontReg, color: BLACK });
        const totalW = fontBold.widthOfTextAtSize(fmt(item.lineTotal), 9);
        page.drawText(fmt(item.lineTotal), { x: width - 40 - totalW, y, size: 9, font: fontBold, color: BLACK });
        y -= 22;
    });
    // ── Totals block ───────────────────────────────────────────────────────────
    y -= 14;
    const tx = width - 200;
    const totRow = (label, value, bold = false, accent = false) => {
        const f = bold ? fontBold : fontReg;
        const c = accent ? GOLD : BLACK;
        page.drawText(label, { x: tx, y, size: 10, font: f, color: c });
        const vw = f.widthOfTextAtSize(value, 10);
        page.drawText(value, { x: width - 40 - vw, y, size: 10, font: f, color: c });
        y -= 18;
    };
    totRow('Subtotal', fmt(subtotal));
    if (vatRate !== null && vatAmount !== null) {
        totRow(`VAT (${vatRate}%)`, fmt(vatAmount));
    }
    page.drawLine({
        start: { x: tx, y: y + 4 }, end: { x: width - 40, y: y + 4 },
        thickness: 1, color: GOLD,
    });
    y -= 6;
    totRow('TOTAL DUE', fmt(grandTotal), true, true);
    // ── Payment details (invoices only) ──────────────────────────────────────
    if (type === 'invoice' && company.bankAccounts.length > 0) {
        y -= 24;
        page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: NAVY });
        page.drawText('PAYMENT DETAILS', { x: 45, y: y + 6, size: 10, font: fontBold, color: GOLD });
        y -= 30;
        for (const account of company.bankAccounts) {
            const cardHeight = 70;
            const cardY = y - cardHeight + 8;
            page.drawRectangle({
                x: 45,
                y: cardY,
                width: width - 90,
                height: cardHeight,
                color: account.isDefault ? (0, pdf_lib_1.rgb)(0.98, 0.96, 0.92) : WHITE,
                borderColor: account.isDefault ? GOLD : GREY,
                borderWidth: 0.5,
            });
            if (account.isDefault) {
                page.drawRectangle({ x: 45, y: cardY, width: 4, height: cardHeight, color: GOLD });
            }
            let innerY = y - 8;
            page.drawText(account.bankName, { x: 55, y: innerY, size: 10, font: fontBold, color: NAVY });
            innerY -= 16;
            page.drawText(`Account Number: ${account.accountNumber}`, { x: 55, y: innerY, size: 8, font: fontReg, color: BLACK });
            innerY -= 14;
            page.drawText(`Account Name: ${account.accountName}`, { x: 55, y: innerY, size: 8, font: fontReg, color: BLACK });
            if (account.sortCode) {
                innerY -= 14;
                page.drawText(`Sort Code: ${account.sortCode}`, { x: 55, y: innerY, size: 8, font: fontReg, color: GREY });
            }
            y -= (cardHeight + 12);
        }
        y -= 8;
        page.drawText('Please use the invoice number as payment reference.', {
            x: 45,
            y,
            size: 8,
            font: fontItalic,
            color: GREY
        });
    }
    // ── Footer bar ──────────────────────────────────────────────────────────────
    const footerParts = [company.companyName];
    if (company.companyAddress)
        footerParts.push(company.companyAddress);
    if (company.companyEmail)
        footerParts.push(company.companyEmail);
    if (company.companyPhone)
        footerParts.push(company.companyPhone);
    const footerText = footerParts.join(' · ');
    page.drawRectangle({ x: 0, y: 0, width, height: 45, color: NAVY });
    page.drawText(footerText, { x: 40, y: 26, size: 8, font: fontReg, color: (0, pdf_lib_1.rgb)(0.75, 0.75, 0.75) });
    if (company.invoiceFooter) {
        page.drawText(company.invoiceFooter, { x: 40, y: 12, size: 8, font: fontBold, color: GOLD });
    }
    // ── Return PDF bytes (NO FILE SAVING) ──────────────────────────────────────
    return await doc.save();
}
//# sourceMappingURL=pdf-new.js.map