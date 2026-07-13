import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CalendarBlankIcon,
  ReceiptIcon,
  ShareNetworkIcon,
} from '@phosphor-icons/react';
import {
  getInvoiceById,
  updateInvoiceStatus,
  resendInvoiceEmail,
  downloadInvoicePdf,
} from '../../api/invoices.api';
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusColor,
} from '../../utils/formatCurrency';
import { ShareWithPdfModal } from '../ShareWithPdfModal';
import api from '../../lib/axios';


// Helper: fetch invoice PDF as a Blob (re-uses the same axios interceptor
// that attaches the auth header, so it works behind auth)
const fetchInvoicePdfBlob = async (invoiceId: string): Promise<Blob> => {
    const res = await api.get(`/invoices/${invoiceId}/download`, { responseType: 'blob' });
    return res.data as Blob;
};


// --------------------------------------------------------------------------
// INVOICE DETAIL PAGE
// --------------------------------------------------------------------------
const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

    // const printRef = useRef<HTMLDivElement>(null);
  

  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showShare,      setShowShare]      = useState(false);


  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id!),
    enabled: !!id,
  });

  // Mark paid / cancelled mutation
  const statusMutation = useMutation({
    mutationFn: (status: 'paid' | 'cancelled') => updateInvoiceStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowMarkPaid(false);
      setShowCancel(false);
    },
  });

  // Resend email mutation
  const resendMutation = useMutation({
    mutationFn: () => resendInvoiceEmail(id!),
    onSuccess: () => {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    },
  });


  // Print only the invoice
  // const handlePrint = () => {
  //   if (!printRef.current) return;

  //   const printContent = printRef.current;
  //   const originalContent = document.body.innerHTML;

  //   // Create clean print version
  //   document.body.innerHTML = `
  //     <div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;">
  //       ${printContent.innerHTML}
  //     </div>
  //   `;

  //   window.print();

  //   // Restore original page
  //   setTimeout(() => {
  //     document.body.innerHTML = originalContent;
  //     window.location.reload(); // Re-attach React events
  //   }, 100);
  // };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-[#E8A120] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data?.invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-white/40 text-sm">Invoice not found.</p>
        <button
          onClick={() => navigate('/invoices')}
          className="text-[#E8A120] text-sm hover:underline"
        >
          ← Back to Invoices
        </button>
      </div>
    );
  }

  const invoice = data.invoice;
  const amountStr = Number(invoice.grandTotal).toLocaleString('en-NG', { minimumFractionDigits: 2 });


   return (
          <div className="space-y-5 max-w-4xl">
  
              {/* Back + Header */}
              <div className="flex items-start justify-between gap-4">
                  <div>
                      <button
                          onClick={() => navigate('/invoices')}
                          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-3 transition-colors"
                      >
                          <ArrowLeftIcon size={15} />
                          Back to Invoices
                      </button>
                      <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-xl font-bold text-white">#{invoice.invoiceNumber}</h1>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getInvoiceStatusColor(invoice.status)}`}>
                              {invoice.status}
                          </span>
                          {invoice.quote && (
                              <button
                                  onClick={() => navigate(`/quotes/${invoice.quoteId}`)}
                                  className="text-xs text-white/30 hover:text-[#E8A120] transition-colors"
                              >
                                  Quote Ref: #{invoice.quote.quoteNumber}
                              </button>
                          )}
                      </div>
                  </div>
  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
  
                      {/* Download PDF */}
                      <button
                          onClick={async () => {
                              setDownloading(true);
                              try { await downloadInvoicePdf(invoice.id, invoice.invoiceNumber); }
                              catch { /* handled silently */ }
                              finally { setDownloading(false); }
                          }}
                          disabled={downloading}
                          className="flex items-center gap-1.5 text-sm text-white/60 border border-white/10 hover:border-white/20 hover:text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                          <DownloadSimpleIcon size={15} />
                          {downloading ? 'Downloading...' : 'Download PDF'}
                      </button>
  
                      {/* Resend system email */}
                      <button
                          onClick={() => resendMutation.mutate()}
                          disabled={resendMutation.isPending}
                          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors
                              ${resendSuccess
                                  ? 'border-green-500/30 text-green-400'
                                  : 'border-white/10 hover:border-white/20 text-white/60 hover:text-white'
                              } disabled:opacity-50`}
                      >
                          <EnvelopeIcon size={15} />
                          {resendSuccess ? 'Email Sent!' : resendMutation.isPending ? 'Sending...' : 'Send Email'}
                      </button>
  
                      {/* Share (with PDF) */}
                      <button
                          onClick={() => setShowShare(true)}
                          className="flex items-center gap-1.5 text-sm text-[#E8A120]/80 hover:text-[#E8A120] border border-[#E8A120]/20 hover:border-[#E8A120]/40 px-3 py-2 rounded-lg transition-colors"
                      >
                          <ShareNetworkIcon size={15} />
                          Share
                      </button>
  
                      {/* Print */}
                      {/* <button
                          onClick={() => window.print()}
              // onClick={handlePrint}
                          className="flex items-center gap-1.5 text-sm text-white/60 border border-white/10 hover:border-white/20 hover:text-white px-3 py-2 rounded-lg transition-colors"
                      >
                          <PrinterIcon size={15} />
                          Print
                      </button> */}
  
                      {/* Mark as Paid */}
                      {invoice.status === 'sent' && (
                          <button
                              onClick={() => setShowMarkPaid(true)}
                              className="flex items-center gap-1.5 text-sm bg-green-500/10 text-green-400 border border-green-500/20 hover:border-green-500/40 px-3 py-2 rounded-lg transition-colors"
                          >
                              <CheckCircleIcon size={15} weight="fill" />
                              Mark as Paid
                          </button>
                      )}
  
                      {/* Cancel */}
                      {invoice.status === 'sent' && (
                          <button
                              onClick={() => setShowCancel(true)}
                              className="flex items-center gap-1.5 text-sm text-red-400 border border-red-400/20 hover:border-red-400/40 px-3 py-2 rounded-lg transition-colors"
                          >
                              <XCircleIcon size={15} weight="fill" />
                              Cancel
                          </button>
                      )}
  
                  </div>
              </div>
  
              {/* Meta cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0D1526] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-white/30 text-xs mb-1.5">
                          <UserIcon size={12} /> Billed To
                      </div>
                      <p className="text-white text-sm font-medium">{invoice.client?.clientName ?? '—'}</p>
                      <p className="text-white/30 text-xs mt-0.5 truncate">{invoice.client?.email ?? ''}</p>
                  </div>
  
                  <div className="bg-[#0D1526] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-white/30 text-xs mb-1.5">
                          <CalendarBlankIcon size={12} /> Invoice Date
                      </div>
                      <p className="text-white text-sm font-medium">{formatDate(invoice.createdAt)}</p>
                  </div>
  
                  <div className="bg-[#0D1526] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-white/30 text-xs mb-1.5">
                          <CalendarBlankIcon size={12} /> Due Date
                      </div>
                      <p className={`text-sm font-medium ${
                          invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status === 'sent'
                              ? 'text-red-400' : 'text-white'
                      }`}>
                          {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
                      </p>
                  </div>
  
                  <div className="bg-[#0D1526] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-white/30 text-xs mb-1.5">
                          <ReceiptIcon size={12} />
                          {invoice.status === 'paid' ? 'Paid On' : 'Sent On'}
                      </div>
                      <p className="text-white text-sm font-medium">
                          {invoice.status === 'paid' ? formatDate(invoice.paidAt) : formatDate(invoice.sentAt)}
                      </p>
                  </div>
              </div>
  
              {/* Line Items */}
              <div className="bg-[#0D1526] border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-white">Line Items</h3>
                  </div>
                  <table className="w-full text-sm">
                      <thead>
                          <tr className="border-b border-white/5">
                              <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Item</th>
                              <th className="text-left text-xs font-medium text-white/30 px-5 py-3">Type</th>
                              <th className="text-right text-xs font-medium text-white/30 px-5 py-3">Qty</th>
                              <th className="text-right text-xs font-medium text-white/30 px-5 py-3">Unit Price</th>
                              <th className="text-right text-xs font-medium text-white/30 px-5 py-3">Total</th>
                          </tr>
                      </thead>
                      <tbody>
                          {(invoice.items ?? []).map((item, i) => (
                              <tr key={item.id ?? i} className="border-b border-white/5">
                                  <td className="px-5 py-3.5 text-white font-medium">{item.itemName}</td>
                                  <td className="px-5 py-3.5">
                                      <span className="text-xs text-white/40 capitalize">{item.itemType}</span>
                                  </td>
                                  <td className="px-5 py-3.5 text-white/60 text-right">{item.quantity}</td>
                                  <td className="px-5 py-3.5 text-white/60 text-right">{formatCurrency(item.unitPrice)}</td>
                                  <td className="px-5 py-3.5 text-white font-medium text-right">{formatCurrency(item.lineTotal)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
  
                  {/* Totals */}
                  <div className="px-5 py-4 border-t border-white/10 flex justify-end">
                      <div className="w-64 space-y-2 text-sm">
                          <div className="flex justify-between text-white/50">
                              <span>Subtotal</span>
                              <span>{formatCurrency(invoice.subtotal)}</span>
                          </div>
                          {invoice.vatRate && invoice.vatAmount && (
                              <div className="flex justify-between text-white/50">
                                  <span>VAT ({invoice.vatRate}%)</span>
                                  <span>{formatCurrency(invoice.vatAmount)}</span>
                              </div>
                          )}
                          <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-2">
                              <span>Total Due</span>
                              <span className="text-[#E8A120]">{formatCurrency(invoice.grandTotal)}</span>
                          </div>
                      </div>
                  </div>
              </div>
  
              {/* ── Share Modal ─────────────────────────────────────── */}
              {showShare && (
                  <ShareWithPdfModal
                      title={`Invoice #${invoice.invoiceNumber}`}
                      ref={invoice.invoiceNumber}
                      shareText={
                          `Hi, please find your invoice #${invoice.invoiceNumber} from Leapback.\n\n` +
                          `Amount Due: NGN ${amountStr}\n` +
                          `Due Date: ${invoice.dueDate ?? 'N/A'}\n\n` +
                          `Kindly make payment at your earliest convenience.`
                      }
                      emailSubject={`Invoice #${invoice.invoiceNumber} from Leapback`}
                      emailBody={
                          `Dear ${invoice.client?.clientName ?? 'Client'},\n\n` +
                          `Please find attached your invoice #${invoice.invoiceNumber}.\n\n` +
                          `Amount Due: NGN ${amountStr}\n` +
                          `Due Date: ${invoice.dueDate ?? 'N/A'}\n\n` +
                          `Thank you for your business.\n\nLeapback`
                      }
                      recipientEmail={invoice.client?.email}
                      fetchPdfBlob={() => fetchInvoicePdfBlob(invoice.id)}
                      onResendSystemEmail={() => resendMutation.mutate()}
                      resendPending={resendMutation.isPending}
                      resendSuccess={resendSuccess}
                      onClose={() => setShowShare(false)}
                  />
              )}
  
              {/* Mark as Paid Modal */}
              {showMarkPaid && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
                      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
                          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                              <CheckCircleIcon size={24} weight="fill" className="text-green-400" />
                          </div>
                          <h3 className="text-white font-semibold text-center mb-1">Mark as Paid?</h3>
                          <p className="text-white/40 text-sm text-center mb-2">
                              #{invoice.invoiceNumber} — {invoice.client?.clientName}
                          </p>
                          <p className="text-[#E8A120] text-sm font-bold text-center mb-5">
                              {formatCurrency(invoice.grandTotal)}
                          </p>
                          <p className="text-white/30 text-xs text-center mb-5">
                              This action cannot be undone. The invoice will be permanently marked as paid.
                          </p>
                          <div className="flex gap-3">
                              <button
                                  onClick={() => setShowMarkPaid(false)}
                                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
                              >
                                  Cancel
                              </button>
                              <button
                                  onClick={() => statusMutation.mutate('paid')}
                                  disabled={statusMutation.isPending}
                                  className="flex-1 py-2.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
                              >
                                  {statusMutation.isPending ? 'Saving...' : 'Confirm'}
                              </button>
                          </div>
                      </div>
                  </div>
              )}
  
              {/* Cancel Invoice Modal */}
              {showCancel && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
                      <div className="bg-[#0D1526] border border-white/10 rounded-2xl w-full max-w-sm p-6">
                          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                              <XCircleIcon size={24} weight="fill" className="text-red-400" />
                          </div>
                          <h3 className="text-white font-semibold text-center mb-1">Cancel Invoice?</h3>
                          <p className="text-white/40 text-sm text-center mb-5">
                              #{invoice.invoiceNumber} will be voided. This cannot be undone —
                              the invoice record is kept for audit purposes.
                          </p>
                          <div className="flex gap-3">
                              <button
                                  onClick={() => setShowCancel(false)}
                                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
                              >
                                  Keep Invoice
                              </button>
                              <button
                                  onClick={() => statusMutation.mutate('cancelled')}
                                  disabled={statusMutation.isPending}
                                  className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                              >
                                  {statusMutation.isPending ? 'Cancelling...' : 'Cancel Invoice'}
                              </button>
                          </div>
                      </div>
                  </div>
              )}
  
          </div>
      );
};

export default InvoiceDetailPage;