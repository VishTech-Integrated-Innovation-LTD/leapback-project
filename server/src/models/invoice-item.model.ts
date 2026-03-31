'use strict';

// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
import { DataTypes, Model } from 'sequelize';

// Importing the configured Sequelize instance for database connection.
import sequelize from '../db';

// Defining the InvoiceItemAttributes interface to specify the shape of the InvoiceItem model's attributes.
// This ensures type safety for the model's fields and their expected values.
interface InvoiceItemAttributes {
  id?: string;
  invoiceId: string;
  itemName: string;
  itemType: 'product' | 'service';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Defining the InvoiceItemInstance interface, which extends Sequelize's Model class and InvoiceItemAttributes.
// This combines Sequelize's model functionality with the custom attributes for type-safe instances.
interface InvoiceItemInstance extends Model<InvoiceItemAttributes>, InvoiceItemAttributes {}

// Defining the InvoiceItem model using sequelize.define, specifying the model name, attributes, and options.
// Each row is a permanent snapshot of a line item at the time of invoicing.
// Copied from QuoteItems when the invoice is generated - never changed afterwards.
// e.g. "Solar Panel 400W | Product | 5 | ₦85,000 | ₦425,000" from the prototype invoice PDF
const InvoiceItem = sequelize.define<InvoiceItemInstance>(
  'InvoiceItem',
  {
    id: {
      type:         DataTypes.UUID,         // UUID type for unique identifier.
      defaultValue: DataTypes.UUIDV4,       // Automatically generates a UUID v4 for new records.
      primaryKey:   true,                   // Marks this field as the primary key.
    },

    // Foreign key linking this line item back to its parent invoice
    // CASCADE delete means if the invoice is deleted, its items are deleted too
    invoiceId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'invoices', key: 'id' },
    },

    // Permanent snapshot of the item name at time of invoicing
    itemName: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },

    // Whether this was a physical product or a service
    itemType: {
      type:      DataTypes.ENUM('product', 'service'),
      allowNull: false,
    },

    // Number of units or hours billed
    quantity: {
      type:      DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Price per unit locked at the time of invoice generation
    unitPrice: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },

    // quantity × unitPrice
    lineTotal: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
  },
  {
    timestamps:  false,           // Invoice items are immutable snapshots - no need to track time.
    underscored: true,            // Maps camelCase fields to snake_case columns (e.g. invoiceId → invoice_id).
    tableName:   'invoice_items', // Explicit table name in the database.
  }
);

// Exporting the InvoiceItem model for use in other parts of the application.
export default InvoiceItem;