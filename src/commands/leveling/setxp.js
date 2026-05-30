const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const UserXP = require('../../models/UserXP');
const permissions = require('../../utils/permissions');
const logger = require('../../utils/logger');

module.exports = {
  name: 'setxp',
  description: 'Mengatur tingkat XP dan Level member (Staff only).',
  aliases: ['setlevel'],
  cooldown: 3,
  category: 'leveling',
  slashData: new SlashCommandBuilder()
    .setName('setxp')
    .setDescription('Mengatur tingkat XP dan Level member (Staff only).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt => opt.setName('user').setDescription('User yang ingin diatur XP-nya.').setRequired(true))
    .addIntegerOption(opt => opt.setName('xp').setDescription('Jumlah XP baru.').setRequired(true).setMinValue(0))
    .addIntegerOption(opt => opt.setName('level').setDescription('Level baru.').setRequired(true).setMinValue(0)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const settings = await ctx.client.helpers.getSettings(ctx.guild.id);
    if (!permissions.isBotManager(ctx.member, settings)) {
      return ctx.reply('❌ Anda tidak memiliki izin sebagai **Bot Manager** atau **Administrator** untuk menjalankan perintah ini!');
    }

    let targetUser, newXp, newLevel;

    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('user');
      newXp = ctx.interaction.options.getInteger('xp');
      newLevel = ctx.interaction.options.getInteger('level');
    } else {
      targetUser = ctx.message.mentions.users.first();
      newXp = parseInt(ctx.args[1]);
      newLevel = parseInt(ctx.args[2]);

      if (!targetUser || isNaN(newXp) || isNaN(newLevel)) {
        return ctx.reply('❌ Format salah! Gunakan: `!setxp <@user> <xp> <level>`');
      }
    }

    if (targetUser.bot) {
      return ctx.reply('❌ Bot tidak memiliki sistem XP.');
    }

    await ctx.deferReply();

    try {
      // Dapatkan atau buat record XP user
      const [userXP, created] = await UserXP.findOrCreate({
        where: { guildId: ctx.guild.id, userId: targetUser.id }
      });

      // Update XP dan Level
      await UserXP.update({
        xp: newXp,
        level: newLevel
      }, {
        where: { id: userXP.id }
      });

      await ctx.sendSuccess(`Berhasil mengatur data leveling untuk ${targetUser}:\n• Level: **${newLevel}**\n• XP: **${newXp}**`);

    } catch (error) {
      logger.error('Error saat set XP user:', error);
      await ctx.sendError('Gagal mengubah data leveling user.');
    }
  }
};
