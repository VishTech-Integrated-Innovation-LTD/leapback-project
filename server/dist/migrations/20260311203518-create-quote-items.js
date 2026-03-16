'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('quote_items', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            // Foreign key — links this line item back to its parent quote
            // CASCADE delete means if the quote is deleted, its items are deleted too
            quote_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'quotes', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            // Optional reference to the inventory item this line was selected from
            // Null if the item was typed in manually rather than picked from the dropdown
            inventory_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'inventory', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL', // if inventory item is deleted, keep the quote item but clear the reference
            },
            // Name of the item as it appears on the quote and invoice documents
            // Copied from inventory at creation time — price changes don't affect existing quotes
            item_name: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            // Whether this line is a physical product or a service
            item_type: {
                type: Sequelize.ENUM('product', 'service'),
                allowNull: false,
            },
            // How many units or hours were quoted
            quantity: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            // Price per unit at the time the quote was created — locked at creation
            unit_price: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
            },
            // quantity × unit_price — pre-calculated and stored
            line_total: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
            },
            // created_at only — line items are never updated after creation
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('quote_items');
    },
};
//# sourceMappingURL=20260311203518-create-quote-items.js.map