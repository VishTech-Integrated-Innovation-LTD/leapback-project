// Importing necessary Sequelize dependencies: DataTypes for defining column types,
// Model for creating the model class
import { DataTypes, Model } from 'sequelize';

// Importing the configured Sequelize instance for database connection.
import sequelize from '../db';

// Defining the UserAttributes interface to specify the shape of the User model's attributes.
// This ensures type safety for the model's fields and their expected values.
interface UserAttributes {
  sn?: number;
  id?: string;
  name: string;
  email: string;
  password: string;
  userType: 'admin';
  isActive: boolean;
  lastLoginAt?: Date | null;
}

// Defining the UserInstance interface, which extends Sequelize's Model class and UserAttributes.
// This combines Sequelize's model functionality with the custom attributes for type-safe instances.
interface UserInstance extends Model<UserAttributes>, UserAttributes {}

// Defining the User model using sequelize.define, specifying the model name, attributes, and options.
// The generic type UserInstance ensures type safety for the model's instances.
const User = sequelize.define<UserInstance>(
  'User',
  {
    // Defining the model's attributes (columns) with their data types.
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

    // Full name of the staff member — displayed in the sidebar and Settings staff table
    // e.g. "Admin User", "Temi O.", "Chidi A." as seen in the prototype
    name: {
      type:      DataTypes.STRING,
      allowNull: false,
    },

    // Email used as the login credential on the sign-in page (quote.leapback.ng)
    email: {
      type:      DataTypes.STRING,
      allowNull: false,
      unique:    true,
    },

    password: {
      type:      DataTypes.STRING,          // String type for the user's password (hashed with bcrypt).
      allowNull: false,
    },

    // All users of this internal tool are admins — only authorised Leapback staff can log in
    userType: {
      type:         DataTypes.ENUM('admin'),
      allowNull:    false,
      defaultValue: 'admin',
    },

    // Controls the Active / Inactive status shown on the Settings staff table in the prototype
    isActive: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: true,
    },

    // Records the last time this staff member signed in — useful for security auditing
    lastLoginAt: {
      type:         DataTypes.DATE,
      allowNull:    true,
      defaultValue: null,
    },
  },
  {
    timestamps:  true,      // Automatically adds createdAt and updatedAt columns to track record creation/update times.
    underscored: true,      // Maps camelCase fields to snake_case database columns (e.g. isActive → is_active).
    tableName:   'users',   // Explicit table name in the database.
  }
);

// Exporting the User model for use in other parts of the application.
export default User;