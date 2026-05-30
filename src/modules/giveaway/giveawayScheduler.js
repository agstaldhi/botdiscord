const Giveaway = require('../../models/Giveaway');
const { endGiveaway, scheduleGiveawayEnd } = require('./giveawayManager');
const logger = require('../../utils/logger');

/**
 * Menginisialisasi dan menjadwalkan ulang seluruh giveaway aktif saat bot startup
 * @param {import('../../client')} client 
 */
async function initGiveaways(client) {
  try {
    const activeGiveaways = await Giveaway.findAll({
      where: { ended: false }
    });

    if (activeGiveaways.length === 0) return;

    logger.info(`Menjadwalkan ulang ${activeGiveaways.length} giveaway aktif dari database...`);
    const now = Date.now();

    for (const giveaway of activeGiveaways) {
      const endTime = new Date(giveaway.endTime).getTime();
      const delay = endTime - now;

      if (delay <= 0) {
        // Jika waktu berakhir sudah terlewat selama bot offline, akhiri sekarang juga
        logger.info(`Mengakhiri giveaway tertunda: ${giveaway.prize} (Message ID: ${giveaway.messageId})`);
        await endGiveaway(client, giveaway.messageId);
      } else {
        // Jadwalkan sisa waktu
        logger.info(`Menjadwalkan giveaway: ${giveaway.prize} dalam ${Math.round(delay / 1000)} detik`);
        scheduleGiveawayEnd(client, giveaway.messageId, delay);
      }
    }
  } catch (error) {
    logger.error('Error saat inisialisasi penjadwal giveaway:', error);
  }
}

module.exports = { initGiveaways };
