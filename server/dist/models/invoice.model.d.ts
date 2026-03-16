import { Model } from 'sequelize';
interface InvoiceAttributes {
    sn?: number;
    id?: string;
    invoiceNumber: string;
    quoteId: string;
    clientId: string;
    createdBy: string;
    status: 'sent' | 'paid' | 'cancelled';
    vatRate?: number | null;
    subtotal: number;
    vatAmount?: number | null;
    grandTotal: number;
    pdfPath?: string | null;
    dueDate?: string | null;
    paidAt?: Date | null;
    sentAt?: Date | null;
}
interface InvoiceInstance extends Model<InvoiceAttributes>, InvoiceAttributes {
}
declare const Invoice: import("sequelize").ModelCtor<InvoiceInstance>;
export default Invoice;
