// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
import { DataTypes, Model } from 'sequelize';

// Importing the configured Sequelize instance for database connection.
import sequelize from '../db';

// Defining the InventoryAttributes interface to specify the shape of the Inventory model's attributes.
// This ensures type safety for the model's fields and their expected values.
interface InventoryAttributes {
  sn?: number;
  id?: string;
  name: string;
  itemCode?: string | null;
  type: 'product' | 'service';
  category?: string | null;
  unitPrice: number;
  stockQty?: number | null;          // Only applies to physical products, null for services
  lowStockThreshold?: number;        // Alert triggered when stockQty falls to or below this value
  availabilityStatus?: 'available' | 'busy' | 'unavailable' | null;  // Only applies to services
  isActive?: boolean;
}

// Defining the InventoryInstance interface, which extends Sequelize's Model class and InventoryAttributes.
// This combines Sequelize's model functionality with the custom attributes for type-safe instances.
interface InventoryInstance extends Model<InventoryAttributes>, InventoryAttributes {}

// Defining the Inventory model using sequelize.define, specifying the model name, attributes, and options.
// The generic type InventoryInstance ensures type safety for the model's instances.
const Inventory = sequelize.define<InventoryInstance>(
  'Inventory',
  {
    // Defining the model's attributes (columns) with their data types.
    sn: {
      type:          DataTypes.INTEGER,
      autoIncrement: true,
      unique:        true,
    },

    id: {
      type:         DataTypes.UUID,         // UUID type for unique identifier.
      defaultValue: DataTypes.UUIDV4,       // Automatically generates a UUID v4 for new records.
      primaryKey:   true,                   // Marks this field as the primary key.
    },

    // Name of the product or service shown in the inventory table and on quote line items
    // e.g. "Solar Panel 400W", "IT Consulting", "Network Infrastructure"
    name: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },

    // Unique product code shown under the item name in the prototype
    // e.g. "SP-400W", "INV-5K". Null for services since they have no physical stock.
    itemCode: {
      type:      DataTypes.STRING(80),
      allowNull: true,
      unique:    true,
    },

    // Determines whether this item is a physical product (has stock) or a service (has availability)
    // Controls which fields are relevant — stockQty for products, availabilityStatus for services
    type: {
      type:      DataTypes.ENUM('product', 'service'),
      allowNull: false,
    },

    // Groups items for filtering in the prototype — "Solar", "IT", "Services", "Energy"
    category: {
      type:      DataTypes.STRING(80),
      allowNull: true,
    },

    // The price per unit shown in the inventory table and used to calculate quote line totals
    // e.g. ₦85,000 for Solar Panel 400W, ₦17,500/hr for IT Consulting
    unitPrice: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },

    // Current stock count for physical products — decremented automatically when a quote is approved
    // Null for services. Shows as "2 units", "5 units", "18 units" in the prototype inventory table.
    stockQty: {
      type:      DataTypes.INTEGER,
      allowNull: true,
    },

    // When stockQty drops to or below this number, a low stock alert appears on the dashboard
    // e.g. "Solar Panel 400W — 2 left" shown in the prototype dashboard alert panel
    lowStockThreshold: {
      type:         DataTypes.INTEGER,
      allowNull:    false,
      defaultValue: 5,
    },

    // Availability state for services only — shown as "Available", "Busy" in the prototype
    // Null for physical products since they use stockQty instead
    availabilityStatus: {
      type:         DataTypes.ENUM('available', 'busy', 'unavailable'),
      allowNull:    true,
      defaultValue: 'available',
    },

    // Soft delete flag — deactivated items are hidden from the catalogue without being removed
    isActive: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: true,
    },
  },
  {
    timestamps:  true,         // Automatically adds createdAt and updatedAt columns.
    underscored: true,         // Maps camelCase fields to snake_case columns (e.g. unitPrice → unit_price).
    tableName:   'inventory',  // Explicit table name in the database.
  }
);

// Exporting the Inventory model for use in other parts of the application.
export default Inventory;