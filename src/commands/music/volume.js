const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'volume',
  description: 'Mengatur volume pemutaran musik.',
  aliases: ['vol'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Mengatur volume pemutaran musik.')
    .addIntegerOption(opt => 
      opt.setName('level')
        .setDescription('Level volume (1-100).')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
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

    let level;
    if (ctx.isSlash) {
      level = ctx.interaction.options.getInteger('level');
    } else {
      level = parseInt(ctx.args[0]);
      if (isNaN(level) || level < 1 || level > 100) {
        return ctx.sendError('Gunakan format: `!volume <level 1-100>`');
      }
    }

    await ctx.deferReply();

    try {
      queue.node.setVolume(level);
      await ctx.sendSuccess(`Volume berhasil diatur ke **${level}%**.`);
    } catch (error) {
      ctx.client.logger.error('Error saat mengatur volume:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba mengubah volume.');
    }
  }
};
