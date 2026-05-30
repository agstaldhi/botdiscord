const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'remove',
  description: 'Menghapus lagu tertentu dari antrean (queue).',
  aliases: ['hapuslagu', 'rm'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Menghapus lagu tertentu dari antrean (queue).')
    .addIntegerOption(opt => 
      opt.setName('position')
        .setDescription('Posisi nomor lagu di antrean yang ingin dihapus.')
        .setRequired(true)
        .setMinValue(1)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const memberVoiceChannel = ctx.member.voice.channel;
    if (!memberVoiceChannel) {
      return ctx.sendError('Anda harus bergabung ke voice channel terlebih dahulu!');
    }
    
    const botVoiceChannel = ctx.guild.members.me.voice.channel;
    if (botVoiceChannel && memberVoiceChannel.id !== botVoiceChannel.id) {
      return ctx.sendError('Anda harus berada di voice channel yang sama dengan bot!');
    }

    const queue = ctx.client.player.nodes.get(ctx.guild.id);
    if (!queue || queue.tracks.size === 0) {
      return ctx.sendError('Antrean musik saat ini kosong!');
    }

    let position;
    if (ctx.isSlash) {
      position = ctx.interaction.options.getInteger('position');
    } else {
      position = parseInt(ctx.args[0]);
      if (isNaN(position) || position < 1) {
        return ctx.sendError('Gunakan format: `!remove <posisi_antrean>`');
      }
    }

    if (position > queue.tracks.size) {
      return ctx.sendError(`Posisi tidak valid! Jumlah lagu di antrean saat ini adalah **${queue.tracks.size}**.`);
    }

    await ctx.deferReply();

    try {
      const track = queue.tracks.data[position - 1];
      if (!track) {
        return ctx.sendError('Lagu di posisi tersebut tidak ditemukan!');
      }

      // Hapus lagu dari antrean
      queue.removeTrack(track);
      await ctx.sendSuccess(`Berhasil menghapus **[${track.title}](${track.url})** dari antrean.`);
    } catch (error) {
      ctx.client.logger.error('Error saat menghapus lagu dari queue:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba menghapus lagu.');
    }
  }
};
