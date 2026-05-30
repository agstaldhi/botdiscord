const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/Warning');

module.exports = {
  name: 'case',
  description: 'Melihat rincian kasus pelanggaran berdasarkan Case ID.',
  aliases: ['detailcase', 'detailwarn'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Melihat rincian kasus pelanggaran berdasarkan Case ID.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addStringOption(opt => opt.setName('case_id').setDescription('Case ID / UUID kasus yang ingin dicari.').setRequired(true)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let caseId;

    if (ctx.isSlash) {
      caseId = ctx.interaction.options.getString('case_id');
    } else {
      caseId = ctx.args[0];
      
      if (!caseId) {
        return ctx.sendError('Masukkan Case ID pelanggaran! (Contoh: `!case <case_id>`)');
      }
    }

    await ctx.deferReply();

    try {
      const warn = await Warning.findOne({
        where: {
          warnId: caseId,
          guildId: ctx.guild.id
        }
      });

      if (!warn) {
        return ctx.sendError(`Kasus dengan Case ID \`${caseId}\` tidak ditemukan di server ini.`);
      }

      const dateStr = warn.createdAt ? new Date(warn.createdAt).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Tidak diketahui';

      const targetUser = await ctx.client.users.fetch(warn.userId).catch(() => null);
      const modUser = await ctx.client.users.fetch(warn.moderatorId).catch(() => null);

      const embed = ctx.client.embeds.create({
        title: `📁 Kasus Pelanggaran — Detail`,
        fields: [
          { name: 'Case ID (UUID)', value: `\`${warn.warnId}\``, inline: false },
          { name: 'Status Kasus', value: warn.active ? '🔴 **Aktif**' : '🟢 **Sudah Dicabut**', inline: true },
          { name: 'Waktu Tindakan', value: dateStr, inline: true },
          { name: 'Target Member', value: targetUser ? `${targetUser.tag} (<@${warn.userId}>)` : `ID: ${warn.userId}`, inline: false },
          { name: 'Moderator', value: modUser ? `${modUser.tag} (<@${warn.moderatorId}>)` : `ID: ${warn.moderatorId}`, inline: false },
          { name: 'Alasan Pelanggaran', value: `\`${warn.reason}\``, inline: false }
        ],
        thumbnail: targetUser ? targetUser.displayAvatarURL({ dynamic: true }) : null
      });

      await ctx.reply({ embeds: [embed] });
    } catch (error) {
      ctx.client.logger.error('Error saat mengambil rincian case:', error);
      await ctx.sendError('Gagal mengambil detail kasus dari database.');
    }
  }
};
