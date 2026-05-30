const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const formatTime = require('../../utils/formatTime');
const { COLORS } = require('../../utils/constants');
const packageJson = require('../../../package.json');

module.exports = {
  name: 'botinfo',
  description: 'Menampilkan informasi dan statistik bot MonoHex.',
  aliases: ['about', 'botstats', 'info'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Menampilkan informasi dan statistik bot MonoHex.'),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    await ctx.deferReply();

    try {
      const client = ctx.client;
      const uptime = formatTime(client.uptime);
      const version = packageJson.version || '1.0.0';

      // Hitung memori & platform info
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const totalGuilds = client.guilds.cache.size;
      const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
      const totalChannels = client.channels.cache.size;
      const apiPing = client.ws.ping;

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
        .setTitle('🤖 Informasi & Statistik Bot')
        .setDescription('MonoHex adalah Discord Bot serbaguna modern dengan arsitektur premium, mendukung sistem Leveling, Moderasi, Ticket, TempVC, Custom Autoresponder, dan Music Player.')
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: '✨ Pengembang / Pemilik', value: '<@542614343160430592> (Aldhi)', inline: true },
          { name: '📦 Versi Bot', value: `\`v${version}\``, inline: true },
          { name: '⏳ Uptime Bot', value: `\`${uptime}\``, inline: true },
          
          { name: '📊 Statistik Discord', value: `• Server: \`${totalGuilds}\`\n• Pengguna: \`${totalMembers}\`\n• Channel: \`${totalChannels}\``, inline: true },
          { name: '⚙️ Statistik Sistem', value: `• RAM: \`${memoryUsage} MB\`\n• Node.js: \`${process.version}\`\n• Discord.js: \`v${djsVersion}\``, inline: true },
          { name: '🏓 Latensi Gateway', value: `• API: \`${apiPing}ms\``, inline: true }
        )
        .setFooter({ text: `Diminta oleh ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error saat menampilkan botinfo:', error);
      await ctx.sendError('Gagal memuat informasi bot.');
    }
  }
};
