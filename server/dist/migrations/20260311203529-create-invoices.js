'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('invoices', {
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
            // Human-readable invoice reference — auto-generated when a quote is approved
            // e.g. "#INV-018" shown in the prototype invoice list and PDF header
            invoice_number: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true,
            },
            // Foreign key — links this invoice back to the approved quote it was generated from
            // The prototype shows "Quote Ref: #QT-023" on the invoice view page
            quote_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'quotes', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT', // never delete a quote that has an invoice
            },
            // Foreign key — links this invoice to the billed client
            client_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'clients', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            // Foreign key — tracks which staff member generated this invoice
            created_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            // Payment status — shown as colour-coded badges in the prototype invoice list
            // sent → paid (marked manually by staff) | cancelled (voided, never deleted)
            status: {
                type: Sequelize.ENUM('sent', 'paid', 'cancelled'),
                allowNull: false,
                defaultValue: 'sent',
            },
            // VAT percentage — copied from the original quote. Null if no VAT was applied.
            vat_rate: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
            },
            subtotal: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
            },
            // VAT amount — copied from the approved quote. Null if no VAT was applied.
            vat_amount: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: true,
            },
            // Total amount due — shown as "TOTAL DUE ₦1,290,000" on the prototype invoice PDF
            grand_total: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
            },
            // File path to the generated PDF stored on the server
            pdf_path: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            // Payment deadline shown on the invoice — typically 14 days from generation
            // e.g. "Due Date: Mar 15, 2026" shown in the prototype invoice view
            due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            // Timestamp of when the staff member marked this invoice as paid
            paid_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            // Timestamp of when the invoice PDF was emailed to the client
            sent_at: {
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
        await queryInterface.dropTable('invoices');
    },
};
//# sourceMappingURL=20260311203529-create-invoices.js.map