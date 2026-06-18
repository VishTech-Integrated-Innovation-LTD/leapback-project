'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
const sequelize_1 = require("sequelize");
// Importing the configured Sequelize instance for database connection.
const db_1 = __importDefault(require("../db"));
// Defining the Settings model using sequelize.define, specifying the model name, attributes, and options.
// The generic type SettingsInstance ensures type safety for the model's instances.
// Only one row will ever exist in this table — it holds the company-wide configuration
const CompanySettings = db_1.default.define('CompanySettings', {
    id: {
        type: sequelize_1.DataTypes.UUID, // UUID type for unique identifier.
        defaultValue: sequelize_1.DataTypes.UUIDV4, // Automatically generates a UUID v4 for new records.
        primaryKey: true, // Marks this field as the primary key.
    },
    // Company name printed on all PDF quotes and invoices
    // e.g. "LEAPBACK" shown in the header of the prototype invoice PDF
    companyName: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Leapback Limited',
    },
    // Company address printed on the invoice PDF footer
    // e.g. "Lagos, Nigeria" shown in the prototype
    companyAddress: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    // Company email printed on the invoice PDF footer
    // e.g. "info@leapback.ng" shown in the prototype
    companyEmail: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: true,
        validate: { isEmail: true },
    },
    // Company phone printed on the invoice PDF footer
    // e.g. "+234 800 000 0000" shown in the prototype
    companyPhone: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    // Text printed at the bottom of every invoice PDF
    // e.g. "Thank you for your business." — editable from the Settings page in the prototype
    invoiceFooter: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'Thank you for your business.',
    },
    // Default VAT rate applied to all new quotes — editable from the Settings page
    // Shows as "VAT (7.5%)" in the prototype quote summary panel
    defaultVatRate: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 7.5,
    },
    logoUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    taxId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    bankAccounts: {
        type: sequelize_1.DataTypes.JSONB, // or DataTypes.JSON for MySQL/SQLite
        allowNull: false,
        defaultValue: [],
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt columns.
    underscored: true, // Maps camelCase fields to snake_case columns (e.g. companyName → company_name).
    tableName: 'company_settings', // Explicit table name in the database.
});
// Exporting the Settings model for use in other parts of the application.
exports.default = CompanySettings;
//# sourceMappingURL=company-settings.model.js.map