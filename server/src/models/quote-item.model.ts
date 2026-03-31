'use strict';

// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
import { DataTypes, Model } from 'sequelize';

// Importing the configured Sequelize instance for database connection.
import sequelize from '../db';

// Defining the QuoteItemAttributes interface to specify the shape of the QuoteItem model's attributes.
// This ensures type safety for the model's fields and their expected values.
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

// Defining the QuoteItemInstance interface, which extends Sequelize's Model class and QuoteItemAttributes.
// This combines Sequelize's model functionality with the custom attributes for type-safe instances.
interface QuoteItemInstance extends Model<QuoteItemAttributes>, QuoteItemAttributes {}

// Defining the QuoteItem model using sequelize.define, specifying the model name, attributes, and options.
// Each row represents one line item on a quote
// e.g. "Solar Panel 400W | Product | 5 | ₦85,000 | ₦425,000" from the prototype
const QuoteItem = sequelize.define<QuoteItemInstance>(
  'QuoteItem',
  {
    id: {
      type:         DataTypes.UUID,         // UUID type for unique identifier.
      defaultValue: DataTypes.UUIDV4,       // Automatically generates a UUID v4 for new records.
      primaryKey:   true,                   // Marks this field as the primary key.
    },

    // Foreign key linking this line item back to its parent quote
    // CASCADE delete means if the quote is deleted, its items are deleted too
    quoteId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'quotes', key: 'id' },
    },

    // Optional reference to the inventory item selected from the dropdown
    // Null if the staff member typed the item in manually
    inventoryId: {
      type:       DataTypes.UUID,
      allowNull:  true,
      references: { model: 'inventory', key: 'id' },
    },

    // Name of the item as it appears on the quote document
    // Auto-filled from inventory if inventoryId is set, otherwise typed manually
    itemName: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },

    // Whether this line is a physical product or a service
    itemType: {
      type:      DataTypes.ENUM('product', 'service'),
      allowNull: false,
    },

    // How many units or hours were quoted
    quantity: {
      type:      DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Price per unit at the time the quote was created - locked at creation
    // Copied from inventory if inventoryId is set, preventing price tampering
    unitPrice: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },

    // quantity × unitPrice - pre-calculated and stored
    lineTotal: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
  },
  {
    timestamps:  true,           // Adds createdAt only - see updatedAt below.
    updatedAt:   false,          // Line items are never edited after creation.
    underscored: true,           // Maps camelCase fields to snake_case columns (e.g. quoteId → quote_id).
    tableName:   'quote_items',  // Explicit table name in the database.
  }
);

// Exporting the QuoteItem model for use in other parts of the application.
export default QuoteItem;