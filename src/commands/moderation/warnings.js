const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/Warning');

module.exports = {
  name: 'warnings',
  description: 'Melihat daftar peringatan (warnings) milik member server.',
  aliases: ['warns', 'infractions'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Melihat daftar peringatan (warnings) milik member server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt => opt.setName('member').setDescription('Member yang ingin dicek.').setRequired(true)),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let targetUser;

    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('member');
    } else {
      targetUser = ctx.message.mentions.users.first();
      
      if (!targetUser) {
        // Jika tidak mention, default ke user yang mengirim
        targetUser = ctx.user;
      }
    }

    await ctx.deferReply();

    try {
      // Dapatkan daftar warning aktif
      const activeWarns = await Warning.findAll({
        where: {
          guildId: ctx.guild.id,
          userId: targetUser.id,
          active: true
        },
        order: [['createdAt', 'DESC']]
      });

      if (activeWarns.length === 0) {
        return ctx.reply({
          embeds: [ctx.client.embeds.info(`Member **${targetUser.tag}** bersih dan tidak memiliki peringatan aktif di server ini.`)]
        });
      }

      // Kumpulkan list field warning
      const fields = activeWarns.map((warn, index) => {
        const date = warn.createdAt ? new Date(warn.createdAt).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) : 'Baru saja';
        
        return {
          name: `Case ID: ${warn.warnId ? warn.warnId.substring(0, 8) + '...' : 'MOCK'} (Peringatan ke-${activeWarns.length - index})`,
          value: `• **Moderator:** <@${warn.moderatorId}>\n• **Tanggal:** ${date}\n• **Alasan:** \`${warn.reason}\` [Full ID: \`${warn.warnId}\`]`
        };
      });

      const embed = ctx.client.embeds.create({
        title: `⚠️ Daftar Peringatan — ${targetUser.tag}`,
        description: `Total Peringatan Aktif: **${activeWarns.length}**`,
        fields: fields.slice(0, 10), // Batasi 10 field pertama untuk menghindari limit embed
        thumbnail: targetUser.displayAvatarURL({ dynamic: true }) || targetUser.defaultAvatarURL
      });

      if (activeWarns.length > 10) {
        embed.setFooter({ text: `Menampilkan 10 dari ${activeWarns.length} total peringatan.` });
      }

      await ctx.reply({ embeds: [embed] });
    } catch (error) {
      ctx.client.logger.error('Error saat mengambil warnings:', error);
      await ctx.sendError('Gagal mengambil daftar peringatan dari database.');
    }
  }
};
