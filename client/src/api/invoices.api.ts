import api from '../lib/axios';
import type { Invoice } from '../types';


// --------------------------------------------------------------------------
// INVOICES API
// --------------------------------------------------------------------------

// GET /invoices?status=paid&search=techbridge
export const getAllInvoices = async (params?: {
  status?: string;
  search?: string;
}): Promise<{ invoices: Invoice[]; count: number }> => {
  const res = await api.get('/invoices', { params });
  return res.data;
};

// GET /invoices/:id
export const getInvoiceById = async (
  id: string
): Promise<{ invoice: Invoice }> => {
  const res = await api.get(`/invoices/${id}`);
  return res.data;
};

// POST /invoices/generate/:quoteId
// Triggered after a quote is approved — creates invoice, deducts inventory,
// generates PDF and emails the client
export const generateInvoice = async (
  quoteId: string
): Promise<{ invoice: Invoice; message: string }> => {
  const res = await api.post(`/invoices/generate/${quoteId}`);
  return res.data;
};

// PATCH /invoices/:id/status
// Mark an invoice as paid or cancelled
export const updateInvoiceStatus = async (
  id: string,
  status: 'paid' | 'cancelled'
): Promise<{ invoice: Invoice; message: string }> => {
  const res = await api.patch(`/invoices/${id}/status`, { status });
  return res.data;
};

// POST /invoices/:id/resend
// Resend the invoice PDF to the client
export const resendInvoiceEmail = async (
  id: string
): Promise<{ message: string }> => {
  const res = await api.post(`/invoices/${id}/resend`);
  return res.data;
};

// // GET /invoices/:id/download
// // Returns the PDF file — open in new tab to trigger browser download
// export const getInvoiceDownloadUrl = (id: string): string =>
//   `${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000'}/invoices/${id}/download`;


// GET /invoices/:id/download
// Returns the PDF file — open in new tab to trigger browser download
export const getInvoiceDownloadUrl = (id: string): string =>
  `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/invoices/${id}/download`;

// GET /invoices/:id/download
// Fetches the PDF as a blob with the auth token attached via axios interceptor
// then triggers a browser download — plain <a href> won't work because
// it opens a bare browser URL that doesn't send the Authorization header
export const downloadInvoicePdf = async (
  id:            string,
  invoiceNumber: string
): Promise<void> => {
  const res = await api.get(`/invoices/${id}/download`, {
    responseType: 'blob',
  });

  // Create a temporary object URL from the blob and programmatically click it
  const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', `${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();

  // Clean up the temporary URL and element
  link.remove();
  window.URL.revokeObjectURL(url);
};