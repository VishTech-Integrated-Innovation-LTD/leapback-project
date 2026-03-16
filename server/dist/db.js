"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const isProduction = process.env.NODE_ENV === 'production';
const sequelize = new sequelize_1.Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    dialectOptions: isProduction ? {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    } : {},
    logging: !isProduction,
});
(async () => {
    try {
        await sequelize.authenticate();
        console.log(isProduction
            ? 'Connected to production database'
            : 'Connected to local database');
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();
exports.default = sequelize;
//# sourceMappingURL=db.js.map