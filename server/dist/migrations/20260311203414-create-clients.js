'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('clients', {
            sn: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                unique: true,
            },
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            // The  name of the client
            // e.g. "Nexus Energy Ltd", "TechBridge Nigeria"  or "Chukwuemeka Adeyemi" as shown in the prototype
            client_name: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            // The specific person person if the client is a company to address quotes/invoices to
            contact_person: {
                type: Sequelize.STRING(150),
                allowNull: true,
            },
            // Client email — used to send quote PDFs and invoice notifications automatically
            email: {
                type: Sequelize.STRING(150),
                allowNull: false,
                unique: true,
            },
            // Client phone number — displayed on invoice documents
            phone: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },
            // Physical address of the client
            address: {
                type: Sequelize.TEXT,
                allowNull: true,
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
        await queryInterface.dropTable('clients');
    },
};
//# sourceMappingURL=20260311203414-create-clients.js.map