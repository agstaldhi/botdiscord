const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'guildBanAdd',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').GuildBan} ban 
   */
  async execute(client, ban) {
    try {
      const settings = await helpers.getSettings(ban.guild.id);
      if (!settings || !settings.modLogChannelId) return;

      const logChannel = ban.guild.channels.cache.get(settings.modLogChannelId);
      if (!logChannel) return;

      let moderator = 'Sistem/Tidak diketahui';
      let reason = ban.reason || 'Tidak ada alasan yang dispesifikasikan.';

      // Coba ambil pelaku aksi dari Audit Logs
      try {
        const fetchedLogs = await ban.guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.MemberBanAdd
        });
        const banLog = fetchedLogs.entries.first();
        if (banLog) {
          const { executor, target } = banLog;
          if (target && target.id === ban.user.id) {
            moderator = `${executor.tag} (${executor.id})`;
            if (banLog.reason) reason = banLog.reason;
          }
        }
      } catch (err) {
        client.logger.warn(`Gagal mengambil Audit Logs untuk Ban di guild ${ban.guild.id}: ${err.message}`);
      }

      const embed = new EmbedBuilder()
        .setColor('#e74c3c') // Merah untuk Ban
        .setTitle('🔨 Member Diblokir (Ban)')
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }) || ban.user.defaultAvatarURL)
        .addFields(
          { name: 'Target Member:', value: `${ban.user.tag} (<@${ban.user.id}>)`, inline: true },
          { name: 'Moderator:', value: moderator, inline: true },
          { name: 'Alasan:', value: reason }
        )
        .setFooter({ text: `User ID: ${ban.user.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (error) {
      client.logger.error('Error di event guildBanAdd:', error);
    }
  }
};
