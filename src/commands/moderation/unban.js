const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const modLogger = require('../../utils/modLogger');

module.exports = {
  name: 'unban',
  description: 'Mencabut blokir (unban) user dari server berdasarkan ID.',
  aliases: ['buka-blokir'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Mencabut blokir (unban) user dari server berdasarkan ID.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt => opt.setName('user_id').setDescription('ID User yang ingin dicabut blokirnya.').setRequired(true))
    .addStringOption(opt => opt.setName('alasan').setDescription('Alasan mencabut blokir.').setRequired(false)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let userId;
    let reason;

    if (ctx.isSlash) {
      userId = ctx.interaction.options.getString('user_id');
      reason = ctx.interaction.options.getString('alasan') || 'Tidak ada alasan.';
    } else {
      userId = ctx.args[0];
      reason = ctx.args.slice(1).join(' ') || 'Tidak ada alasan.';
      
      if (!userId) {
        return ctx.sendError('Masukkan ID User yang ingin dicabut blokirnya! (Contoh: `!unban 123456789012345678 Alasan`)');
      }
    }

    await ctx.deferReply();

    try {
      // Ambil daftar ban dari server
      const bans = await ctx.guild.bans.fetch().catch(() => null);
      if (!bans) {
        return ctx.sendError('Gagal memproses daftar blokir server. Pastikan bot memiliki izin Manage Server / Ban Members.');
      }

      const bannedUser = bans.get(userId);
      if (!bannedUser) {
        return ctx.sendError('User dengan ID tersebut tidak ditemukan di daftar blokir server ini.');
      }

      // Lakukan unban
      await ctx.guild.members.unban(userId, `Unban oleh ${ctx.user.tag}: ${reason}`);

      // Kirim mod log
      await modLogger(ctx.client, ctx.guild, 'UNBAN', bannedUser.user, ctx.user, reason);

      await ctx.sendSuccess(`Blokir untuk ${bannedUser.user.tag} (${userId}) berhasil dicabut!`);
    } catch (error) {
      ctx.client.logger.error('Error saat melakukan unban:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba mencabut blokir member. Periksa kembali ID User.');
    }
  }
};
