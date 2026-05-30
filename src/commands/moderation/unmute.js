const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const modLogger = require('../../utils/modLogger');

module.exports = {
  name: 'unmute',
  description: 'Mencabut pembungkaman (unmute/untimeout) dari member.',
  aliases: ['untimeout'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Mencabut pembungkaman (unmute/untimeout) dari member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('member').setDescription('Member yang ingin dicabut pembungkamannya.').setRequired(true))
    .addStringOption(opt => opt.setName('alasan').setDescription('Alasan pencabutan pembungkaman.').setRequired(false)),

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
        return ctx.sendError('Mention member yang ingin di-unmute! (Contoh: `!unmute @User Alasan`)');
      }
    }

    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return ctx.sendError('Member tersebut tidak ditemukan di server ini.');
    }

    // Cek apakah member sedang di-timeout
    if (!member.communicationDisabledUntilTimestamp || member.communicationDisabledUntilTimestamp < Date.now()) {
      return ctx.sendError('Member tersebut tidak sedang dalam kondisi dibungkam (timeout).');
    }

    if (!member.moderatable) {
      return ctx.sendError('Saya tidak memiliki izin untuk meng-unmute member ini! (Pastikan posisi role bot lebih tinggi).');
    }

    // Pengecekan hierarki role moderator
    const isOwner = ctx.guild.ownerId === ctx.user.id;
    if (!isOwner && member.roles.highest.position >= ctx.member.roles.highest.position) {
      return ctx.sendError('Anda tidak bisa mencabut pembungkaman member dengan role setara atau lebih tinggi!');
    }

    await ctx.deferReply();

    try {
      // Hapus Timeout (set duration ke null)
      await member.timeout(null, `Unmuted oleh ${ctx.user.tag}: ${reason}`);

      // Kirim mod log
      await modLogger(ctx.client, ctx.guild, 'UNMUTE', targetUser, ctx.user, reason);

      // DM target member
      await targetUser.send({
        content: `🔊 Pembungkaman (timeout) Anda di server **${ctx.guild.name}** telah dicabut oleh moderator.\n• Alasan: \`${reason}\``
      }).catch(() => {});

      await ctx.sendSuccess(`Pembungkaman untuk ${targetUser.tag} berhasil dicabut!`);
    } catch (error) {
      ctx.client.logger.error('Error saat mencabut timeout:', error);
      await ctx.sendError('Terjadi kesalahan internal saat mencoba mencabut pembungkaman member.');
    }
  }
};
