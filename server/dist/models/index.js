"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySettings = exports.InvoiceItem = exports.Invoice = exports.QuoteItem = exports.Quote = exports.Inventory = exports.Client = exports.User = void 0;
// Importing all models from their respective files
// Each model has its own file - no bundled exports
const user_model_1 = __importDefault(require("./user.model"));
exports.User = user_model_1.default;
const client_model_1 = __importDefault(require("./client.model"));
exports.Client = client_model_1.default;
const inventory_model_1 = __importDefault(require("./inventory.model"));
exports.Inventory = inventory_model_1.default;
const quote_model_1 = __importDefault(require("./quote.model"));
exports.Quote = quote_model_1.default;
const quote_item_model_1 = __importDefault(require("./quote-item.model"));
exports.QuoteItem = quote_item_model_1.default;
const invoice_model_1 = __importDefault(require("./invoice.model"));
exports.Invoice = invoice_model_1.default;
const invoice_item_model_1 = __importDefault(require("./invoice-item.model"));
exports.InvoiceItem = invoice_item_model_1.default;
const company_settings_model_1 = __importDefault(require("./company-settings.model"));
exports.CompanySettings = company_settings_model_1.default;
// ── Associations ──────────────────────────────────────────────────────────────
// Defines all relationships between models in one central place.
// These must be declared before any queries run - importing this file in app.ts
// ensures all associations are registered at startup.
// Quote ↔ Client
// A client can have many quotes; each quote belongs to one client
client_model_1.default.hasMany(quote_model_1.default, { foreignKey: 'clientId', as: 'quotes' });
quote_model_1.default.belongsTo(client_model_1.default, { foreignKey: 'clientId', as: 'client' });
// Quote ↔ User (creator)
// A staff member can create many quotes; each quote tracks who created it
user_model_1.default.hasMany(quote_model_1.default, { foreignKey: 'createdBy', as: 'createdQuotes' });
quote_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'createdBy', as: 'creator' });
// Quote ↔ QuoteItems
// A quote has many line items; each line item belongs to one quote
// CASCADE ensures line items are deleted automatically when their quote is deleted
quote_model_1.default.hasMany(quote_item_model_1.default, { foreignKey: 'quoteId', as: 'items', onDelete: 'CASCADE' });
quote_item_model_1.default.belongsTo(quote_model_1.default, { foreignKey: 'quoteId' });
// QuoteItem ↔ Inventory (optional)
// A line item may reference an inventory item (dropdown selection)
// or have no reference at all (manual entry) - hence allowNull: true on inventoryId
inventory_model_1.default.hasMany(quote_item_model_1.default, { foreignKey: 'inventoryId', as: 'quoteItems' });
quote_item_model_1.default.belongsTo(inventory_model_1.default, { foreignKey: 'inventoryId', as: 'inventoryItem' });
// Invoice ↔ Quote
// Each approved quote generates exactly one invoice
quote_model_1.default.hasOne(invoice_model_1.default, { foreignKey: 'quoteId', as: 'invoice' });
invoice_model_1.default.belongsTo(quote_model_1.default, { foreignKey: 'quoteId', as: 'quote' });
// Invoice ↔ Client
// A client can have many invoices; each invoice belongs to one client
client_model_1.default.hasMany(invoice_model_1.default, { foreignKey: 'clientId', as: 'invoices' });
invoice_model_1.default.belongsTo(client_model_1.default, { foreignKey: 'clientId', as: 'client' });
// Invoice ↔ User (creator)
// A staff member can generate many invoices; each invoice tracks who generated it
user_model_1.default.hasMany(invoice_model_1.default, { foreignKey: 'createdBy', as: 'createdInvoices' });
invoice_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'createdBy', as: 'creator' });
// Invoice ↔ InvoiceItems
// An invoice has many line items; each line item belongs to one invoice
// CASCADE ensures line items are deleted automatically when their invoice is deleted
invoice_model_1.default.hasMany(invoice_item_model_1.default, { foreignKey: 'invoiceId', as: 'items', onDelete: 'CASCADE' });
invoice_item_model_1.default.belongsTo(invoice_model_1.default, { foreignKey: 'invoiceId' });
// 'use strict';
// const fs = require('fs');
// const path = require('path');
// const Sequelize = require('sequelize');
// const process = require('process');
// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.json')[env];
// const db = {};
// let sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }
// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (
//       file.indexOf('.') !== 0 &&
//       file !== basename &&
//       file.slice(-3) === '.js' &&
//       file.indexOf('.test.js') === -1
//     );
//   })
//   .forEach(file => {
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
//   });
// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });
// db.sequelize = sequelize;
// db.Sequelize = Sequelize;
// module.exports = db;
//# sourceMappingURL=index.js.map