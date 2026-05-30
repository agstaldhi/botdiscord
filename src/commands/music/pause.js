const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'pause',
  description: 'Jeda (pause) pemutaran musik saat ini.',
  aliases: ['jeda'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Jeda (pause) pemutaran musik saat ini.'),

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
      return ctx.sendError('Tidak ada musik yang sedang diputar di server ini!');
    }

    // Pengecekan DJ Role
    const MusicConfig = require('../../models/MusicConfig');
    const permissions = require('../../utils/permissions');
    const musicConfig = await MusicConfig.findOne({ where: { guildId: ctx.guild.id } }).catch(() => null);
    if (!permissions.isDJ(ctx.member, musicConfig)) {
      return ctx.sendError('Anda memerlukan role DJ untuk mengontrol pemutaran musik!');
    }

    if (queue.node.isPaused()) {
      return ctx.sendError('Pemutaran musik sudah dalam kondisi dijeda!');
    }

    await ctx.deferReply();

    try {
      queue.node.setPaused(true);
      await ctx.sendSuccess('Pemutaran musik berhasil dijeda (paused).');
    } catch (error) {
      ctx.client.logger.error('Error saat jeda musik:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba menjeda musik.');
    }
  }
};
