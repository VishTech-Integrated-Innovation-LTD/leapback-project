'use strict';

// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
import { DataTypes, Model } from 'sequelize';

// Importing the configured Sequelize instance for database connection.
import sequelize from '../db';

// Bank Account interface
interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  currency?: string;
  sortCode?: string;
}

// Defining the CompanySettingAttributes interface to specify the shape of the Settings model's attributes.
// This ensures type safety for the model's fields and their expected values.
interface CompanySettingAttributes {
  id?: string;
  companyName: string;
  companyAddress?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  invoiceFooter?: string | null;
  defaultVatRate: number;
  logoUrl: string | null;
  taxId: string | null;
  website: string | null;
  bankAccounts: BankAccount[]; // JSON array of bank accounts
}

// Defining the CompanySettingsInstance interface, which extends Sequelize's Model class and SettingsAttributes.
// This combines Sequelize's model functionality with the custom attributes for type-safe instances.
interface CompanySettingsInstance extends Model<CompanySettingAttributes>, CompanySettingAttributes {}

// Defining the Settings model using sequelize.define, specifying the model name, attributes, and options.
// The generic type SettingsInstance ensures type safety for the model's instances.
// Only one row will ever exist in this table — it holds the company-wide configuration
const CompanySettings = sequelize.define<CompanySettingsInstance>(
  'CompanySettings',
  {
    id: {
      type:         DataTypes.UUID,         // UUID type for unique identifier.
      defaultValue: DataTypes.UUIDV4,       // Automatically generates a UUID v4 for new records.
      primaryKey:   true,                   // Marks this field as the primary key.
    },

    // Company name printed on all PDF quotes and invoices
    // e.g. "LEAPBACK" shown in the header of the prototype invoice PDF
    companyName: {
      type:         DataTypes.STRING(200),
      allowNull:    false,
      defaultValue: 'Leapback Limited',
    },

    // Company address printed on the invoice PDF footer
    // e.g. "Lagos, Nigeria" shown in the prototype
    companyAddress: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },

    // Company email printed on the invoice PDF footer
    // e.g. "info@leapback.ng" shown in the prototype
    companyEmail: {
      type:      DataTypes.STRING(150),
      allowNull: true,
      validate: { isEmail: true },
    },

    // Company phone printed on the invoice PDF footer
    // e.g. "+234 800 000 0000" shown in the prototype
    companyPhone: {
      type:      DataTypes.STRING(30),
      allowNull: true,
    },

    // Text printed at the bottom of every invoice PDF
    // e.g. "Thank you for your business." — editable from the Settings page in the prototype
    invoiceFooter: {
      type:         DataTypes.TEXT,
      allowNull:    true,
      defaultValue: 'Thank you for your business.',
    },

    // Default VAT rate applied to all new quotes — editable from the Settings page
    // Shows as "VAT (7.5%)" in the prototype quote summary panel
    defaultVatRate: {
      type:         DataTypes.DECIMAL(5, 2),
      allowNull:    false,
      defaultValue: 7.5,
    },
     logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankAccounts: {
      type: DataTypes.JSONB, // or DataTypes.JSON for MySQL/SQLite
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    timestamps:  true,        // Automatically adds createdAt and updatedAt columns.
    underscored: true,        // Maps camelCase fields to snake_case columns (e.g. companyName → company_name).
    tableName:   'company_settings',  // Explicit table name in the database.
  }
);

// Exporting the Settings model for use in other parts of the application.
export default CompanySettings;
