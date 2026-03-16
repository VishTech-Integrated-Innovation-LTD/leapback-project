"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
const sequelize_1 = require("sequelize");
// Importing the configured Sequelize instance for database connection.
const db_1 = __importDefault(require("../db"));
// Defining the User model using sequelize.define, specifying the model name, attributes, and options.
// The generic type UserInstance ensures type safety for the model's instances.
const User = db_1.default.define('User', {
    // Defining the model's attributes (columns) with their data types.
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
    // Full name of the staff member — displayed in the sidebar and Settings staff table
    // e.g. "Admin User", "Temi O.", "Chidi A." as seen in the prototype
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    // Email used as the login credential on the sign-in page (quote.leapback.ng)
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: sequelize_1.DataTypes.STRING, // String type for the user's password (hashed with bcrypt).
        allowNull: false,
    },
    // All users of this internal tool are admins — only authorised Leapback staff can log in
    userType: {
        type: sequelize_1.DataTypes.ENUM('admin'),
        allowNull: false,
        defaultValue: 'admin',
    },
    // Controls the Active / Inactive status shown on the Settings staff table in the prototype
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    // Records the last time this staff member signed in — useful for security auditing
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt columns to track record creation/update times.
    underscored: true, // Maps camelCase fields to snake_case database columns (e.g. isActive → is_active).
    tableName: 'users', // Explicit table name in the database.
});
// Exporting the User model for use in other parts of the application.
exports.default = User;
//# sourceMappingURL=user.model.js.map