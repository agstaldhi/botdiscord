const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'move',
  description: 'Memindahkan posisi lagu di dalam antrean (queue).',
  aliases: ['pindahlagu', 'mv'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Memindahkan posisi lagu di dalam antrean (queue).')
    .addIntegerOption(opt => 
      opt.setName('from')
        .setDescription('Posisi lagu saat ini yang ingin dipindahkan.')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption(opt => 
      opt.setName('to')
        .setDescription('Posisi tujuan baru untuk lagu tersebut.')
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
    if (!queue || queue.tracks.size < 2) {
      return ctx.sendError('Minimal harus ada 2 lagu di dalam antrean untuk dapat memindahkan posisi!');
    }

    let from;
    let to;
    if (ctx.isSlash) {
      from = ctx.interaction.options.getInteger('from');
      to = ctx.interaction.options.getInteger('to');
    } else {
      from = parseInt(ctx.args[0]);
      to = parseInt(ctx.args[1]);
      if (isNaN(from) || isNaN(to) || from < 1 || to < 1) {
        return ctx.sendError('Gunakan format: `!move <posisi_awal> <posisi_tujuan>`');
      }
    }

    const totalTracks = queue.tracks.size;
    if (from > totalTracks || to > totalTracks) {
      return ctx.sendError(`Posisi tidak valid! Jumlah lagu di antrean saat ini adalah **${totalTracks}**.`);
    }

    if (from === to) {
      return ctx.sendError('Lagu sudah berada di posisi tersebut!');
    }

    await ctx.deferReply();

    try {
      const track = queue.tracks.data[from - 1];
      if (!track) {
        return ctx.sendError('Lagu tidak ditemukan pada posisi asal!');
      }

      // Pindahkan posisi lagu
      queue.moveTrack(track, to - 1);
      await ctx.sendSuccess(`Berhasil memindahkan **[${track.title}](${track.url})** dari posisi **#${from}** ke **#${to}**.`);
    } catch (error) {
      ctx.client.logger.error('Error saat memindahkan lagu di queue:', error);
      await ctx.sendError('Terjadi kesalahan saat memindahkan lagu.');
    }
  }
};
