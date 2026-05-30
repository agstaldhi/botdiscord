const { Sequelize } = require('sequelize');
const logger = require('./utils/logger');

const databaseUrl = process.env.DATABASE_URL;

let sequelize = null;

if (!databaseUrl) {
  logger.error("Error: DATABASE_URL tidak ditemukan di file .env!");
  logger.warn("Beberapa fitur bot yang memerlukan database tidak akan berfungsi.");
} else {
  sequelize = new Sequelize(databaseUrl, {
    logging: (msg) => logger.debug(msg),
    dialect: 'postgres',
    dialectOptions: {
      // Opsi tambahan jika diperlukan di masa depan (seperti SSL untuk Neon/Supabase)
      // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    define: {
      freezeTableName: true, // Nama tabel sama dengan nama model
      timestamps: true       // Otomatis membuat kolom createdAt & updatedAt
    }
  });
}

module.exports = sequelize;
