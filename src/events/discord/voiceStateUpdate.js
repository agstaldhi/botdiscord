const TempVCConfig = require('../../models/TempVCConfig');
const TempVC = require('../../models/TempVC');
const { createTempVC } = require('../../modules/tempvc/createTempVC');
const { deleteTempVC } = require('../../modules/tempvc/deleteTempVC');
const { transferOwnership } = require('../../modules/tempvc/transferOwnership');
const logger = require('../../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').VoiceState} oldState 
   * @param {import('discord.js').VoiceState} newState 
   */
  async execute(client, oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild || oldState.guild;

    // 1. Deteksi JOIN ke Trigger Channel
    if (newState.channelId) {
      try {
        const config = await TempVCConfig.findOne({ where: { guildId: guild.id } });
        if (config && config.enabled && newState.channelId === config.triggerChannelId) {
          await createTempVC(member, newState);
        }
      } catch (err) {
        logger.error('Error saat mendeteksi join trigger channel TempVC:', err);
      }
    }

    // 2. Deteksi LEAVE dari Temporary Channel
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      try {
        // Cek apakah channel yang ditinggalkan adalah TempVC
        const tempVC = await TempVC.findOne({ where: { channelId: oldState.channelId } });
        if (tempVC) {
          const oldChannel = guild.channels.cache.get(oldState.channelId);
          if (oldChannel) {
            // Filter hanya member manusia yang tersisa
            const humansRemaining = oldChannel.members.filter(m => !m.user.bot);

            if (humansRemaining.size === 0) {
              // Jika kosong dari manusia, hapus TempVC
              await deleteTempVC(oldChannel);
            } else if (tempVC.ownerId === member.id) {
              // Jika owner keluar tapi masih ada member manusia lain, transfer ownership
              const newOwner = humansRemaining.first();
              await transferOwnership(oldChannel, newOwner, member.id);
            }
          } else {
            // Jika channel sudah dihapus di Discord tetapi record DB masih ada
            await TempVC.destroy({ where: { channelId: oldState.channelId } });
          }
        }
      } catch (err) {
        logger.error('Error saat mendeteksi leave TempVC:', err);
      }
    }
  }
};
