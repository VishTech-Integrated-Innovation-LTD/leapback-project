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
// Defining the QuoteItem model using sequelize.define, specifying the model name, attributes, and options.
// Each row represents one line item on a quote
// e.g. "Solar Panel 400W | Product | 5 | ₦85,000 | ₦425,000" from the prototype
const QuoteItem = db_1.default.define('QuoteItem', {
    id: {
        type: sequelize_1.DataTypes.UUID, // UUID type for unique identifier.
        defaultValue: sequelize_1.DataTypes.UUIDV4, // Automatically generates a UUID v4 for new records.
        primaryKey: true, // Marks this field as the primary key.
    },
    // Foreign key linking this line item back to its parent quote
    // CASCADE delete means if the quote is deleted, its items are deleted too
    quoteId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: 'quotes', key: 'id' },
    },
    // Optional reference to the inventory item selected from the dropdown
    // Null if the staff member typed the item in manually
    inventoryId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: 'inventory', key: 'id' },
    },
    // Name of the item as it appears on the quote document
    // Auto-filled from inventory if inventoryId is set, otherwise typed manually
    itemName: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    // Whether this line is a physical product or a service
    itemType: {
        type: sequelize_1.DataTypes.ENUM('product', 'service'),
        allowNull: false,
    },
    // How many units or hours were quoted
    quantity: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    // Price per unit at the time the quote was created - locked at creation
    // Copied from inventory if inventoryId is set, preventing price tampering
    unitPrice: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
    },
    // quantity × unitPrice - pre-calculated and stored
    lineTotal: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
    },
}, {
    timestamps: true, // Adds createdAt only - see updatedAt below.
    updatedAt: false, // Line items are never edited after creation.
    underscored: true, // Maps camelCase fields to snake_case columns (e.g. quoteId → quote_id).
    tableName: 'quote_items', // Explicit table name in the database.
});
// Exporting the QuoteItem model for use in other parts of the application.
exports.default = QuoteItem;
//# sourceMappingURL=quote-item.model.js.map