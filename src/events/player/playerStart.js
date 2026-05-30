const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'playerStart',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord-player').GuildQueue} queue 
   * @param {import('discord-player').Track} track 
   */
  async execute(client, queue, track) {
    try {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎵 Sedang Memutar Lagu')
        .setThumbnail(track.thumbnail)
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields(
          { name: 'Durasi:', value: `\`${track.duration}\``, inline: true },
          { name: 'Diminta oleh:', value: track.requestedBy ? `${track.requestedBy}` : '*Tidak diketahui*', inline: true }
        )
        .setFooter({ text: `MonoHex Player | Sumber: ${track.raw.source || 'YouTube'}` })
        .setTimestamp();

      if (queue.metadata && queue.metadata.channel) {
        await queue.metadata.channel.send({ embeds: [embed] }).catch(() => {});
      }
    } catch (error) {
      client.logger.error('Error di event playerStart:', error);
    }
  }
};
