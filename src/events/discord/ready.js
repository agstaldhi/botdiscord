const logger = require('../../utils/logger');
const { initGiveaways } = require('../../modules/giveaway/giveawayScheduler');
const { initStatsScheduler } = require('../../modules/stats/statsUpdater');

module.exports = {
  name: 'ready',
  once: true,
  /**
   * @param {import('../../client')} client 
   */
  async execute(client) {
    logger.info(`Bot berhasil online! Login sebagai: ${client.user.tag}`);
    
    // Atur Presence Bot (Watching MonoHex | /help)
    client.user.setPresence({
      activities: [
        { 
          name: `${client.guilds.cache.size} servers | /help`, 
          type: 3 // Watching
        }
      ],
      status: 'online'
    });

    // Jalankan scheduler giveaway aktif
    await initGiveaways(client);

    // Jalankan scheduler stats channel otomatis
    initStatsScheduler(client);
  }
};
