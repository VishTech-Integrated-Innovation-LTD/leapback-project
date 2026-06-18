'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
    await queryInterface.createTable('company_settings', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
      },

      company_name: {
        type:         Sequelize.STRING(200),
        allowNull:    false,
        defaultValue: 'Leapback Limited',
      },

      company_address: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },

      company_email: {
        type:      Sequelize.STRING(150),
        allowNull: true,
        validate: { isEmail: true },
      },

      company_phone: {
        type:      Sequelize.STRING(30),
        allowNull: true,
      },

      invoice_footer: {
        type:         Sequelize.TEXT,
        allowNull:    true,
        defaultValue: 'Thank you for your business.',
      },

      default_vat_rate: {
        type:         Sequelize.DECIMAL(5, 2),
        allowNull:    false,
        defaultValue: 7.5,
      },

      logo_url: {
        type:      Sequelize.STRING,
        allowNull: true,
      },

      tax_id: {
        type:      Sequelize.STRING,
        allowNull: true,
      },

      website: {
        type:      Sequelize.STRING,
        allowNull: true,
      },

      // Stores multiple bank accounts as JSON array
      bank_accounts: {
        type:         Sequelize.JSONB,
        allowNull:    false,
        defaultValue: [],
      },

      created_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },

      updated_at: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('company_settings');
  },
};