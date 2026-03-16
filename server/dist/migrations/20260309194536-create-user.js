'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            sn: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                unique: true,
            },
            id: {
                type: Sequelize.UUID, // UUID type for unique identifier.
                defaultValue: Sequelize.UUIDV4, // Automatically generates a UUID v4 for new records.
                primaryKey: true, // Marks this field as the primary key.
            },
            // Full name of the staff member — displayed in the sidebar and Settings staff table
            // e.g. "Admin User", "Temi O.", "Chidi A." as seen in the prototype
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            // Email used as the login credential on the sign-in page (quote.leapback.ng)
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            // Hashed with bcrypt before saving — never stored as plain text
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            // All users of this internal tool are admins — only authorised Leapback staff can log in
            // snake_case here because migrations write directly to the database
            // (underscored: true in the model handles the camelCase → snake_case translation in app code only)
            user_type: {
                type: Sequelize.ENUM('admin'),
                allowNull: false,
                defaultValue: 'admin',
            },
            // Controls the Active / Inactive status shown on the Settings staff table in the prototype
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            // Records the last time this staff member signed in — useful for security auditing
            last_login_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('users');
    },
};
//# sourceMappingURL=20260309194536-create-user.js.map