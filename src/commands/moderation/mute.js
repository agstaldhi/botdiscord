const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const modLogger = require('../../utils/modLogger');

/**
 * Mengubah durasi string menjadi millisecond
 */
function parseDuration(str) {
  if (!str) return null;
  const match = str.toLowerCase().match(/^(\d+)([smhdw])$/);
  if (!match) return null;
  
  const num = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };
  
  return num * multipliers[unit];
}

module.exports = {
  name: 'mute',
  description: 'Membungkam member menggunakan sistem Native Timeout Discord.',
  aliases: ['timeout', 'silent'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Membungkam member menggunakan sistem Native Timeout Discord.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('member').setDescription('Member yang ingin dibungkam.').setRequired(true))
    .addStringOption(opt => 
      opt.setName('duration')
        .setDescription('Durasi pembungkaman.')
        .setRequired(true)
        .addChoices(
          { name: '60 Detik', value: '60s' },
          { name: '5 Menit', value: '5m' },
          { name: '10 Menit', value: '10m' },
          { name: '1 Jam', value: '1h' },
          { name: '1 Hari', value: '1d' },
          { name: '1 Minggu', value: '1w' }
        )
    )
    .addStringOption(opt => opt.setName('alasan').setDescription('Alasan pembungkaman.').setRequired(false)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let targetUser;
    let durationStr;
    let reason;

    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('member');
      durationStr = ctx.interaction.options.getString('duration');
      reason = ctx.interaction.options.getString('alasan') || 'Tidak ada alasan.';
    } else {
      targetUser = ctx.message.mentions.users.first();
      durationStr = ctx.args[1];
      reason = ctx.args.slice(2).join(' ') || 'Tidak ada alasan.';
      
      if (!targetUser || !durationStr) {
        return ctx.sendError('Gunakan format: `!mute @User <durasi: 5m/1h/1d> [alasan]`');
      }
    }

    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      return ctx.sendError('Format durasi tidak valid! Gunakan format seperti: `60s`, `5m`, `1h`, `1d`, `1w`.');
    }

    // Discord membatasi timeout maksimal 28 hari (4 minggu)
    if (durationMs > 28 * 24 * 60 * 60 * 1000) {
      return ctx.sendError('Batas waktu timeout maksimal dari Discord adalah 28 hari!');
    }

    if (targetUser.id === ctx.user.id) {
      return ctx.sendError('Anda tidak bisa membungkam diri sendiri!');
    }

    if (targetUser.id === ctx.client.user.id) {
      return ctx.sendError('Saya tidak bisa dibungkam!');
    }

    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return ctx.sendError('Member tersebut tidak ditemukan di server ini.');
    }

    if (!member.moderatable) {
      return ctx.sendError('Saya tidak memiliki izin untuk membungkam member ini! (Pastikan posisi role bot lebih tinggi).');
    }

    // Pengecekan hierarki role moderator
    const isOwner = ctx.guild.ownerId === ctx.user.id;
    if (!isOwner && member.roles.highest.position >= ctx.member.roles.highest.position) {
      return ctx.sendError('Anda tidak bisa membungkam member dengan role setara atau lebih tinggi!');
    }

    await ctx.deferReply();

    try {
      // Terapkan Timeout
      await member.timeout(durationMs, `Muted oleh ${ctx.user.tag}: ${reason}`);

      // Kirim mod log
      await modLogger(ctx.client, ctx.guild, 'TIMEOUT', targetUser, ctx.user, reason, durationStr);

      // DM target member
      await targetUser.send({
        content: `🔇 Anda telah **dibungkam (timeout)** di server **${ctx.guild.name}** selama **${durationStr}**.\n• Alasan: \`${reason}\``
      }).catch(() => {});

      await ctx.sendSuccess(`Member ${targetUser.tag} berhasil dibungkam selama **${durationStr}**!`);
    } catch (error) {
      ctx.client.logger.error('Error saat menerapkan timeout:', error);
      await ctx.sendError('Terjadi kesalahan internal saat mencoba membungkam member.');
    }
  }
};
