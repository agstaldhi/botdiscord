const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'slowmode',
  description: 'Mengatur waktu cooldown lambat (slowmode) pada channel.',
  aliases: ['slow', 'cooldownchannel'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Mengatur waktu cooldown lambat (slowmode) pada channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(opt => 
      opt.setName('seconds')
        .setDescription('Durasi slowmode dalam detik (0 untuk menonaktifkan).')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600) // 6 jam maksimal dari Discord
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let seconds;

    if (ctx.isSlash) {
      seconds = ctx.interaction.options.getInteger('seconds');
    } else {
      seconds = parseInt(ctx.args[0]);
      if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
        return ctx.sendError('Gunakan format: `!slowmode <detik (0 - 21600)>`');
      }
    }

    await ctx.deferReply();

    try {
      await ctx.channel.setRateLimitPerUser(seconds, `Diubah oleh ${ctx.user.tag}`);
      
      if (seconds === 0) {
        await ctx.sendSuccess('Slowmode berhasil dinonaktifkan untuk channel ini!');
      } else {
        await ctx.sendSuccess(`Slowmode untuk channel ini berhasil diatur ke **${seconds} detik**.`);
      }
    } catch (error) {
      ctx.client.logger.error('Error saat mengatur slowmode:', error);
      await ctx.sendError('Gagal memperbarui pengaturan slowmode pada channel ini.');
    }
  }
};
