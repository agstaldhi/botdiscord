const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UserXP = require('../../models/UserXP');
const permissions = require('../../utils/permissions');
const logger = require('../../utils/logger');
const { COLORS, EMOJIS } = require('../../utils/constants');

module.exports = {
  name: 'resetxp',
  description: 'Mereset data XP dan Level user atau seluruh server (Staff only).',
  aliases: ['resetlevel'],
  cooldown: 5,
  category: 'leveling',
  slashData: new SlashCommandBuilder()
    .setName('resetxp')
    .setDescription('Mereset data XP dan Level user atau seluruh server (Staff only).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt => opt.setName('user').setDescription('User yang ingin di-reset XP-nya.'))
    .addBooleanOption(opt => opt.setName('all').setDescription('Mereset data leveling untuk SELURUH server (Hati-hati!).')),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const settings = await ctx.client.helpers.getSettings(ctx.guild.id);
    if (!permissions.isBotManager(ctx.member, settings)) {
      return ctx.reply('❌ Anda tidak memiliki izin sebagai **Bot Manager** atau **Administrator** untuk menjalankan perintah ini!');
    }

    let targetUser, resetAll;

    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('user');
      resetAll = ctx.interaction.options.getBoolean('all') || false;
    } else {
      const arg = ctx.args[0];
      if (arg === 'all') {
        resetAll = true;
      } else if (ctx.message.mentions.users.first()) {
        targetUser = ctx.message.mentions.users.first();
      } else {
        return ctx.reply('❌ Format salah! Gunakan: `!resetxp <@user>` atau `!resetxp all`');
      }
    }

    if (targetUser && targetUser.bot) {
      return ctx.reply('❌ Bot tidak memiliki sistem XP.');
    }

    // A. Reset spesifik user
    if (targetUser) {
      await ctx.deferReply();
      try {
        await UserXP.destroy({
          where: { guildId: ctx.guild.id, userId: targetUser.id }
        });
        return await ctx.sendSuccess(`Berhasil mereset data leveling untuk ${targetUser} kembali ke Level 0 dan 0 XP.`);
      } catch (error) {
        logger.error('Error saat reset XP user:', error);
        return await ctx.sendError('Gagal mereset data leveling user.');
      }
    }

    // B. Reset seluruh server
    if (resetAll) {
      if (ctx.isSlash) {
        // Tampilkan konfirmasi tombol untuk slash command
        const confirmEmbed = new EmbedBuilder()
          .setColor(COLORS.WARNING)
          .setTitle('⚠️ Konfirmasi Reset Leveling Server')
          .setDescription('Apakah Anda yakin ingin mereset data leveling untuk **SELURUH** member di server ini? Tindakan ini bersifat permanen dan tidak bisa dibatalkan!');

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('confirm_reset_all_xp')
            .setLabel('Ya, Reset Semua')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('cancel_reset_all_xp')
            .setLabel('Batal')
            .setStyle(ButtonStyle.Secondary)
        );

        return await ctx.interaction.reply({
          embeds: [confirmEmbed],
          components: [row]
        });
      } else {
        // Konfirmasi teks untuk legacy prefix
        await ctx.reply('⚠️ Anda akan mereset data leveling seluruh server. Ketik `CONFIRM` dalam 15 detik untuk menyetujui.');
        
        const filter = m => m.author.id === ctx.user.id && m.content === 'CONFIRM';
        const collector = ctx.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async () => {
          try {
            await UserXP.destroy({ where: { guildId: ctx.guild.id } });
            await ctx.sendSuccess('Berhasil mereset seluruh data leveling server.');
          } catch (error) {
            logger.error('Gagal mereset data leveling server legacy:', error);
            await ctx.sendError('Gagal mereset data leveling server.');
          }
        });

        collector.on('end', collected => {
          if (collected.size === 0) {
            ctx.reply('❌ Waktu habis. Aksi reset data leveling server dibatalkan.');
          }
        });
        return;
      }
    }

    return ctx.reply('❌ Tentukan user yang ingin di-reset atau pilih opsi untuk mereset seluruh server.');
  }
};
