import { Model } from 'sequelize';
interface QuoteItemAttributes {
    id?: string;
    quoteId: string;
    inventoryId?: string | null;
    itemName: string;
    itemType: 'product' | 'service';
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}
interface QuoteItemInstance extends Model<QuoteItemAttributes>, QuoteItemAttributes {
}
declare const QuoteItem: import("sequelize").ModelCtor<QuoteItemInstance>;
export default QuoteItem;
