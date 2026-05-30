const { SlashCommandBuilder } = require('discord.js');
const UserXP = require('../../models/UserXP');
const { generateRankCard } = require('../../modules/leveling/rankCard');
const logger = require('../../utils/logger');

module.exports = {
  name: 'rank',
  description: 'Melihat kartu peringkat (rank card) Anda atau member lain.',
  aliases: ['level', 'xp'],
  cooldown: 5,
  category: 'leveling',
  slashData: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Melihat kartu peringkat (rank card) Anda atau member lain.')
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('User yang ingin dilihat kartu peringkatnya.')
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

    if (targetUser.bot) {
      return ctx.reply('❌ Bot tidak berpartisipasi dalam sistem leveling!');
    }

    await ctx.deferReply();

    try {
      // Ambil data XP user
      let userXP = await UserXP.findOne({
        where: {
          guildId: ctx.guild.id,
          userId: targetUser.id
        }
      });

      if (!userXP) {
        // Buat data default sementara jika belum ada di database
        userXP = {
          userId: targetUser.id,
          guildId: ctx.guild.id,
          xp: 0,
          level: 0,
          totalMessages: 0,
          lastXpGain: new Date()
        };
      }

      const rankCardAttachment = await generateRankCard(targetUser, userXP, ctx.guild.id);
      await ctx.reply({ files: [rankCardAttachment] });

    } catch (error) {
      logger.error('Error saat mengeksekusi command rank:', error);
      await ctx.sendError('Gagal membuat kartu peringkat.');
    }
  }
};
