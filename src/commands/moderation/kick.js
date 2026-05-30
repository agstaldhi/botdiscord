const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const modLogger = require('../../utils/modLogger');

module.exports = {
  name: 'kick',
  description: 'Mengeluarkan (kick) member dari server.',
  aliases: ['depak'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Mengeluarkan (kick) member dari server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt => opt.setName('member').setDescription('Member yang ingin dikeluarkan.').setRequired(true))
    .addStringOption(opt => opt.setName('alasan').setDescription('Alasan mengeluarkan member.').setRequired(false)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let targetUser;
    let reason;

    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('member');
      reason = ctx.interaction.options.getString('alasan') || 'Tidak ada alasan.';
    } else {
      targetUser = ctx.message.mentions.users.first();
      reason = ctx.args.slice(1).join(' ') || 'Tidak ada alasan.';
      
      if (!targetUser) {
        return ctx.sendError('Mention member yang ingin dikeluarkan! (Contoh: `!kick @User Melanggar aturan`)');
      }
    }

    if (targetUser.id === ctx.user.id) {
      return ctx.sendError('Anda tidak bisa mengeluarkan diri sendiri!');
    }

    if (targetUser.id === ctx.client.user.id) {
      return ctx.sendError('Saya tidak bisa mengeluarkan diri saya sendiri!');
    }

    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return ctx.sendError('Member tersebut tidak ditemukan di server ini.');
    }

    if (!member.kickable) {
      return ctx.sendError('Saya tidak memiliki izin yang cukup untuk mengeluarkan member ini! (Pastikan posisi role bot lebih tinggi).');
    }

    // Pengecekan hierarki role moderator
    const isOwner = ctx.guild.ownerId === ctx.user.id;
    if (!isOwner && member.roles.highest.position >= ctx.member.roles.highest.position) {
      return ctx.sendError('Anda tidak bisa mengeluarkan member dengan role setara atau lebih tinggi!');
    }

    await ctx.deferReply();

    try {
      // Kirim DM peringatan terlebih dahulu sebelum di-kick
      await targetUser.send({
        content: `🚪 Anda telah dikeluarkan dari server **${ctx.guild.name}**\n• Alasan: \`${reason}\``
      }).catch(() => {});

      // Lakukan kick
      await member.kick(`Kick oleh ${ctx.user.tag}: ${reason}`);

      // Kirim mod log
      await modLogger(ctx.client, ctx.guild, 'KICK', targetUser, ctx.user, reason);

      await ctx.sendSuccess(`Member ${targetUser.tag} berhasil dikeluarkan dari server!`);
    } catch (error) {
      ctx.client.logger.error('Error saat me-kick member:', error);
      await ctx.sendError('Terjadi kesalahan internal saat mencoba mengeluarkan member.');
    }
  }
};
