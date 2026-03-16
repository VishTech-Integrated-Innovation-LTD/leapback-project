import { Model } from 'sequelize';
interface InvoiceItemAttributes {
    id?: string;
    invoiceId: string;
    itemName: string;
    itemType: 'product' | 'service';
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}
interface InvoiceItemInstance extends Model<InvoiceItemAttributes>, InvoiceItemAttributes {
}
declare const InvoiceItem: import("sequelize").ModelCtor<InvoiceItemInstance>;
export default InvoiceItem;
