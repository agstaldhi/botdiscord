const { EmbedBuilder } = require('discord.js');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'messageUpdate',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').Message} oldMessage 
   * @param {import('discord.js').Message} newMessage 
   */
  async execute(client, oldMessage, newMessage) {
    // Abaikan jika bukan di server, pesan bot, atau konten tidak berubah (misal hanya embed load)
    if (!oldMessage.guild || (oldMessage.author && oldMessage.author.bot)) return;
    if (oldMessage.content === newMessage.content) return;

    try {
      const settings = await helpers.getSettings(oldMessage.guild.id);
      if (!settings || !settings.serverLogChannelId) return;

      const logChannel = oldMessage.guild.channels.cache.get(settings.serverLogChannelId);
      if (!logChannel) return;

      // Jika pesan tidak ter-cache oleh discord.js (partial), abaikan
      if (oldMessage.partial) return;

      const embed = new EmbedBuilder()
        .setColor('#f1c40f') // Kuning untuk update/edit
        .setAuthor({
          name: oldMessage.author.tag,
          iconURL: oldMessage.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`✏️ **Pesan diedit oleh** ${oldMessage.author} **di channel** <#${oldMessage.channelId}> [Lompat ke Pesan](${newMessage.url})`)
        .addFields(
          { 
            name: 'Sebelum:', 
            value: oldMessage.content ? (oldMessage.content.length > 1024 ? oldMessage.content.substring(0, 1018) + '...' : oldMessage.content) : '*Tidak ada teks*' 
          },
          { 
            name: 'Sesudah:', 
            value: newMessage.content ? (newMessage.content.length > 1024 ? newMessage.content.substring(0, 1018) + '...' : newMessage.content) : '*Tidak ada teks*' 
          }
        )
        .setFooter({ text: `User ID: ${oldMessage.author.id} | Message ID: ${oldMessage.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (error) {
      client.logger.error('Error di event messageUpdate:', error);
    }
  }
};
