const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'skip',
  description: 'Melewati (skip) lagu saat ini atau lompat ke lagu ke-N.',
  aliases: ['s', 'lewat', 'next'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Melewati (skip) lagu saat ini atau lompat ke lagu ke-N.')
    .addIntegerOption(opt => 
      opt.setName('position')
        .setDescription('Posisi nomor lagu di antrean yang ingin dituju.')
        .setRequired(false)
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
    if (!queue || !queue.isPlaying()) {
      return ctx.sendError('Tidak ada musik yang sedang diputar!');
    }

    let position;
    if (ctx.isSlash) {
      position = ctx.interaction.options.getInteger('position');
    } else {
      position = parseInt(ctx.args[0]);
    }

    await ctx.deferReply();

    try {
      const currentTrack = queue.currentTrack;

      if (position) {
        // Skip ke lagu tertentu
        if (position > queue.tracks.size) {
          return ctx.sendError(`Posisi tidak valid! Total lagu di antrean saat ini adalah **${queue.tracks.size}**.`);
        }

        const targetTrack = queue.tracks.data[position - 1];
        if (!targetTrack) {
          return ctx.sendError('Lagu di posisi tersebut tidak ditemukan!');
        }

        queue.node.skipTo(targetTrack);
        await ctx.sendSuccess(`Berhasil melompati beberapa lagu menuju ke: **[${targetTrack.title}](${targetTrack.url})**`);
      } else {
        // Skip lagu saat ini
        queue.node.skip();
        await ctx.sendSuccess(`Lagu **[${currentTrack.title}](${currentTrack.url})** berhasil di-skip.`);
      }
    } catch (error) {
      ctx.client.logger.error('Error saat skip musik:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba me-skip musik.');
    }
  }
};
