'use strict';

// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
import { DataTypes, Model } from 'sequelize';

// Importing the configured Sequelize instance for database connection.
import sequelize from '../db';

// Defining the InvoiceAttributes interface to specify the shape of the Invoice model's attributes.
// This ensures type safety for the model's fields and their expected values.
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

// Defining the InvoiceInstance interface, which extends Sequelize's Model class and InvoiceAttributes.
// This combines Sequelize's model functionality with the custom attributes for type-safe instances.
interface InvoiceInstance extends Model<InvoiceAttributes>, InvoiceAttributes {}

// Defining the Invoice model using sequelize.define, specifying the model name, attributes, and options.
// The generic type InvoiceInstance ensures type safety for the model's instances.
const Invoice = sequelize.define<InvoiceInstance>(
  'Invoice',
  {
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

    // Human-readable invoice reference — auto-generated when a quote is approved
    // e.g. "#INV-018" shown in the prototype invoice list and PDF header
    invoiceNumber: {
      type:      DataTypes.STRING(20),
      allowNull: false,
      unique:    true,
    },

    // Foreign key linking this invoice back to the approved quote it was generated from
    // The prototype shows "Quote Ref: #QT-023" on the invoice view page
    quoteId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'quotes', key: 'id' },
    },

    // Foreign key linking this invoice to the billed client
    clientId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'clients', key: 'id' },
    },

    // Foreign key tracking which staff member generated this invoice
    createdBy: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'users', key: 'id' },
    },

    // Payment status — shown as colour-coded badges in the prototype invoice list
    // sent → paid (marked manually by staff) | cancelled (voided, never deleted)
    status: {
      type:         DataTypes.ENUM('sent', 'paid', 'cancelled'),
      allowNull:    false,
      defaultValue: 'sent',
    },

    // VAT percentage — copied from the original quote. Null if no VAT was applied.
    vatRate: {
      type:      DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },

    // Sum of all line item totals before VAT — copied from the approved quote
    subtotal: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },

    // VAT amount — copied from the approved quote. Null if no VAT was applied.
    vatAmount: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },

    // Total amount due — shown as "TOTAL DUE ₦1,290,000" on the prototype invoice PDF
    grandTotal: {
      type:      DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },

    // File path to the generated PDF stored on the server
    pdfPath: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },

    // Payment deadline — typically 14 days from generation
    // e.g. "Due Date: Mar 15, 2026" shown in the prototype invoice view
    dueDate: {
      type:      DataTypes.DATEONLY,
      allowNull: true,
    },

    // Timestamp of when the staff member marked this invoice as paid
    paidAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },

    // Timestamp of when the invoice PDF was emailed to the client
    sentAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps:  true,        // Automatically adds createdAt and updatedAt columns.
    underscored: true,        // Maps camelCase fields to snake_case columns (e.g. invoiceNumber → invoice_number).
    tableName:   'invoices',  // Explicit table name in the database.
  }
);

// Exporting the Invoice model for use in other parts of the application.
export default Invoice;