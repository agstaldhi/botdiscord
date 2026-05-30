const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'stop',
  description: 'Menghentikan pemutaran musik, mengosongkan antrean, dan keluar VC.',
  aliases: ['matikan', 'leave', 'dc', 'disconnect'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Menghentikan pemutaran musik, mengosongkan antrean, dan keluar VC.'),

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
    if (!queue) {
      return ctx.sendError('Tidak ada musik yang sedang aktif di server ini!');
    }

    await ctx.deferReply();

    try {
      // Hapus antrean dan putuskan koneksi voice channel
      queue.delete();
      await ctx.sendSuccess('Pemutaran musik dihentikan, antrean dikosongkan, dan bot keluar dari Voice Channel.');
    } catch (error) {
      ctx.client.logger.error('Error saat stop musik:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba menghentikan musik.');
    }
  }
};
