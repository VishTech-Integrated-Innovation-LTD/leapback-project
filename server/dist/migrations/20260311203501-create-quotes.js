'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('quotes', {
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
            // Human-readable reference number — e.g. "QT-024" shown throughout the prototype
            quote_number: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true,
            },
            // Foreign key — links this quote to the client it was created for
            // References clients table — must exist before quotes can be created
            client_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'clients', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT', // prevent deleting a client that has quotes
            },
            // Foreign key — tracks which staff member created this quote
            // References users table — must exist before quotes can be created
            created_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            // Lifecycle status — drives the colour-coded badges in the prototype quotes table
            // draft → pending (submitted) → approved / rejected / cancelled
            status: {
                type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled'),
                allowNull: false,
                defaultValue: 'draft',
            },
            // VAT percentage applied to this quote — nullable if no VAT is charged
            vat_rate: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
            },
            subtotal: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
                defaultValue: 0,
            },
            // VAT amount calculated from subtotal × vat_rate — null if no VAT is applied
            vat_amount: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: true,
            },
            // Final amount shown on the quote — subtotal + vat_amount
            // e.g. ₦516,000 shown in the prototype quote summary panel
            grand_total: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
                defaultValue: 0,
            },
            // Optional notes from the staff member — entered in the Notes field on the New Quote page
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            // File path to the generated PDF stored on the server after the quote is submitted
            pdf_path: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            // Timestamp of when the quote PDF was emailed to the client
            sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            // Timestamp of when the staff member marked the quote as approved
            approved_at: {
                type: Sequelize.DATE,
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
        await queryInterface.dropTable('quotes');
    },
};
//# sourceMappingURL=20260311203501-create-quotes.js.map