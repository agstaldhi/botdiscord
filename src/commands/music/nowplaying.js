const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'nowplaying',
  description: 'Melihat rincian lagu yang sedang diputar saat ini.',
  aliases: ['np', 'lagusekarang'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Melihat rincian lagu yang sedang diputar saat ini.'),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const queue = ctx.client.player.nodes.get(ctx.guild.id);
    if (!queue || !queue.currentTrack) {
      return ctx.sendError('Tidak ada musik yang sedang diputar di server ini!');
    }

    await ctx.deferReply();

    try {
      const track = queue.currentTrack;
      
      // Buat progress bar bawaan discord-player v6
      const progress = queue.node.createProgressBar({
        queue: false,
        length: 15
      }) || '';

      const embed = ctx.client.embeds.create({
        title: '🎶 Sedang Memutar Musik',
        description: `**[${track.title}](${track.url})**\n*Diminta oleh: ${track.requestedBy || '*System*'}*`,
        fields: [
          { name: 'Progress Bar:', value: `\`${progress}\``, inline: false },
          { name: 'Sumber Audio:', value: `\`${track.raw.source || 'YouTube'}\``, inline: true }
        ],
        thumbnail: track.thumbnail
      });

      await ctx.reply({ embeds: [embed] });
    } catch (error) {
      ctx.client.logger.error('Error saat melihat nowplaying:', error);
      await ctx.sendError('Terjadi kesalahan saat mengambil informasi lagu saat ini.');
    }
  }
};
