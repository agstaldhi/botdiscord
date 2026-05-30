const StatsConfig = require('../../models/StatsConfig');
const logger = require('../../utils/logger');

/**
 * Mengupdate nama stats channel berdasarkan tipe statistik
 * @param {import('../../client')} client 
 * @param {string} guildId 
 */
async function updateStats(client, guildId) {
  try {
    const config = await StatsConfig.findOne({ where: { guildId } });
    if (!config || !config.channels || config.channels.length === 0) return;

    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;

    // Pastikan cache member terisi untuk akurasi data bots/humans/online
    await guild.members.fetch({ withPresences: true }).catch(() => {});

    for (const c of config.channels) {
      const channel = guild.channels.cache.get(c.channelId);
      if (!channel) continue;

      let value = 0;
      switch (c.type) {
        case 'totalMembers':
          value = guild.memberCount;
          break;
        case 'onlineMembers':
          value = guild.members.cache.filter(m => m.presence && m.presence.status !== 'offline').size;
          break;
        case 'bots':
          value = guild.members.cache.filter(m => m.user.bot).size;
          break;
        case 'humans':
          value = guild.members.cache.filter(m => !m.user.bot).size;
          break;
        case 'boosts':
          value = guild.premiumSubscriptionCount || 0;
          break;
        case 'channels':
          value = guild.channels.cache.size;
          break;
        case 'roles':
          value = guild.roles.cache.size;
          break;
      }

      const newName = c.template.replace('{value}', value);

      // Hanya rename jika nama berbeda untuk menghemat rate limit API Discord
      if (channel.name !== newName) {
        await channel.setName(newName).catch(err => {
          logger.warn(`Gagal mengubah nama stats channel ${channel.id} ke "${newName}":`, err.message);
        });
      }
    }
  } catch (error) {
    logger.error(`Error saat mengupdate stats channel untuk guild ${guildId}:`, error);
  }
}

/**
 * Menginisialisasi scheduler update stats channel berkala
 * @param {import('../../client')} client 
 */
function initStatsScheduler(client) {
  // Jalankan update pertama kali setelah bot online
  setTimeout(async () => {
    logger.info('Mempersiapkan stats channels update awal...');
    try {
      const configs = await StatsConfig.findAll();
      for (const config of configs) {
        await updateStats(client, config.guildId);
      }
    } catch (err) {
      logger.error('Error saat inisialisasi stats channel update:', err);
    }
  }, 10000); // Tunggu 10 detik agar cache guild/member selesai ter-load

  // Jadwalkan update berkala setiap 10 menit
  setInterval(async () => {
    logger.info('Menjalankan pembaharuan stats channels otomatis...');
    try {
      const configs = await StatsConfig.findAll();
      for (const config of configs) {
        await updateStats(client, config.guildId);
      }
    } catch (err) {
      logger.error('Error saat pembaharuan berkala stats channel:', err);
    }
  }, 10 * 60 * 1000); // 10 menit
}

module.exports = {
  updateStats,
  initStatsScheduler
};
