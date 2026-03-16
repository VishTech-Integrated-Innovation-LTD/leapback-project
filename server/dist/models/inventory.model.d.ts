import { Model } from 'sequelize';
interface InventoryAttributes {
    sn?: number;
    id?: string;
    name: string;
    itemCode?: string | null;
    type: 'product' | 'service';
    category?: string | null;
    unitPrice: number;
    stockQty?: number | null;
    lowStockThreshold?: number;
    availabilityStatus?: 'available' | 'busy' | 'unavailable' | null;
    isActive?: boolean;
}
interface InventoryInstance extends Model<InventoryAttributes>, InventoryAttributes {
}
declare const Inventory: import("sequelize").ModelCtor<InventoryInstance>;
export default Inventory;
