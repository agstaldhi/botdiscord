const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'avatar',
  description: 'Menampilkan avatar seorang member dengan resolusi tinggi.',
  aliases: ['av', 'pfp'],
  cooldown: 3,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Menampilkan avatar seorang member dengan resolusi tinggi.')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User yang ingin dilihat avatarnya.')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let targetUser;
    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('user') || ctx.user;
    } else {
      targetUser = ctx.message.mentions.users.first() || ctx.user;
    }

    await ctx.deferReply();

    try {
      const avatarUrl = targetUser.displayAvatarURL({ size: 2048, dynamic: true });

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(`🖼️ Avatar — ${targetUser.tag}`)
        .setDescription(`[Unduh Avatar](${avatarUrl})`)
        .setImage(avatarUrl)
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error di command avatar:', error);
      await ctx.sendError('Gagal memuat avatar.');
    }
  }
};
