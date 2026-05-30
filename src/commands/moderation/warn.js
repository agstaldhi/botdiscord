const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Warning = require('../../models/Warning');
const modLogger = require('../../utils/modLogger');
const permissions = require('../../utils/permissions');

module.exports = {
  name: 'warn',
  description: 'Memberikan peringatan (warning) kepada member server.',
  aliases: ['peringatan'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Memberikan peringatan (warning) kepada member server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt => opt.setName('member').setDescription('Member yang ingin diberi peringatan.').setRequired(true))
    .addStringOption(opt => opt.setName('alasan').setDescription('Alasan pemberian peringatan.').setRequired(true)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let targetUser;
    let reason;

    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('member');
      reason = ctx.interaction.options.getString('alasan');
    } else {
      targetUser = ctx.message.mentions.users.first();
      reason = ctx.args.slice(1).join(' ');
      
      if (!targetUser) {
        return ctx.sendError('Mention member yang ingin diberi peringatan! (Contoh: `!warn @User Melanggar aturan`)');
      }
      if (!reason) {
        return ctx.sendError('Alasan pemberian peringatan harus dicantumkan!');
      }
    }

    if (targetUser.id === ctx.user.id) {
      return ctx.sendError('Anda tidak bisa memberikan peringatan kepada diri sendiri!');
    }

    if (targetUser.id === ctx.client.user.id) {
      return ctx.sendError('Saya tidak bisa memberikan peringatan kepada diri saya sendiri!');
    }

    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    if (member) {
      // Pengecekan hierarki role
      const isOwner = ctx.guild.ownerId === ctx.user.id;
      if (!isOwner && member.roles.highest.position >= ctx.member.roles.highest.position) {
        return ctx.sendError('Anda tidak bisa memperingatkan member dengan role setara atau lebih tinggi!');
      }
      if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return ctx.sendError('Anda tidak bisa memperingatkan member yang memiliki hak Administrator!');
      }
    }

    await ctx.deferReply();

    try {
      // Simpan kasus ke database
      const warnCase = await Warning.create({
        guildId: ctx.guild.id,
        userId: targetUser.id,
        moderatorId: ctx.user.id,
        reason: reason
      });

      // Ambil total warnings aktif user saat ini
      const totalWarns = await Warning.count({
        where: {
          guildId: ctx.guild.id,
          userId: targetUser.id,
          active: true
        }
      });

      // Kirim mod log
      await modLogger(ctx.client, ctx.guild, 'WARN', targetUser, ctx.user, reason);

      // DM target member
      await targetUser.send({
        content: `⚠️ Anda menerima peringatan di server **${ctx.guild.name}**\n• Alasan: \`${reason}\`\n• Total Peringatan Anda saat ini: **${totalWarns}**`
      }).catch(() => {});

      await ctx.sendSuccess(`Member ${targetUser} berhasil diperingatkan! [Case ID: \`${warnCase.warnId || 'MOCK'}\`] (Peringatan ke-${totalWarns})`);
    } catch (error) {
      ctx.client.logger.error('Error saat menyimpan warning:', error);
      await ctx.sendError('Gagal menyimpan peringatan ke database.');
    }
  }
};
