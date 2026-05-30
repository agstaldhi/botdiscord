const { EmbedBuilder } = require('discord.js');
const helpers = require('./helpers');

/**
 * Mengirim log aksi moderasi ke channel mod-log terdaftar
 * @param {import('../client')} client 
 * @param {import('discord.js').Guild} guild 
 * @param {string} action Aksi moderasi (misal: WARN, BAN, TIMEOUT, KICK)
 * @param {import('discord.js').User} targetUser User target moderasi
 * @param {import('discord.js').User} moderator User pengeksekusi
 * @param {string} reason Alasan tindakan
 * @param {string} [duration] Durasi (opsional, untuk mute/timeout)
 */
module.exports = async (client, guild, action, targetUser, moderator, reason, duration = null) => {
  try {
    const settings = await helpers.getSettings(guild.id);
    if (!settings || !settings.modLogChannelId) return;

    const logChannel = guild.channels.cache.get(settings.modLogChannelId);
    if (!logChannel) return;

    const colors = {
      'BAN': '#e74c3c',
      'SOFTBAN': '#e67e22',
      'UNBAN': '#2ecc71',
      'KICK': '#e67e22',
      'WARN': '#f1c40f',
      'UNWARN': '#2ecc71',
      'TIMEOUT': '#e67e22',
      'UNMUTE': '#2ecc71'
    };

    const embed = new EmbedBuilder()
      .setColor(colors[action] || '#5865F2')
      .setTitle(`🔨 Moderation Case — ${action}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }) || targetUser.defaultAvatarURL)
      .addFields(
        { name: 'Target Member:', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
        { name: 'Moderator:', value: `${moderator.tag} (<@${moderator.id}>)`, inline: true }
      );

    if (duration) {
      embed.addFields({ name: 'Durasi:', value: duration, inline: true });
    }

    embed.addFields({ name: 'Alasan:', value: reason || 'Tidak ada alasan yang dispesifikasikan.' })
      .setFooter({ text: `Target ID: ${targetUser.id}` })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  } catch (error) {
    client.logger.error('Error saat mengirim mod log:', error);
  }
};
