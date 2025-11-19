require('dotenv-safe/config');

const common = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  dialectOptions: {
    ssl:
      process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : undefined,
  },
  migrationStorageTableName: 'sequelize_meta',
};

module.exports = {
  development: common,
  test: {
    ...common,
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/gestion_eventos_test',
  },
  production: common,
};
