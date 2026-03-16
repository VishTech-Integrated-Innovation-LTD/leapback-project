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
// Defining the Client model using sequelize.define, specifying the model name, attributes, and options.
// The generic type ClientInstance ensures type safety for the model's instances.
const Client = db_1.default.define('Client', {
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
    // Name of the client — can be a business name or an individual's name
    // e.g. "Nexus Energy Ltd", "TechBridge Nigeria", or "Chukwuemeka Adeyemi"
    clientName: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    // The specific contact person if the client is a company
    // e.g. "Chukwuemeka Adeyemi" shown in the prototype invoice view
    contactPerson: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: true,
    },
    // Client email — used to send quote PDFs and invoice notifications automatically
    email: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        unique: true,
    },
    // Client phone number — displayed on invoice documents
    phone: {
        type: sequelize_1.DataTypes.STRING(30),
        allowNull: true,
    },
    // Physical address of the client
    address: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt columns.
    underscored: true, // Maps camelCase fields to snake_case columns (e.g. clientName → client_name).
    tableName: 'clients', // Explicit table name in the database.
});
// Exporting the Client model for use in other parts of the application.
exports.default = Client;
//# sourceMappingURL=client.model.js.map