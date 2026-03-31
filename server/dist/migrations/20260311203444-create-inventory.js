'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('inventory', {
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
            // Name of the product or service shown in the inventory table and on quote line items
            // e.g. "Solar Panel 400W", "IT Consulting", "Network Infrastructure"
            name: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            // Unique product code shown under the item name in the prototype
            // e.g. "SP-400W", "INV-5K". Null for services since they have no physical stock.
            item_code: {
                type: Sequelize.STRING(80),
                allowNull: true,
                unique: true,
            },
            // Determines whether this item is a physical product (has stock) or a service (has availability)
            type: {
                type: Sequelize.ENUM('product', 'service'),
                allowNull: false,
            },
            // Groups items for filtering - "Solar", "IT", "Services", "Energy" in the prototype
            category: {
                type: Sequelize.STRING(80),
                allowNull: true,
            },
            // The price per unit used to calculate quote line totals
            // e.g. ₦85,000 for Solar Panel 400W, ₦17,500/hr for IT Consulting
            unit_price: {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: false,
            },
            // Current stock count for physical products - decremented automatically when a quote is approved
            // Null for services. Shows as "2 units", "18 units" in the prototype inventory table.
            stock_qty: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            // When stock_qty drops to or below this number, a low stock alert appears on the dashboard
            // e.g. "Solar Panel 400W - 2 left" in the prototype dashboard
            low_stock_threshold: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 5,
            },
            // Availability state for services only - "Available", "Busy" in the prototype
            // Null for physical products since they use stock_qty instead
            availability_status: {
                type: Sequelize.ENUM('available', 'busy', 'unavailable'),
                allowNull: true,
                defaultValue: 'available',
            },
            // Soft delete flag - deactivated items are hidden without being permanently removed
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
        await queryInterface.dropTable('inventory');
    },
};
//# sourceMappingURL=20260311203444-create-inventory.js.map