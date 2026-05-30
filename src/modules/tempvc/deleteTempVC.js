const TempVCConfig = require('../../models/TempVCConfig');
const TempVC = require('../../models/TempVC');
const logger = require('../../utils/logger');

/**
 * Menghapus Temporary Voice Channel yang kosong
 * @param {import('discord.js').VoiceChannel} channel 
 */
async function deleteTempVC(channel) {
  try {
    const guild = channel.guild;

    // Ambil konfigurasi untuk delay
    const config = await TempVCConfig.findOne({ where: { guildId: guild.id } });
    const delaySec = config?.deleteDelay || 0;

    const performDelete = async () => {
      // Fetch channel data terbaru untuk memastikan masih kosong
      const currentChannel = guild.channels.cache.get(channel.id);
      if (!currentChannel) {
        // Channel sudah didelete secara manual di Discord
        await TempVC.destroy({ where: { channelId: channel.id } });
        return;
      }

      // Check if channel is still empty
      if (currentChannel.members.size === 0) {
        await currentChannel.delete('Temporary Voice Channel kosong.').catch(() => {});
        await TempVC.destroy({ where: { channelId: channel.id } });
        logger.info(`TempVC dihapus karena kosong: ${channel.name} (${channel.id})`);
      }
    };

    if (delaySec > 0) {
      setTimeout(performDelete, delaySec * 1000);
    } else {
      await performDelete();
    }

  } catch (error) {
    logger.error(`Error saat menghapus TempVC ${channel.id}:`, error);
  }
}

module.exports = { deleteTempVC };
