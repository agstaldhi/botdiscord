const { SlashCommandBuilder } = require('discord.js');
const formatTime = require('../../utils/formatTime');

module.exports = {
  name: 'queue',
  description: 'Melihat daftar antrean (queue) lagu saat ini.',
  aliases: ['q', 'antrean', 'playlist'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Melihat daftar antrean (queue) lagu saat ini.')
    .addIntegerOption(opt => 
      opt.setName('page')
        .setDescription('Halaman antrean (1 halaman berisi 10 lagu).')
        .setRequired(false)
        .setMinValue(1)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const queue = ctx.client.player.nodes.get(ctx.guild.id);
    if (!queue || (!queue.currentTrack && queue.tracks.size === 0)) {
      return ctx.sendError('Antrean musik saat ini kosong!');
    }

    let page;
    if (ctx.isSlash) {
      page = ctx.interaction.options.getInteger('page') || 1;
    } else {
      page = parseInt(ctx.args[0]) || 1;
    }

    await ctx.deferReply();

    try {
      const tracks = queue.tracks.data;
      const totalPages = Math.max(1, Math.ceil(tracks.length / 10));

      if (page > totalPages) {
        return ctx.sendError(`Halaman tidak valid! Hanya ada **${totalPages}** halaman antrean.`);
      }

      const start = (page - 1) * 10;
      const end = start + 10;
      const paginatedTracks = tracks.slice(start, end);

      // Hitung total durasi antrean
      const totalDurationMs = tracks.reduce((sum, tr) => sum + tr.durationMS, 0) + (queue.currentTrack ? queue.currentTrack.durationMS : 0);
      const queueDurationStr = formatTime(totalDurationMs);

      // Current track info
      const currentTrack = queue.currentTrack;
      const nowPlayingStr = currentTrack 
        ? `▶️ **Sedang Diputar:** [${currentTrack.title}](${currentTrack.url}) (\`${currentTrack.duration}\`) - oleh ${currentTrack.requestedBy || '*System*'}`
        : '🔇 *Tidak ada lagu yang sedang diputar*';

      // Antrean tracks info
      let queueList = '';
      if (paginatedTracks.length === 0) {
        queueList = '*Tidak ada lagu selanjutnya di antrean.*';
      } else {
        queueList = paginatedTracks.map((track, i) => {
          const index = start + i + 1;
          return `**${index}.** [${track.title}](${track.url}) (\`${track.duration}\`) - oleh ${track.requestedBy || '*System*'}`;
        }).join('\n');
      }

      const embed = ctx.client.embeds.create({
        title: `🎵 Antrean Musik — ${ctx.guild.name}`,
        description: `${nowPlayingStr}\n\n**Selanjutnya di Antrean:**\n${queueList}`,
        fields: [
          { name: 'Total Lagu:', value: `\`${tracks.length + (currentTrack ? 1 : 0)} lagu\``, inline: true },
          { name: 'Total Durasi:', value: `\`${queueDurationStr}\``, inline: true }
        ],
        footer: { text: `Halaman ${page} dari ${totalPages}` }
      });

      await ctx.reply({ embeds: [embed] });
    } catch (error) {
      ctx.client.logger.error('Error saat melihat queue:', error);
      await ctx.sendError('Terjadi kesalahan saat mengambil antrean lagu.');
    }
  }
};
