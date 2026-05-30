const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Warning = require('../../models/Warning');
const modLogger = require('../../utils/modLogger');

module.exports = {
  name: 'unwarn',
  description: 'Mencabut/menghapus peringatan (warning) dari member.',
  aliases: ['hapuswarn', 'removewarn'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Mencabut/menghapus peringatan (warning) dari member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addStringOption(opt => opt.setName('case_id').setDescription('UUID / Case ID peringatan yang ingin dicabut.').setRequired(true))
    .addStringOption(opt => opt.setName('alasan').setDescription('Alasan pencabutan peringatan.').setRequired(false)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let caseId;
    let reason;

    if (ctx.isSlash) {
      caseId = ctx.interaction.options.getString('case_id');
      reason = ctx.interaction.options.getString('alasan') || 'Dicabut oleh moderator.';
    } else {
      caseId = ctx.args[0];
      reason = ctx.args.slice(1).join(' ') || 'Dicabut oleh moderator.';
      
      if (!caseId) {
        return ctx.sendError('Masukkan Case ID peringatan yang ingin dicabut! (Contoh: `!unwarn <case_id> Alasan pencabutan`)');
      }
    }

    await ctx.deferReply();

    try {
      // Cari warning berdasarkan UUID/warnId di guild ini
      const warning = await Warning.findOne({
        where: {
          warnId: caseId,
          guildId: ctx.guild.id,
          active: true
        }
      });

      if (!warning) {
        return ctx.sendError(`Peringatan aktif dengan Case ID \`${caseId}\` tidak ditemukan di server ini.`);
      }

      // Tandai warning menjadi tidak aktif (soft delete)
      warning.active = false;
      await warning.save();

      // Ambil detail user target
      const targetUser = await ctx.client.users.fetch(warning.userId).catch(() => null);

      // Kirim mod log
      if (targetUser) {
        await modLogger(ctx.client, ctx.guild, 'UNWARN', targetUser, ctx.user, reason);
        // DM target member
        await targetUser.send({
          content: `🔓 Peringatan Anda di server **${ctx.guild.name}** telah dicabut oleh moderator.\n• Case ID: \`${caseId}\`\n• Alasan: \`${reason}\``
        }).catch(() => {});
      }

      await ctx.sendSuccess(`Peringatan dengan Case ID \`${caseId}\` berhasil dicabut!`);
    } catch (error) {
      ctx.client.logger.error('Error saat mencabut warning:', error);
      await ctx.sendError('Terjadi kesalahan internal saat mencoba mencabut peringatan.');
    }
  }
};
