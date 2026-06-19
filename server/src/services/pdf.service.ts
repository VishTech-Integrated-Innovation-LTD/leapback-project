import { PDFDocument, rgb, StandardFonts, RGB } from 'pdf-lib';
import fs   from 'fs';
import path from 'path';
import { CompanySettings } from '../models'; // Adjust path to your models

// ------------------------------------------------------------------------------------
// TYPES
// Defines the shape of data passed to generatePDF
// Used for both quote PDFs and invoice PDFs
// ------------------------------------------------------------------------------------

export interface PDFLineItem {
  itemName:  string;
  itemType:  string;
  quantity:  number;
  unitPrice: number;
  lineTotal: number;
}

export interface PDFData {
  type:       'quote' | 'invoice';
  refNumber:  string;             // e.g. "QT-024" or "INV-018"
  linkedRef?: string;             // Invoice shows "Quote Ref: QT-023"
  client: {
    clientName:     string;       // clientName - can be a company or individual
    contactPerson?: string | null;
    email?:         string | null;
    phone?:         string | null;
  };
  items:      PDFLineItem[];
  subtotal:   number;
  vatRate:    number | null;      // null means no VAT applied
  vatAmount:  number | null;      // null means no VAT applied
  grandTotal: number;
  issueDate:  string;
  dueDate?:   string;
  status?:    string;
}

export interface CompanyDetails {
  companyName: string;
  companyAddress: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  invoiceFooter: string | null;
  bankAccounts: Array<{
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    isDefault: boolean;
    currency?: string;
    sortCode?: string;
  }>;
}

// ------------------------------------------------------------------------------------
// COLOURS - Leapback brand palette
// Dark navy header/footer, gold accents - matches the Leapback website
// ------------------------------------------------------------------------------------
const NAVY:  RGB = rgb(0.039, 0.059, 0.118);  // #0A0F1E - Leapback dark navy
const GOLD:  RGB = rgb(0.910, 0.631, 0.125);  // #E8A120 - Leapback gold/yellow accent
const BLACK: RGB = rgb(0,     0,     0);
const GREY:  RGB = rgb(0.5,   0.5,   0.5);
const WHITE: RGB = rgb(1,     1,     1);
const LIGHT: RGB = rgb(0.95,  0.95,  0.95);   // alternating row background

// ------------------------------------------------------------------------------------
// OUTPUT DIRECTORIES
// Quotes saved to /pdfs/quotes, invoices saved to /pdfs/invoices
// Kept separate for easier archiving and management
// Directories are created on startup if they don't exist
// ------------------------------------------------------------------------------------
const QUOTES_DIR   = path.join(__dirname, '../../pdfs/quotes');
const INVOICES_DIR = path.join(__dirname, '../../pdfs/invoices');
if (!fs.existsSync(QUOTES_DIR))   fs.mkdirSync(QUOTES_DIR,   { recursive: true });
if (!fs.existsSync(INVOICES_DIR)) fs.mkdirSync(INVOICES_DIR, { recursive: true });

