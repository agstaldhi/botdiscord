const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserXP = require('../../models/UserXP');
const { COLORS } = require('../../utils/constants');
const logger = require('../../utils/logger');

module.exports = {
  name: 'leaderboard',
  description: 'Menampilkan papan peringkat (leaderboard) leveling server.',
  aliases: ['lb', 'top'],
  cooldown: 5,
  category: 'leveling',
  slashData: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Menampilkan papan peringkat (leaderboard) leveling server.')
    .addIntegerOption(opt =>
      opt
        .setName('page')
        .setDescription('Halaman papan peringkat.')
        .setMinValue(1)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let page = 1;
    if (ctx.isSlash) {
      page = ctx.interaction.options.getInteger('page') || 1;
    } else {
      page = parseInt(ctx.args[0]) || 1;
    }

    await ctx.deferReply();

    try {
      const itemsPerPage = 10;
      const offset = (page - 1) * itemsPerPage;

      // Hitung total data
      const totalCount = await UserXP.count({ where: { guildId: ctx.guild.id } });
      const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

      if (page > totalPages) {
        return ctx.reply(`❌ Halaman ${page} tidak ditemukan. Maksimal halaman adalah ${totalPages}.`);
      }

      // Ambil top users
      const topUsers = await UserXP.findAll({
        where: { guildId: ctx.guild.id },
        order: [
          ['level', 'DESC'],
          ['xp', 'DESC']
        ],
        limit: itemsPerPage,
        offset: offset
      });

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(`🏆 Papan Peringkat Leveling — ${ctx.guild.name}`)
        .setFooter({ text: `Halaman ${page}/${totalPages} • Total Peserta: ${totalCount}` })
        .setTimestamp();

      if (topUsers.length === 0) {
        embed.setDescription('*Belum ada data peringkat untuk server ini.*');
      } else {
        const lines = [];
        for (let i = 0; i < topUsers.length; i++) {
          const entry = topUsers[i];
          const rank = offset + i + 1;
          
          let medal = `\`#${rank}\``;
          if (rank === 1) medal = '🥇';
          else if (rank === 2) medal = '🥈';
          else if (rank === 3) medal = '🥉';

          const user = await ctx.client.users.fetch(entry.userId).catch(() => null);
          const userTag = user ? user.tag : `User ID: ${entry.userId}`;
          
          const xpNeeded = (entry.level + 1) * 100;
          lines.push(`${medal} **${userTag}**\n└ Level: \`${entry.level}\` • XP: \`${entry.xp}/${xpNeeded}\` • Pesan: \`${entry.totalMessages}\``);
        }
        
        embed.setDescription(lines.join('\n\n'));
      }

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      logger.error('Error saat mengambil leaderboard leveling:', error);
      await ctx.sendError('Gagal memuat papan peringkat.');
    }
  }
};
