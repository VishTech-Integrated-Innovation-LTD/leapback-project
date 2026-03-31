'use strict';

// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
import { DataTypes, Model } from 'sequelize';

// Importing the configured Sequelize instance for database connection.
import sequelize from '../db';

// Defining the ClientAttributes interface to specify the shape of the Client model's attributes.
// This ensures type safety for the model's fields and their expected values.
interface ClientAttributes {
  sn?: number;
  id?: string;
  clientName: string;       // clientName instead of companyName - clients can be individuals too
  contactPerson?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
}

// Defining the ClientInstance interface, which extends Sequelize's Model class and ClientAttributes.
// This combines Sequelize's model functionality with the custom attributes for type-safe instances.
interface ClientInstance extends Model<ClientAttributes>, ClientAttributes {}

// Defining the Client model using sequelize.define, specifying the model name, attributes, and options.
// The generic type ClientInstance ensures type safety for the model's instances.
const Client = sequelize.define<ClientInstance>(
  'Client',
  {
    sn: {
      type:          DataTypes.INTEGER,
      autoIncrement: true,
      unique:        true,
    },

    id: {
      type:         DataTypes.UUID,         // UUID type for unique identifier.
      defaultValue: DataTypes.UUIDV4,       // Automatically generates a UUID v4 for new records.
      primaryKey:   true,                   // Marks this field as the primary key.
    },

    // Name of the client - can be a business name or an individual's name
    // e.g. "Nexus Energy Ltd", "TechBridge Nigeria", or "Chukwuemeka Adeyemi"
    clientName: {
      type:      DataTypes.STRING(200),
      allowNull: false,
    },

    // The specific contact person if the client is a company
    // e.g. "Chukwuemeka Adeyemi" shown in the prototype invoice view
    contactPerson: {
      type:      DataTypes.STRING(150),
      allowNull: true,
    },

    // Client email - used to send quote PDFs and invoice notifications automatically
    email: {
      type:      DataTypes.STRING(150),
      allowNull: false,
      unique:    true,
    },

    // Client phone number - displayed on invoice documents
    phone: {
      type:      DataTypes.STRING(30),
      allowNull: true,
    },

    // Physical address of the client
    address: {
      type:      DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps:  true,       // Automatically adds createdAt and updatedAt columns.
    underscored: true,       // Maps camelCase fields to snake_case columns (e.g. clientName → client_name).
    tableName:   'clients',  // Explicit table name in the database.
  }
);

// Exporting the Client model for use in other parts of the application.
export default Client;