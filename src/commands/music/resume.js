const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'resume',
  description: 'Melanjutkan (resume) pemutaran musik yang sedang dijeda.',
  aliases: ['lanjut', 'lanjutkan'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Melanjutkan (resume) pemutaran musik yang sedang dijeda.'),

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
      return ctx.sendError('Tidak ada musik yang sedang diputar di server ini!');
    }

    if (!queue.node.isPaused()) {
      return ctx.sendError('Pemutaran musik tidak sedang dalam kondisi dijeda!');
    }

    await ctx.deferReply();

    try {
      queue.node.setPaused(false);
      await ctx.sendSuccess('Pemutaran musik berhasil dilanjutkan (resumed).');
    } catch (error) {
      ctx.client.logger.error('Error saat resume musik:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba melanjutkan musik.');
    }
  }
};