// ------------------------------------------------------------------------------------
// HELPER - GET COMPANY SETTINGS FROM DATABASE
// Fetches the company settings from the database
// ------------------------------------------------------------------------------------
async function getCompanySettingsFromDB(): Promise<CompanyDetails> {
  try {
    let settings = await CompanySettings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await CompanySettings.create({
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
    
    // Convert undefined to null to match CompanyDetails type
    return {
      companyName: settings.companyName,
      companyAddress: settings.companyAddress ?? null,
      companyEmail: settings.companyEmail ?? null,
      companyPhone: settings.companyPhone ?? null,
      invoiceFooter: settings.invoiceFooter ?? null,
      bankAccounts: settings.bankAccounts ?? [],
    };
  } catch (error) {
    console.error('Error fetching company settings:', error);
    // Fallback to environment variables if database fetch fails
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
// Naira symbol (₦) removed to avoid WinAnsi encoding error in pdf-lib
// The currency context is clear from the document itself
// ------------------------------------------------------------------------------------

const fmt = (n: number): string =>
  'NGN ' + Number(n).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ------------------------------------------------------------------------------------
// HELPER - GET DEFAULT BANK ACCOUNT
// Returns the default bank account or the first one if no default is set
// ------------------------------------------------------------------------------------
function getDefaultBankAccount(bankAccounts: CompanyDetails['bankAccounts']) {
  const defaultAccount = bankAccounts.find(acc => acc.isDefault);
  return defaultAccount || (bankAccounts.length > 0 ? bankAccounts[0] : null);
}

// ------------------------------------------------------------------------------------
// HELPER - FORMAT BANK DETAILS
// Formats multiple bank accounts for display
// ------------------------------------------------------------------------------------
function formatBankDetails(bankAccounts: CompanyDetails['bankAccounts']): string[] {
  const lines: string[] = [];
  
  for (const account of bankAccounts) {
    const line = `${account.bankName} - ${account.accountNumber} (${account.accountName})${account.isDefault ? ' - Default' : ''}`;
    lines.push(line);
    if (account.sortCode) {
      lines.push(`  Sort Code: ${account.sortCode}`);
    }
    if (account.currency && account.currency !== 'NGN') {
      lines.push(`  Currency: ${account.currency}`);
    }
  }
  
  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE PDF
// Produces a branded A4 PDF for a quote or invoice
// Returns the file path of the saved PDF
// ─────────────────────────────────────────────────────────────────────────────
export async function generatePDF(data: PDFData): Promise<string> {
  const {
    type, refNumber, linkedRef,
    client, items,
    subtotal, vatRate, vatAmount, grandTotal,
    issueDate, dueDate, status,
  } = data;

  // Fetch company details from database
  const company = await getCompanySettingsFromDB();

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);   // A4 in points
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // ── Header bar - dark navy background ──────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: NAVY });
  page.drawText(company.companyName.toUpperCase(), {
    x: 40, y: height - 38, size: 18, font: fontBold, color: GOLD,
  });
  page.drawText('Your Partner in IT, Energy & Business Transformation', {
    x: 40, y: height - 58, size: 8, font: fontReg, color: rgb(0.75, 0.75, 0.75),
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
  if (dueDate) page.drawText(`Due Date: ${dueDate}`, { x: 40, y: y - 32, size: 9, font: fontReg, color: GREY });
  if (linkedRef) page.drawText(`Quote Ref: ${linkedRef}`, { x: 40, y: y - 46, size: 9, font: fontReg, color: GREY });
  if (status) {
    const statusColor = status === 'paid' ? rgb(0.1, 0.6, 0.1) : NAVY;
    page.drawText(`Status: ${status.toUpperCase()}`, {
      x: 40, y: y - 60, size: 9, font: fontBold, color: statusColor,
    });
  }

  // ── Billed To ──────────────────────────────────────────────────────────────
  const bx = width / 2;
  page.drawText('BILLED TO', { x: bx, y, size: 9, font: fontBold, color: GREY });
  page.drawText(client.clientName, { x: bx, y: y - 16, size: 11, font: fontBold, color: BLACK });
  if (client.contactPerson) page.drawText(`Attn: ${client.contactPerson}`, { x: bx, y: y - 30, size: 9, font: fontReg, color: BLACK });
  if (client.email) page.drawText(client.email, { x: bx, y: y - 44, size: 9, font: fontReg, color: GREY });
  if (client.phone) page.drawText(client.phone, { x: bx, y: y - 58, size: 9, font: fontReg, color: GREY });

  // ── Items table ────────────────────────────────────────────────────────────
  y -= 90;
  const cols = { item: 40, type: 240, qty: 310, price: 390, total: 490 };

  // Table header row
  page.drawRectangle({ x: 30, y: y - 4, width: width - 60, height: 22, color: NAVY });
  const headers = ['ITEM', 'TYPE', 'QTY', 'UNIT PRICE', 'TOTAL'];
  const colX = [cols.item, cols.type, cols.qty, cols.price, cols.total];
  headers.forEach((h, i) => {
    page.drawText(h, { x: colX[i], y: y + 4, size: 9, font: fontBold, color: GOLD });
  });
  y -= 24;

  // Table rows
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

  const totRow = (label: string, value: string, bold = false, accent = false) => {
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

  // ── Payment details (invoices only) - COMPLETELY REWRITTEN ─────────────────
  if (type === 'invoice' && company.bankAccounts.length > 0) {
    // Add some spacing
    y -= 24;
    
    // Section header
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: NAVY });
    page.drawText('PAYMENT DETAILS', { x: 45, y: y + 6, size: 10, font: fontBold, color: GOLD });
    y -= 30;
    
    // Draw each bank account
    for (const [index, account] of company.bankAccounts.entries()) {
      // Card background with border
      const cardHeight = 70;
      const cardY = y - cardHeight + 8;
      
      // Draw card background
      page.drawRectangle({
        x: 45,
        y: cardY,
        width: width - 90,
        height: cardHeight,
        color: account.isDefault ? rgb(0.98, 0.96, 0.92) : WHITE,
        borderColor: account.isDefault ? GOLD : GREY,
        borderWidth: 0.5,
      });
      
      // Gold left border for default account
      if (account.isDefault) {
        page.drawRectangle({
          x: 45,
          y: cardY,
          width: 4,
          height: cardHeight,
          color: GOLD
        });
      }
      
      let innerY = y - 8;
      
      // Bank name (bold)
      page.drawText(account.bankName, {
        x: 55,
        y: innerY,
        size: 10,
        font: fontBold,
        color: NAVY
      });
      
      // Default badge
      // if (account.isDefault) {
      //   const badgeText = 'DEFAULT';
      //   const badgeWidth = fontBold.widthOfTextAtSize(badgeText, 7);
      //   page.drawRectangle({
      //     x: 55 + fontBold.widthOfTextAtSize(account.bankName, 10) + 8,
      //     y: innerY - 9,
      //     width: badgeWidth + 8,
      //     height: 12,
      //     color: GOLD
      //   });
      //   page.drawText(badgeText, {
      //     x: 55 + fontBold.widthOfTextAtSize(account.bankName, 10) + 12,
      //     y: innerY - 2,
      //     size: 7,
      //     font: fontBold,
      //     color: WHITE
      //   });
      // }
      
      innerY -= 16;
      
      // Account number
      page.drawText(`Account Number: ${account.accountNumber}`, {
        x: 55,
        y: innerY,
        size: 8,
        font: fontReg,
        color: BLACK
      });
      
      innerY -= 14;
      
      // Account name
      page.drawText(`Account Name: ${account.accountName}`, {
        x: 55,
        y: innerY,
        size: 8,
        font: fontReg,
        color: BLACK
      });
      
      innerY -= 14;
      
      // Sort code if available
      if (account.sortCode) {
        page.drawText(`Sort Code: ${account.sortCode}`, {
          x: 55,
          y: innerY,
          size: 8,
          font: fontReg,
          color: GREY
        });
      }
      
      // Update Y position for next card
      y -= (cardHeight + 12);
    }
    
    // Add payment instruction note
    if (company.bankAccounts.length > 0) {
      y -= 8;
      page.drawText('Please use the invoice number as payment reference.', {
        x: 45,
        y,
        size: 8,
        font: fontItalic,
        color: GREY
      });
    }
  } else if (type === 'invoice') {
    // No bank accounts configured
    y -= 24;
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: NAVY });
    page.drawText('PAYMENT DETAILS', { x: 45, y: y + 6, size: 10, font: fontBold, color: GOLD });
    y -= 24;
    page.drawText('Payment details will be provided upon request.', {
      x: 45,
      y,
      size: 9,
      font: fontReg,
      color: GREY
    });
  }

  // ── Footer bar - dark navy background ──────────────────────────────────────
  const footerParts = [company.companyName];
  if (company.companyAddress) footerParts.push(company.companyAddress);
  if (company.companyEmail) footerParts.push(company.companyEmail);
  if (company.companyPhone) footerParts.push(company.companyPhone);

  const footerText = footerParts.join(' · ');

  page.drawRectangle({ x: 0, y: 0, width, height: 45, color: NAVY });
  page.drawText(
    footerText,
    { x: 40, y: 26, size: 8, font: fontReg, color: rgb(0.75, 0.75, 0.75) }
  );

  if (company.invoiceFooter) {
    page.drawText(company.invoiceFooter, { x: 40, y: 12, size: 8, font: fontBold, color: GOLD });
  }

  // ── Save to the correct directory based on document type ───────────────────
  const outputDir = type === 'quote' ? QUOTES_DIR : INVOICES_DIR;
  const fileName = `${type}-${refNumber}-${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, await doc.save());

  return filePath;
}

// ------------------------------------------------------------------------------------
// EXPORT HELPER FUNCTIONS for use in other parts of the application
// ------------------------------------------------------------------------------------
export { getCompanySettingsFromDB, getDefaultBankAccount };