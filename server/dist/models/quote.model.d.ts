import { Model } from 'sequelize';
interface QuoteAttributes {
    sn?: number;
    id?: string;
    quoteNumber: string;
    clientId: string;
    createdBy: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
    vatRate?: number | null;
    subtotal: number;
    vatAmount?: number | null;
    grandTotal: number;
    notes?: string | null;
    pdfPath?: string | null;
    sentAt?: Date | null;
    approvedAt?: Date | null;
}
interface QuoteInstance extends Model<QuoteAttributes>, QuoteAttributes {
}
declare const Quote: import("sequelize").ModelCtor<QuoteInstance>;
export default Quote;
