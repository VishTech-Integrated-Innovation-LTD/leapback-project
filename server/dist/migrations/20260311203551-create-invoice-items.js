'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('invoice_items', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            // Foreign key - links this line item back to its parent invoice
            // CASCADE delete means if the invoice is deleted, its items are deleted too
            invoice_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'invoices', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            // Permanent snapshot of the item name at time of invoicing
            // Copied from quote_items - shown in the line items table on the invoice PDF
            item_name: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            // Whether this was a physical product or a service
            item_type: {
                type: Sequelize.ENUM('product', 'service'),
                allowNull: false,
            },
            // Number of units or hours billed
            quantity: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            // Price per unit locked at the time of invoice generation
            unit_price: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
            },
            // quantity × unit_price
            line_total: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
            },
            // No timestamps - invoice items are immutable snapshots, never updated
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('invoice_items');
    },
};
//# sourceMappingURL=20260311203551-create-invoice-items.js.map