const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'serverinfo',
  description: 'Menampilkan informasi lengkap mengenai server ini.',
  aliases: ['server', 'sinfo'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Menampilkan informasi lengkap mengenai server ini.'),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    await ctx.deferReply();
    const guild = ctx.guild;

    try {
      // Pastikan cache terisi
      const owner = await guild.fetchOwner();
      const members = await guild.members.fetch({ withPresences: false }).catch(() => guild.members.cache);
      
      const totalMembers = guild.memberCount;
      const botCount = members.filter(m => m.user.bot).size;
      const humanCount = totalMembers - botCount;

      const channelCount = guild.channels.cache.size;
      const textChannels = guild.channels.cache.filter(c => c.type === 0 || c.type === 15).size; // Text + Forum
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2 || c.type === 13).size; // Voice + Stage
      const categoryCount = guild.channels.cache.filter(c => c.type === 4).size;

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(`⚙️ Server Info — ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '👑 Pemilik Server', value: `<@${guild.ownerId}> (\`${owner.user.tag}\`)`, inline: true },
          { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
          { name: '📆 Dibuat Pada', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
          { 
            name: '👥 Anggota', 
            value: `• Total: **${totalMembers}**\n• Manusia: **${humanCount}**\n• Bot: **${botCount}**`, 
            inline: true 
          },
          { 
            name: '💬 Saluran', 
            value: `• Total: **${channelCount}**\n• Kategori: **${categoryCount}**\n• Teks: **${textChannels}**\n• Suara: **${voiceChannels}**`, 
            inline: true 
          },
          { 
            name: '⚡ Server Boosts', 
            value: `• Level: **${guild.premiumTier}**\n• Jumlah Boost: **${guild.premiumSubscriptionCount || 0}**`, 
            inline: true 
          },
          { 
            name: '🛡️ Lainnya', 
            value: `• Peran (Roles): **${guild.roles.cache.size}**\n• Verifikasi: **${guild.verificationLevel}**`, 
            inline: true 
          }
        )
        .setTimestamp();

      if (guild.bannerURL()) {
        embed.setImage(guild.bannerURL({ size: 1024 }));
      }

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error di command serverinfo:', error);
      await ctx.sendError('Gagal memuat informasi server.');
    }
  }
};
