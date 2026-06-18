"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendQuoteEmail = sendQuoteEmail;
exports.sendInvoiceEmail = sendInvoiceEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORTER - lazy singleton
// The SMTP connection is created once on first use and reused for all emails
// Configured via .env - supports Gmail, Brevo, Ethereal, or any SMTP provider
// ─────────────────────────────────────────────────────────────────────────────
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT ?? '587'),
            secure: false, // true for port 465, false for 587 (STARTTLS)
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return transporter;
}
// ─────────────────────────────────────────────────────────────────────────────
// HELPER - BUILD ATTACHMENT
// Returns a nodemailer attachment array if the PDF exists on disk
// Returns empty array if pdfPath is null or the file doesn't exist
// ─────────────────────────────────────────────────────────────────────────────
const buildAttachment = (filename, pdfPath) => {
    if (pdfPath && fs_1.default.existsSync(pdfPath)) {
        return [{ filename: `${filename}.pdf`, path: pdfPath }];
    }
    return [];
};
// ─────────────────────────────────────────────────────────────────────────────
// HELPER - EMAIL HEADER
// Dark navy header with gold company name - matches Leapback brand palette
// ─────────────────────────────────────────────────────────────────────────────
const emailHeader = () => `
  <div style="background:#0A0F1E;padding:24px 32px">
    <h2 style="color:#E8A120;margin:0;font-family:sans-serif;font-size:20px;letter-spacing:1px">
      ${process.env.COMPANY_NAME?.toUpperCase() ?? 'LEAPBACK'}
    </h2>
    <p style="color:#aaa;margin:4px 0 0;font-size:11px;font-family:sans-serif">
      Your Partner in IT, Energy &amp; Business Transformation
    </p>
  </div>
`;
// ─────────────────────────────────────────────────────────────────────────────
// HELPER - EMAIL FOOTER
// Reads company details from .env for consistent footer across all emails
// ─────────────────────────────────────────────────────────────────────────────
const emailFooter = () => `
  <p style="color:#999;font-size:11px;margin-top:30px;border-top:1px solid #eee;padding-top:12px;font-family:sans-serif">
    ${process.env.COMPANY_NAME ?? 'Leapback'} &nbsp;·&nbsp;
    ${process.env.COMPANY_ADDRESS ?? 'Abuja, Nigeria'} &nbsp;·&nbsp;
    ${process.env.COMPANY_EMAIL ?? 'info@leapback.ng'}
  </p>
`;
// ─────────────────────────────────────────────────────────────────────────────
// SEND QUOTE EMAIL
// Sent automatically when a quote is submitted
// 💡 "Quote will be emailed to the client automatically on submission"
// ─────────────────────────────────────────────────────────────────────────────
async function sendQuoteEmail(opts) {
    const grandTotalFormatted = Number(opts.grandTotal).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
    });
    await getTransporter().sendMail({
        from: process.env.EMAIL_FROM,
        to: opts.to,
        subject: `Your Quotation from ${process.env.COMPANY_NAME ?? 'Leapback'} - ${opts.quoteNumber}`,
        html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
        ${emailHeader()}
        <div style="padding:32px">
          <p style="margin:0 0 16px">Dear <strong>${opts.clientName}</strong>,</p>
          <p style="margin:0 0 16px">
            Please find attached your quotation <strong>${opts.quoteNumber}</strong> for your review.
          </p>
          <div style="background:#f9f7f0;border-left:4px solid #E8A120;padding:16px 20px;margin:20px 0;border-radius:4px">
            <p style="margin:0;font-size:13px;color:#555">Grand Total</p>
            <p style="margin:6px 0 0;font-size:22px;font-weight:bold;color:#0A0F1E">
              NGN ${grandTotalFormatted}
            </p>
          </div>
          <p style="margin:0 0 12px">Kindly review the attached document and let us know your decision.</p>
          <p style="margin:0">If you have any questions, feel free to reach out to us directly.</p>
          ${emailFooter()}
        </div>
      </div>
    `,
        attachments: buildAttachment(opts.quoteNumber, opts.pdfPath),
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// SEND INVOICE EMAIL
// Sent automatically when an invoice is generated after quote approval
// ─────────────────────────────────────────────────────────────────────────────
async function sendInvoiceEmail(opts) {
    const grandTotalFormatted = Number(opts.grandTotal).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
    });
    // Bank details from .env - shown in the email body for easy payment reference
    const bank = process.env.COMPANY_BANK ?? 'GTBank';
    const account = process.env.COMPANY_ACCOUNT ?? '0123456789';
    await getTransporter().sendMail({
        from: process.env.EMAIL_FROM,
        to: opts.to,
        subject: `Invoice from ${process.env.COMPANY_NAME ?? 'Leapback'} - ${opts.invoiceNumber}`,
        html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
        ${emailHeader()}
        <div style="padding:32px">
          <p style="margin:0 0 16px">Dear <strong>${opts.clientName}</strong>,</p>
          <p style="margin:0 0 16px">
            Please find attached invoice <strong>${opts.invoiceNumber}</strong> for services rendered.
          </p>
          <div style="background:#f9f7f0;border-left:4px solid #E8A120;padding:16px 20px;margin:20px 0;border-radius:4px">
            <p style="margin:0;font-size:13px;color:#555">Amount Due</p>
            <p style="margin:6px 0 0;font-size:22px;font-weight:bold;color:#0A0F1E">
              NGN ${grandTotalFormatted}
            </p>
            ${opts.dueDate ? `<p style="margin:8px 0 0;font-size:12px;color:#777">Due by: <strong>${opts.dueDate}</strong></p>` : ''}
          </div>
          <div style="background:#f5f5f5;padding:16px 20px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 8px;font-weight:bold;color:#0A0F1E">Payment Details</p>
            <p style="margin:0;color:#555;font-size:13px">
              Bank: <strong>${bank}</strong> &nbsp;|&nbsp; Account: <strong>${account}</strong>
            </p>
            <p style="margin:6px 0 0;color:#888;font-size:12px">
              Please use the invoice number <strong>${opts.invoiceNumber}</strong> as your payment reference.
            </p>
          </div>
          ${emailFooter()}
        </div>
      </div>
    `,
        attachments: buildAttachment(opts.invoiceNumber, opts.pdfPath),
    });
}
// import nodemailer, { Transporter } from 'nodemailer';
// import fs from 'fs';
// // ─────────────────────────────────────────────────────────────────────────────
// // TRANSPORTER - lazy singleton
// // The SMTP connection is created once on first use and reused for all emails
// // Configured via .env - supports Gmail, Brevo, Mailgun, or any SMTP provider
// // ─────────────────────────────────────────────────────────────────────────────
// let transporter: Transporter | null = null;
// function getTransporter(): Transporter {
//   if (!transporter) {
//     transporter = nodemailer.createTransport({
//       host:   process.env.EMAIL_HOST ?? 'smtp.gmail.com',
//       port:   parseInt(process.env.EMAIL_PORT ?? '587'),
//       secure: false,   // true for port 465, false for 587 (STARTTLS)
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });
//   }
//   return transporter;
// }
// // ─────────────────────────────────────────────────────────────────────────────
// // HELPER - BUILD ATTACHMENT
// // Returns a nodemailer attachment array if the PDF exists on disk
// // Returns empty array if pdfPath is null or the file doesn't exist
// // ─────────────────────────────────────────────────────────────────────────────
// const buildAttachment = (filename: string, pdfPath: string | null) => {
//   if (pdfPath && fs.existsSync(pdfPath)) {
//     return [{ filename: `${filename}.pdf`, path: pdfPath }];
//   }
//   return [];
// };
// // ─────────────────────────────────────────────────────────────────────────────
// // HELPER - COMPANY FOOTER
// // Reads company details from .env for consistent footer across all emails
// // ─────────────────────────────────────────────────────────────────────────────
// const emailFooter = () => `
//   <p style="color:#999;font-size:11px;margin-top:30px;border-top:1px solid #eee;padding-top:10px">
//     ${process.env.COMPANY_NAME ?? 'Leapback'} &nbsp;·&nbsp;
//     ${process.env.COMPANY_ADDRESS ?? 'Abuja, Nigeria'} &nbsp;·&nbsp;
//     ${process.env.COMPANY_EMAIL ?? 'info@leapback.ng'}
//   </p>
// `;
// // ─────────────────────────────────────────────────────────────────────────────
// // SEND QUOTE EMAIL
// // Sent automatically when a quote is submitted
// // 💡 "Quote will be emailed to the client automatically on submission" - prototype note
// // ─────────────────────────────────────────────────────────────────────────────
// export async function sendQuoteEmail(opts: {
//   to:          string;
//   clientName:  string;
//   quoteNumber: string;
//   pdfPath:     string | null;
//   grandTotal:  number;
// }): Promise<void> {
//   const grandTotalFormatted = Number(opts.grandTotal).toLocaleString('en-NG', {
//     minimumFractionDigits: 2,
//   });
//   await getTransporter().sendMail({
//     from:    process.env.EMAIL_FROM,
//     to:      opts.to,
//     subject: `Your Quotation from ${process.env.COMPANY_NAME ?? 'Leapback'} - ${opts.quoteNumber}`,
//     html: `
//       <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
//         <div style="background:#0e43a6;padding:20px 30px">
//           <h2 style="color:#fff;margin:0">${process.env.COMPANY_NAME ?? 'Leapback'}</h2>
//         </div>
//         <div style="padding:30px">
//           <p>Dear ${opts.clientName},</p>
//           <p>
//             Please find attached your quotation <strong>${opts.quoteNumber}</strong>
//             for your review.
//           </p>
//           <p style="font-size:18px">
//             <strong>Total: ₦${grandTotalFormatted}</strong>
//           </p>
//           <p>Kindly review the attached document and let us know your decision.</p>
//           <p>If you have any questions, feel free to reach out to us directly.</p>
//           ${emailFooter()}
//         </div>
//       </div>
//     `,
//     attachments: buildAttachment(opts.quoteNumber, opts.pdfPath),
//   });
// }
// // ─────────────────────────────────────────────────────────────────────────────
// // SEND INVOICE EMAIL
// // Sent automatically when an invoice is generated after quote approval
// // ─────────────────────────────────────────────────────────────────────────────
// export async function sendInvoiceEmail(opts: {
//   to:            string;
//   clientName:    string;
//   invoiceNumber: string;
//   pdfPath:       string | null;
//   grandTotal:    number;
//   dueDate?:      string;
// }): Promise<void> {
//   const grandTotalFormatted = Number(opts.grandTotal).toLocaleString('en-NG', {
//     minimumFractionDigits: 2,
//   });
//   // Bank details from .env - shown in the email body for easy payment reference
//   const bank    = process.env.COMPANY_BANK    ?? 'GTBank';
//   const account = process.env.COMPANY_ACCOUNT ?? '0123456789';
//   await getTransporter().sendMail({
//     from:    process.env.EMAIL_FROM,
//     to:      opts.to,
//     subject: `Invoice from ${process.env.COMPANY_NAME ?? 'Leapback'} - ${opts.invoiceNumber}`,
//     html: `
//       <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
//         <div style="background:#0e43a6;padding:20px 30px">
//           <h2 style="color:#fff;margin:0">${process.env.COMPANY_NAME ?? 'Leapback'}</h2>
//         </div>
//         <div style="padding:30px">
//           <p>Dear ${opts.clientName},</p>
//           <p>
//             Please find attached invoice <strong>${opts.invoiceNumber}</strong>
//             for services rendered.
//           </p>
//           <p style="font-size:18px">
//             <strong>Amount Due: ₦${grandTotalFormatted}</strong>
//           </p>
//           ${opts.dueDate ? `<p>Payment is due by: <strong>${opts.dueDate}</strong></p>` : ''}
//           <div style="background:#f5f7ff;padding:16px;border-radius:6px;margin:20px 0">
//             <p style="margin:0 0 6px"><strong>Payment Details</strong></p>
//             <p style="margin:0;color:#555">
//               Bank: ${bank} &nbsp;|&nbsp; Account: ${account}
//             </p>
//           </div>
//           <p>Please use the invoice number as your payment reference.</p>
//           ${emailFooter()}
//         </div>
//       </div>
//     `,
//     attachments: buildAttachment(opts.invoiceNumber, opts.pdfPath),
//   });
// }
//# sourceMappingURL=email.service.js.map