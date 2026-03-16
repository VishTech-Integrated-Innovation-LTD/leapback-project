import { Sequelize } from 'sequelize';

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
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
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log(
      isProduction
        ? 'Connected to production database'
        : 'Connected to local database'
    );
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

export default sequelize;