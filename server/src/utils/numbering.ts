import { fn, col } from 'sequelize';
import { Quote, Invoice } from '../models';




// ==================================================================================
// NEXT QUOTE NUMBER
// Generates the next sequential quote number e.g. QT-001, QT-025
// Uses MAX(sn) instead of the latest createdAt to avoid race conditions —
// if two quotes are created at the same millisecond, createdAt ordering is
// unreliable, but sn (auto-increment integer) is always unique and increasing
// ==================================================================================
export async function nextQuoteNumber(): Promise<string> {
// Generates the next sequential quote/invoice number (e.g., QT-001, INV-001).
// Retrieves the current highest serial number (sn) using SQL MAX(sn),
// increments it by 1, and formats it with a prefix and zero-padding.
// Uses sn instead of createdAt to ensure reliable ordering even if
// multiple records are created at the same time.
 const result = await Quote.findOne({
    attributes: [[fn('MAX', col('sn')), 'maxSn']],
    raw: true,
  }) as any;

  const maxSn = result?.maxSn ?? 0;
  return `QT-${String(maxSn + 1).padStart(3, '0')}`;
}




// ==================================================================================
// NEXT INVOICE NUMBER
// Generates the next sequential invoice number e.g. INV-001, INV-018
// Same MAX(sn) approach as quotes — safe under concurrent requests
// ==================================================================================
export async function nextInvoiceNumber(): Promise<string> {
  const result = await Invoice.findOne({
    attributes: [[fn('MAX', col('sn')), 'maxSn']],
    raw: true,
  }) as any;

  const maxSn = result?.maxSn ?? 0;
  return `INV-${String(maxSn + 1).padStart(3, '0')}`;
}