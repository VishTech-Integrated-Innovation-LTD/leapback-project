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
// Defining the Quote model using sequelize.define, specifying the model name, attributes, and options.
// The generic type QuoteInstance ensures type safety for the model's instances.
const Quote = db_1.default.define('Quote', {
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
    // Human-readable reference number shown throughout the prototype
    // e.g. "QT-024", "QT-023" in the quotes table and invoice view
    quoteNumber: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    // Foreign key linking this quote to the client it was created for
    clientId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
    },
    // Foreign key tracking which staff member created this quote
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
    },
    // Lifecycle status — drives the colour-coded badges in the prototype quotes table
    // draft → pending (submitted) → approved / rejected / cancelled
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
    },
    // VAT percentage applied to this quote — nullable if no VAT is charged
    vatRate: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: null,
    },
    // Sum of all line item totals before VAT
    subtotal: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    // VAT amount calculated from subtotal × vatRate — null if no VAT is applied
    vatAmount: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
    },
    // Final amount shown on the quote — subtotal + vatAmount
    // e.g. ₦516,000 shown in the prototype quote summary panel
    grandTotal: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    // Optional notes from the staff member — entered in the Notes field on the New Quote page
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    // File path to the generated PDF stored on the server after the quote is submitted
    pdfPath: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    // Timestamp of when the quote PDF was emailed to the client
    sentAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    // Timestamp of when the staff member marked the quote as approved
    approvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt columns.
    underscored: true, // Maps camelCase fields to snake_case columns (e.g. quoteNumber → quote_number).
    tableName: 'quotes', // Explicit table name in the database.
});
// Exporting the Quote model for use in other parts of the application.
exports.default = Quote;
//# sourceMappingURL=quote.model.js.map