const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const modLogger = require('../../utils/modLogger');

module.exports = {
  name: 'softban',
  description: 'Mengeluarkan member dan menghapus seluruh pesannya (ban + instant unban).',
  aliases: ['kickclean'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Mengeluarkan member dan menghapus seluruh pesannya (ban + instant unban).')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('member').setDescription('Member yang ingin di-softban.').setRequired(true))
    .addStringOption(opt => opt.setName('alasan').setDescription('Alasan softban.').setRequired(false)),

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
        return ctx.sendError('Mention member yang ingin di-softban! (Contoh: `!softban @User Melanggar aturan`)');
      }
    }

    if (targetUser.id === ctx.user.id) {
      return ctx.sendError('Anda tidak bisa melakukan softban kepada diri sendiri!');
    }

    if (targetUser.id === ctx.client.user.id) {
      return ctx.sendError('Saya tidak bisa di-softban!');
    }

    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    if (member) {
      if (!member.bannable) {
        return ctx.sendError('Saya tidak memiliki izin yang cukup untuk me-ban member ini! (Pastikan posisi role bot lebih tinggi).');
      }

      // Pengecekan hierarki role moderator
      const isOwner = ctx.guild.ownerId === ctx.user.id;
      if (!isOwner && member.roles.highest.position >= ctx.member.roles.highest.position) {
        return ctx.sendError('Anda tidak bisa melakukan softban kepada member dengan role setara atau lebih tinggi!');
      }
    }

    await ctx.deferReply();

    try {
      // Kirim DM peringatan terlebih dahulu
      await targetUser.send({
        content: `🚪 Anda telah terkena **softban** dari server **${ctx.guild.name}**\n• Alasan: \`${reason}\` (Anda tetap bisa bergabung kembali ke server).`
      }).catch(() => {});

      // Lakukan Ban (menghapus pesan 7 hari terakhir)
      await ctx.guild.members.ban(targetUser.id, {
        reason: `Softban oleh ${ctx.user.tag}: ${reason}`,
        deleteMessageSeconds: 7 * 86400
      });

      // Lakukan Unban Instan
      await ctx.guild.members.unban(targetUser.id, 'Softban: Instant unban.');

      // Kirim mod log
      await modLogger(ctx.client, ctx.guild, 'SOFTBAN', targetUser, ctx.user, reason);

      await ctx.sendSuccess(`Member ${targetUser.tag} berhasil di-softban (Kicked + pesan 7 hari terakhir dibersihkan)!`);
    } catch (error) {
      ctx.client.logger.error('Error saat melakukan softban:', error);
      await ctx.sendError('Terjadi kesalahan internal saat mencoba memproses softban.');
    }
  }
};
