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
// Defining the InvoiceItem model using sequelize.define, specifying the model name, attributes, and options.
// Each row is a permanent snapshot of a line item at the time of invoicing.
// Copied from QuoteItems when the invoice is generated — never changed afterwards.
// e.g. "Solar Panel 400W | Product | 5 | ₦85,000 | ₦425,000" from the prototype invoice PDF
const InvoiceItem = db_1.default.define('InvoiceItem', {
    id: {
        type: sequelize_1.DataTypes.UUID, // UUID type for unique identifier.
        defaultValue: sequelize_1.DataTypes.UUIDV4, // Automatically generates a UUID v4 for new records.
        primaryKey: true, // Marks this field as the primary key.
    },
    // Foreign key linking this line item back to its parent invoice
    // CASCADE delete means if the invoice is deleted, its items are deleted too
    invoiceId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'invoices', key: 'id' },
    },
    // Permanent snapshot of the item name at time of invoicing
    itemName: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    // Whether this was a physical product or a service
    itemType: {
        type: sequelize_1.DataTypes.ENUM('product', 'service'),
        allowNull: false,
    },
    // Number of units or hours billed
    quantity: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    // Price per unit locked at the time of invoice generation
    unitPrice: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
    },
    // quantity × unitPrice
    lineTotal: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
    },
}, {
    timestamps: false, // Invoice items are immutable snapshots — no need to track time.
    underscored: true, // Maps camelCase fields to snake_case columns (e.g. invoiceId → invoice_id).
    tableName: 'invoice_items', // Explicit table name in the database.
});
// Exporting the InvoiceItem model for use in other parts of the application.
exports.default = InvoiceItem;
//# sourceMappingURL=invoice-item.model.js.map