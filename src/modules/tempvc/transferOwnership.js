const { PermissionFlagsBits } = require('discord.js');
const TempVC = require('../../models/TempVC');
const TempVCConfig = require('../../models/TempVCConfig');
const logger = require('../../utils/logger');

/**
 * Mentransfer kepemilikan TempVC ke member lain
 * @param {import('discord.js').VoiceChannel} channel 
 * @param {import('discord.js').GuildMember} newOwner 
 * @param {string} oldOwnerId 
 */
async function transferOwnership(channel, newOwner, oldOwnerId) {
  try {
    const guild = channel.guild;

    // 1. Update di database
    await TempVC.update(
      { ownerId: newOwner.id },
      { where: { channelId: channel.id } }
    );

    // 2. Perbarui permission di Discord
    // Hapus permission owner lama (jika masih ada di server/channel)
    if (oldOwnerId) {
      await channel.permissionOverwrites.delete(oldOwnerId).catch(() => {});
    }

    // Berikan permission ke owner baru
    await channel.permissionOverwrites.edit(newOwner.id, {
      ViewChannel: true,
      Connect: true,
      ManageChannels: true,
      MoveMembers: true,
      MuteMembers: true,
      DeafenMembers: true
    }).catch(() => {});

    // 3. Opsional: Ganti nama channel sesuai owner baru jika nama saat ini belum dicustom
    const config = await TempVCConfig.findOne({ where: { guildId: guild.id } });
    if (config) {
      let channelName = config.nameTemplate || "🎙️ {username}'s Room";
      channelName = channelName
        .replace('{username}', newOwner.user.username)
        .replace('{displayName}', newOwner.displayName);
      
      if (channelName.length > 100) channelName = channelName.substring(0, 100);
      
      await channel.setName(channelName).catch(() => {});
    }

    // 4. Kirim notifikasi chat ke channel text atau kirim log
    logger.info(`TempVC ownership ditransfer: ${channel.name} (${channel.id}) -> owner baru: ${newOwner.user.tag}`);
    await channel.send(`👑 Kepemilikan room ini telah ditransfer kepada <@${newOwner.id}> karena owner sebelumnya telah keluar.`).catch(() => {});

  } catch (error) {
    logger.error(`Error saat mentransfer kepemilikan TempVC ${channel.id}:`, error);
  }
}

module.exports = { transferOwnership };
