const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'banner',
  description: 'Menampilkan banner profil seorang member.',
  aliases: ['ubanner'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Menampilkan banner profil seorang member.')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User yang ingin dilihat banner-nya.')
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
      // Wajib fetch secara paksa agar data banner ter-load
      const user = await ctx.client.users.fetch(targetUser.id, { force: true });
      const bannerUrl = user.bannerURL({ size: 1024, dynamic: true });

      if (!bannerUrl) {
        return await ctx.reply(`❌ User **${user.tag}** tidak memiliki banner profil!`);
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(`🖼️ Banner — ${user.tag}`)
        .setDescription(`[Unduh Banner](${bannerUrl})`)
        .setImage(bannerUrl)
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error di command banner:', error);
      await ctx.sendError('Gagal memuat banner.');
    }
  }
};
