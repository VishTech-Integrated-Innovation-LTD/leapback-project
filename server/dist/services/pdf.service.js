"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDF = generatePDF;
const pdf_lib_1 = require("pdf-lib");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ------------------------------------------------------------------------------------
// COLOURS - Leapback brand palette
// Dark navy header/footer, gold accents - matches the Leapback website
// ------------------------------------------------------------------------------------
const NAVY = (0, pdf_lib_1.rgb)(0.039, 0.059, 0.118); // #0A0F1E - Leapback dark navy
const GOLD = (0, pdf_lib_1.rgb)(0.910, 0.631, 0.125); // #E8A120 - Leapback gold/yellow accent
const BLACK = (0, pdf_lib_1.rgb)(0, 0, 0);
const GREY = (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5);
const WHITE = (0, pdf_lib_1.rgb)(1, 1, 1);
const LIGHT = (0, pdf_lib_1.rgb)(0.95, 0.95, 0.95); // alternating row background
// ------------------------------------------------------------------------------------
// OUTPUT DIRECTORIES
// Quotes saved to /pdfs/quotes, invoices saved to /pdfs/invoices
// Kept separate for easier archiving and management
// Directories are created on startup if they don't exist
// ------------------------------------------------------------------------------------
const QUOTES_DIR = path_1.default.join(__dirname, '../../pdfs/quotes');
const INVOICES_DIR = path_1.default.join(__dirname, '../../pdfs/invoices');
if (!fs_1.default.existsSync(QUOTES_DIR))
    fs_1.default.mkdirSync(QUOTES_DIR, { recursive: true });
if (!fs_1.default.existsSync(INVOICES_DIR))
    fs_1.default.mkdirSync(INVOICES_DIR, { recursive: true });
// ------------------------------------------------------------------------------------
// HELPER - FORMAT CURRENCY
// Naira symbol (₦) removed to avoid WinAnsi encoding error in pdf-lib
// The currency context is clear from the document itself
// ------------------------------------------------------------------------------------
const fmt = (n) => 'NGN ' + Number(n).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
// ─────────────────────────────────────────────────────────────────────────────
// GENERATE PDF
// Produces a branded A4 PDF for a quote or invoice
// Returns the file path of the saved PDF
// ─────────────────────────────────────────────────────────────────────────────
async function generatePDF(data) {
    const { type, refNumber, linkedRef, client, items, subtotal, vatRate, vatAmount, grandTotal, issueDate, dueDate, status, } = data;
    // Company details read from .env - editable without touching code
    const company = {
        name: process.env.COMPANY_NAME ?? 'Leapback',
        address: process.env.COMPANY_ADDRESS ?? 'Abuja, Nigeria',
        email: process.env.COMPANY_EMAIL ?? 'info@leapback.ng',
        phone: process.env.COMPANY_PHONE ?? '+234-813-000-2778',
        bank: process.env.COMPANY_BANK ?? 'GTBank',
        account: process.env.COMPANY_ACCOUNT ?? '0123456789',
        footer: process.env.INVOICE_FOOTER ?? 'Thank you for your business.',
    };
    const doc = await pdf_lib_1.PDFDocument.create();
    const page = doc.addPage([595, 842]); // A4 in points
    const { width, height } = page.getSize();
    const fontBold = await doc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const fontReg = await doc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    // ── Header bar - dark navy background ──────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: NAVY });
    page.drawText(company.name.toUpperCase(), {
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
    // Table header row - navy background with gold text
    page.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 22, color: NAVY });
    const headers = ['ITEM', 'TYPE', 'QTY', 'UNIT PRICE', 'TOTAL'];
    const colX = [cols.item, cols.type, cols.qty, cols.price, cols.total];
    headers.forEach((h, i) => {
        page.drawText(h, { x: colX[i], y: y + 4, size: 9, font: fontBold, color: GOLD });
    });
    y -= 24;
    // Table rows - alternating background
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
    // Only render VAT row if VAT was actually applied
    if (vatRate !== null && vatAmount !== null) {
        totRow(`VAT (${vatRate}%)`, fmt(vatAmount));
    }
    // Divider line above grand total - gold accent
    page.drawLine({
        start: { x: tx, y: y + 4 }, end: { x: width - 40, y: y + 4 },
        thickness: 1, color: GOLD,
    });
    y -= 6;
    totRow('TOTAL DUE', fmt(grandTotal), true, true);
    // ── Payment details (invoices only) ────────────────────────────────────────
    if (type === 'invoice') {
        y -= 20;
        page.drawText('Payment Details', { x: 40, y, size: 10, font: fontBold, color: NAVY });
        y -= 16;
        page.drawText(`Bank: ${company.bank}   |   Account: ${company.account}`, { x: 40, y, size: 9, font: fontReg, color: GREY });
    }
    // ── Footer bar - dark navy background ──────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width, height: 45, color: NAVY });
    page.drawText(`${company.name} · ${company.address} · ${company.email} · ${company.phone}`, { x: 40, y: 26, size: 8, font: fontReg, color: (0, pdf_lib_1.rgb)(0.75, 0.75, 0.75) });
    page.drawText(company.footer, { x: 40, y: 12, size: 8, font: fontBold, color: GOLD });
    // ── Save to the correct directory based on document type ───────────────────
    const outputDir = type === 'quote' ? QUOTES_DIR : INVOICES_DIR;
    const fileName = `${type}-${refNumber}-${Date.now()}.pdf`;
    const filePath = path_1.default.join(outputDir, fileName);
    fs_1.default.writeFileSync(filePath, await doc.save());
    return filePath;
}
//# sourceMappingURL=pdf.service.js.map