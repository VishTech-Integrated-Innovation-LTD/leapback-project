'use strict';

// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
import { DataTypes, Model } from 'sequelize';

// Importing the configured Sequelize instance for database connection.
import sequelize from '../db';

// Defining the QuoteAttributes interface to specify the shape of the Quote model's attributes.
// This ensures type safety for the model's fields and their expected values.
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

// Defining the QuoteInstance interface, which extends Sequelize's Model class and QuoteAttributes.
// This combines Sequelize's model functionality with the custom attributes for type-safe instances.
interface QuoteInstance extends Model<QuoteAttributes>, QuoteAttributes {}

// Defining the Quote model using sequelize.define, specifying the model name, attributes, and options.
// The generic type QuoteInstance ensures type safety for the model's instances.
const Quote = sequelize.define<QuoteInstance>(
  'Quote',
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

    // Human-readable reference number shown throughout the prototype
    // e.g. "QT-024", "QT-023" in the quotes table and invoice view
    quoteNumber: {
      type:      DataTypes.STRING(20),
      allowNull: false,
      unique:    true,
    },

    // Foreign key linking this quote to the client it was created for
    clientId: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'clients', key: 'id' },
    },

    // Foreign key tracking which staff member created this quote
    createdBy: {
      type:       DataTypes.UUID,
      allowNull:  false,
      references: { model: 'users', key: 'id' },
    },

    // Lifecycle status — drives the colour-coded badges in the prototype quotes table
    // draft → pending (submitted) → approved / rejected / cancelled
    status: {
      type:         DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled'),
      allowNull:    false,
      defaultValue: 'draft',
    },

    // VAT percentage applied to this quote — nullable if no VAT is charged
    vatRate: {
      type:         DataTypes.DECIMAL(5, 2),
      allowNull:    true,
      defaultValue: null,
    },

    // Sum of all line item totals before VAT
    subtotal: {
      type:         DataTypes.DECIMAL(14, 2),
      allowNull:    false,
      defaultValue: 0,
    },

    // VAT amount calculated from subtotal × vatRate — null if no VAT is applied
    vatAmount: {
      type:         DataTypes.DECIMAL(14, 2),
      allowNull:    true,
      defaultValue: null,
    },

    // Final amount shown on the quote — subtotal + vatAmount
    // e.g. ₦516,000 shown in the prototype quote summary panel
    grandTotal: {
      type:         DataTypes.DECIMAL(14, 2),
      allowNull:    false,
      defaultValue: 0,
    },

    // Optional notes from the staff member — entered in the Notes field on the New Quote page
    notes: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },

    // File path to the generated PDF stored on the server after the quote is submitted
    pdfPath: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },

    // Timestamp of when the quote PDF was emailed to the client
    sentAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },

    // Timestamp of when the staff member marked the quote as approved
    approvedAt: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps:  true,      // Automatically adds createdAt and updatedAt columns.
    underscored: true,      // Maps camelCase fields to snake_case columns (e.g. quoteNumber → quote_number).
    tableName:   'quotes',  // Explicit table name in the database.
  }
);

// Exporting the Quote model for use in other parts of the application.
export default Quote;