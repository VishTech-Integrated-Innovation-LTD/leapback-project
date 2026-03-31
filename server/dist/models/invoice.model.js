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
// Defining the Invoice model using sequelize.define, specifying the model name, attributes, and options.
// The generic type InvoiceInstance ensures type safety for the model's instances.
const Invoice = db_1.default.define('Invoice', {
    sn: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
    },
    id: {
        type: sequelize_1.DataTypes.UUID, // UUID type for unique identifier.
        defaultValue: sequelize_1.DataTypes.UUIDV4, // Automatically generates a UUID v4 for new records.
        primaryKey: true, // Marks this field as the primary key.
    },
    // Human-readable invoice reference - auto-generated when a quote is approved
    // e.g. "#INV-018" shown in the prototype invoice list and PDF header
    invoiceNumber: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    // Foreign key linking this invoice back to the approved quote it was generated from
    // The prototype shows "Quote Ref: #QT-023" on the invoice view page
    quoteId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'quotes', key: 'id' },
    },
    // Foreign key linking this invoice to the billed client
    clientId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
    },
    // Foreign key tracking which staff member generated this invoice
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
    },
    // Payment status - shown as colour-coded badges in the prototype invoice list
    // sent → paid (marked manually by staff) | cancelled (voided, never deleted)
    status: {
        type: sequelize_1.DataTypes.ENUM('sent', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'sent',
    },
    // VAT percentage - copied from the original quote. Null if no VAT was applied.
    vatRate: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    // Sum of all line item totals before VAT - copied from the approved quote
    subtotal: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
    },
    // VAT amount - copied from the approved quote. Null if no VAT was applied.
    vatAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: true,
    },
    // Total amount due - shown as "TOTAL DUE ₦1,290,000" on the prototype invoice PDF
    grandTotal: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
    },
    // File path to the generated PDF stored on the server
    pdfPath: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    // Payment deadline - typically 14 days from generation
    // e.g. "Due Date: Mar 15, 2026" shown in the prototype invoice view
    dueDate: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
    },
    // Timestamp of when the staff member marked this invoice as paid
    paidAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    // Timestamp of when the invoice PDF was emailed to the client
    sentAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt columns.
    underscored: true, // Maps camelCase fields to snake_case columns (e.g. invoiceNumber → invoice_number).
    tableName: 'invoices', // Explicit table name in the database.
});
// Exporting the Invoice model for use in other parts of the application.
exports.default = Invoice;
//# sourceMappingURL=invoice.model.js.map