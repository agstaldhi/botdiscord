const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const modLogger = require('../../utils/modLogger');

module.exports = {
  name: 'ban',
  description: 'Memblokir (ban) member dari server.',
  aliases: ['blokir'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Memblokir (ban) member dari server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('member').setDescription('Member yang ingin diblokir.').setRequired(true))
    .addStringOption(opt => opt.setName('alasan').setDescription('Alasan pemblokiran.').setRequired(false))
    .addIntegerOption(opt => 
      opt.setName('delete_messages')
        .setDescription('Hapus pesan terakhir dari user (dalam hari).')
        .setRequired(false)
        .addChoices(
          { name: 'Jangan Hapus', value: 0 },
          { name: '1 Hari', value: 1 },
          { name: '7 Hari', value: 7 }
        )
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let targetUser;
    let reason;
    let deleteDays = 0;

    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('member');
      reason = ctx.interaction.options.getString('alasan') || 'Tidak ada alasan.';
      deleteDays = ctx.interaction.options.getInteger('delete_messages') || 0;
    } else {
      targetUser = ctx.message.mentions.users.first();
      reason = ctx.args.slice(1).join(' ') || 'Tidak ada alasan.';
      
      if (!targetUser) {
        return ctx.sendError('Mention member yang ingin diblokir! (Contoh: `!ban @User Melanggar aturan`)');
      }
    }

    if (targetUser.id === ctx.user.id) {
      return ctx.sendError('Anda tidak bisa memblokir diri sendiri!');
    }

    if (targetUser.id === ctx.client.user.id) {
      return ctx.sendError('Saya tidak bisa memblokir diri saya sendiri!');
    }

    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    if (member) {
      if (!member.bannable) {
        return ctx.sendError('Saya tidak memiliki izin yang cukup untuk memblokir member ini! (Pastikan posisi role bot lebih tinggi).');
      }

      // Pengecekan hierarki role moderator
      const isOwner = ctx.guild.ownerId === ctx.user.id;
      if (!isOwner && member.roles.highest.position >= ctx.member.roles.highest.position) {
        return ctx.sendError('Anda tidak bisa memblokir member dengan role setara atau lebih tinggi!');
      }
    }

    await ctx.deferReply();

    try {
      // Kirim DM peringatan terlebih dahulu
      await targetUser.send({
        content: `🔨 Anda telah **diblokir (ban)** dari server **${ctx.guild.name}**\n• Alasan: \`${reason}\``
      }).catch(() => {});

      // Lakukan ban
      // Di discord.js v14, opsi ban ditulis: guild.members.ban(userId, { reason, deleteMessageSeconds })
      // deleteMessageSeconds adalah opsi detiknya. 1 hari = 86400 detik.
      const secondsToDelete = deleteDays * 86400;
      await ctx.guild.members.ban(targetUser.id, {
        reason: `Ban oleh ${ctx.user.tag}: ${reason}`,
        deleteMessageSeconds: secondsToDelete
      });

      // Kirim mod log
      await modLogger(ctx.client, ctx.guild, 'BAN', targetUser, ctx.user, reason);

      await ctx.sendSuccess(`Member ${targetUser.tag} berhasil diblokir permanent!`);
    } catch (error) {
      ctx.client.logger.error('Error saat mem-ban member:', error);
      await ctx.sendError('Terjadi kesalahan internal saat mencoba memblokir member.');
    }
  }
};
