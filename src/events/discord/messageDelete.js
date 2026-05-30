const { EmbedBuilder } = require('discord.js');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'messageDelete',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').Message} message 
   */
  async execute(client, message) {
    // Abaikan jika bukan di server atau pesan dari bot
    if (!message.guild || (message.author && message.author.bot)) return;

    try {
      const settings = await helpers.getSettings(message.guild.id);
      if (!settings || !settings.serverLogChannelId) return;

      const logChannel = message.guild.channels.cache.get(settings.serverLogChannelId);
      if (!logChannel) return;

      // Jika pesan tidak ter-cache oleh discord.js (partial), kita tidak bisa membaca isinya
      if (message.partial) return;

      const embed = new EmbedBuilder()
        .setColor('#e74c3c') // Merah untuk delete
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`🗑️ **Pesan dikirim oleh** ${message.author} **dihapus di channel** <#${message.channelId}>`)
        .addFields(
          { 
            name: 'Konten Pesan:', 
            value: message.content ? (message.content.length > 1024 ? message.content.substring(0, 1018) + '...' : message.content) : '*Tidak ada teks (hanya attachment/embed)*' 
          }
        )
        .setFooter({ text: `User ID: ${message.author.id} | Message ID: ${message.id}` })
        .setTimestamp();

      // Tambahkan list attachment jika ada
      if (message.attachments.size > 0) {
        const attachmentLinks = message.attachments.map(att => `[${att.name}](${att.url})`).join('\n');
        embed.addFields({ name: 'Attachments:', value: attachmentLinks });
      }

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (error) {
      client.logger.error('Error di event messageDelete:', error);
    }
  }
};
