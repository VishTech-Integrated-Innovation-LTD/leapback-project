// Importing all models from their respective files
// Each model has its own file - no bundled exports
import User        from './user.model';
import Client      from './client.model';
import Inventory   from './inventory.model';
import Quote       from './quote.model';
import QuoteItem   from './quote-item.model';
import Invoice     from './invoice.model';
import InvoiceItem from './invoice-item.model';

// ── Associations ──────────────────────────────────────────────────────────────
// Defines all relationships between models in one central place.
// These must be declared before any queries run - importing this file in app.ts
// ensures all associations are registered at startup.

// Quote ↔ Client
// A client can have many quotes; each quote belongs to one client
Client.hasMany(Quote,   { foreignKey: 'clientId', as: 'quotes' });
Quote.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Quote ↔ User (creator)
// A staff member can create many quotes; each quote tracks who created it
User.hasMany(Quote,   { foreignKey: 'createdBy', as: 'createdQuotes' });
Quote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Quote ↔ QuoteItems
// A quote has many line items; each line item belongs to one quote
// CASCADE ensures line items are deleted automatically when their quote is deleted
Quote.hasMany(QuoteItem,     { foreignKey: 'quoteId', as: 'items', onDelete: 'CASCADE' });
QuoteItem.belongsTo(Quote,   { foreignKey: 'quoteId' });

// QuoteItem ↔ Inventory (optional)
// A line item may reference an inventory item (dropdown selection)
// or have no reference at all (manual entry) - hence allowNull: true on inventoryId
Inventory.hasMany(QuoteItem,      { foreignKey: 'inventoryId', as: 'quoteItems' });
QuoteItem.belongsTo(Inventory,    { foreignKey: 'inventoryId', as: 'inventoryItem' });

// Invoice ↔ Quote
// Each approved quote generates exactly one invoice
Quote.hasOne(Invoice,     { foreignKey: 'quoteId', as: 'invoice' });
Invoice.belongsTo(Quote,  { foreignKey: 'quoteId', as: 'quote' });

// Invoice ↔ Client
// A client can have many invoices; each invoice belongs to one client
Client.hasMany(Invoice,    { foreignKey: 'clientId', as: 'invoices' });
Invoice.belongsTo(Client,  { foreignKey: 'clientId', as: 'client' });

// Invoice ↔ User (creator)
// A staff member can generate many invoices; each invoice tracks who generated it
User.hasMany(Invoice,    { foreignKey: 'createdBy', as: 'createdInvoices' });
Invoice.belongsTo(User,  { foreignKey: 'createdBy', as: 'creator' });

// Invoice ↔ InvoiceItems
// An invoice has many line items; each line item belongs to one invoice
// CASCADE ensures line items are deleted automatically when their invoice is deleted
Invoice.hasMany(InvoiceItem,   { foreignKey: 'invoiceId', as: 'items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });

// Exporting all models from a single entry point
// Import from here instead of individual model files wherever associations are needed
export { User, Client, Inventory, Quote, QuoteItem, Invoice, InvoiceItem };













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
