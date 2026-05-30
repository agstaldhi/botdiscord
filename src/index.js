require('dotenv').config();
const sequelize = require('./database');
const MonoHexClient = require('./client');
const logger = require('./utils/logger');

// Buat instance client MonoHex
const client = new MonoHexClient();

/**
 * Menghubungkan bot ke database PostgreSQL dan melakukan sinkronisasi tabel
 */
const connectDatabase = async () => {
  if (!sequelize) {
    logger.warn("Peringatan: Bot berjalan dalam mode OFFLINE DATABASE (Mock Mode).");
    return;
  }

  try {
    // Muat semua model Sequelize agar terdaftar sebelum sync
    require('./models');

    // 1. Authenticate koneksi
    await sequelize.authenticate();
    logger.info("Sukses terhubung ke database PostgreSQL.");
    
    // 2. Sinkronisasi tabel model dengan database
    // alter: true otomatis menyesuaikan kolom tabel tanpa menghapus data yang ada
    await sequelize.sync({ alter: true });
    logger.info("Sinkronisasi model ke tabel PostgreSQL berhasil.");
  } catch (error) {
    logger.error("Gagal terhubung ke database PostgreSQL:", error);
    logger.warn("Bot akan tetap mencoba berjalan menggunakan mock fallback database.");
  }
};

/**
 * Menginisialisasi modul dan menghidupkan bot
 */
const startBot = async () => {
  logger.info("Memulai inisialisasi MonoHex...");

  // 1. Hubungkan Database PostgreSQL
  await connectDatabase();

  // 2. Load Handlers
  require('./handlers/commandHandler')(client);
  require('./handlers/eventHandler')(client);

  // 3. Load Discord Player Extractors
  try {
    await client.player.extractors.loadDefault();
    logger.info("Extractors musik discord-player berhasil dimuat.");
    
    // Daftarkan antrean event tertunda jika ada
    if (client._tempPlayerEvents && client._tempPlayerEvents.length > 0) {
      client._tempPlayerEvents.forEach(({ name, event }) => {
        client.player.events.on(name, (...args) => event.execute(client, ...args));
      });
      logger.info(`Berhasil mendaftarkan ${client._tempPlayerEvents.length} player events tertunda.`);
    }
  } catch (err) {
    logger.error("Gagal memuat extractors musik discord-player:", err);
  }

  // 3. Login ke Gateway Discord
  const token = process.env.DISCORD_TOKEN;
  if (!token || token === 'your_bot_token_here') {
    logger.error("Error: DISCORD_TOKEN tidak valid atau belum di-set di file .env!");
    process.exit(1);
  }

  try {
    await client.login(token);
  } catch (error) {
    logger.error("Gagal login ke Discord Gateway:", error);
    process.exit(1);
  }
};

// Tangkap uncaught exceptions agar bot tidak crash tak terduga
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection di promise:', promise, 'alasan:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception terjadi:', error);
});

startBot();
