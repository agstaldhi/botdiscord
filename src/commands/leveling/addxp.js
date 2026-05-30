const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const UserXP = require('../../models/UserXP');
const LevelingConfig = require('../../models/LevelingConfig');
const { handleLevelUp } = require('../../modules/leveling/levelUpHandler');
const permissions = require('../../utils/permissions');
const logger = require('../../utils/logger');

module.exports = {
  name: 'addxp',
  description: 'Menambahkan XP ke member (Staff only).',
  cooldown: 3,
  category: 'leveling',
  slashData: new SlashCommandBuilder()
    .setName('addxp')
    .setDescription('Menambahkan XP ke member (Staff only).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt => opt.setName('user').setDescription('User yang ingin ditambahkan XP-nya.').setRequired(true))
    .addIntegerOption(opt => opt.setName('jumlah').setDescription('Jumlah XP yang ingin ditambahkan.').setRequired(true).setMinValue(1)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const settings = await ctx.client.helpers.getSettings(ctx.guild.id);
    if (!permissions.isBotManager(ctx.member, settings)) {
      return ctx.reply('❌ Anda tidak memiliki izin sebagai **Bot Manager** atau **Administrator** untuk menjalankan perintah ini!');
    }

    let targetUser, amount;

    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('user');
      amount = ctx.interaction.options.getInteger('jumlah');
    } else {
      targetUser = ctx.message.mentions.users.first();
      amount = parseInt(ctx.args[1]);

      if (!targetUser || isNaN(amount) || amount <= 0) {
        return ctx.reply('❌ Format salah! Gunakan: `!addxp <@user> <jumlah>`');
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

      userXP.xp += amount;

      // Hitung apakah ada level up
      let currentLevel = userXP.level;
      let leveledUp = false;

      while (userXP.xp >= (currentLevel + 1) * 100) {
        userXP.xp -= (currentLevel + 1) * 100;
        currentLevel += 1;
        leveledUp = true;
      }

      userXP.level = currentLevel;

      // Update DB
      await UserXP.update({
        xp: userXP.xp,
        level: userXP.level
      }, {
        where: { id: userXP.id }
      });

      await ctx.sendSuccess(`Berhasil menambahkan **${amount} XP** untuk ${targetUser}!\n• Level Sekarang: **${userXP.level}**\n• XP Sekarang: **${userXP.xp}/${(userXP.level + 1) * 100}**`);

      if (leveledUp) {
        let levelingConfig = await LevelingConfig.findOne({ where: { guildId: ctx.guild.id } });
        if (!levelingConfig) {
          levelingConfig = await LevelingConfig.create({ guildId: ctx.guild.id });
        }
        
        // Buat mock message untuk level up handler
        const targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
        if (targetMember) {
          const mockMsg = {
            guild: ctx.guild,
            channel: ctx.channel,
            author: targetUser,
            member: targetMember
          };
          await handleLevelUp(ctx.client, mockMsg, userXP, levelingConfig);
        }
      }

    } catch (error) {
      logger.error('Error saat menambah XP user:', error);
      await ctx.sendError('Gagal menambahkan XP ke user.');
    }
  }
};
