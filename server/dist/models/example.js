"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/CompanySetting.ts
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class CompanySetting extends sequelize_1.Model {
}
CompanySetting.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    companyName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Leapback',
    },
    companyAddress: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    companyEmail: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true },
    },
    companyPhone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    invoiceFooter: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
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
    sequelize: database_1.sequelize,
    tableName: 'company_settings',
    timestamps: true,
});
exports.default = CompanySetting;
//# sourceMappingURL=example.js.map