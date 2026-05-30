const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'shuffle',
  description: 'Mengacak urutan lagu di antrean (queue).',
  aliases: ['acak'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mengacak urutan lagu di antrean (queue).'),

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
      return ctx.sendError('Minimal harus ada 2 lagu di dalam antrean untuk dapat diacak!');
    }

    await ctx.deferReply();

    try {
      queue.tracks.shuffle();
      await ctx.sendSuccess(`Berhasil mengacak **${queue.tracks.size}** lagu di dalam antrean.`);
    } catch (error) {
      ctx.client.logger.error('Error saat acak antrean:', error);
      await ctx.sendError('Terjadi kesalahan saat mengacak antrean.');
    }
  }
};
