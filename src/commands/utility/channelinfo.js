const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'channelinfo',
  description: 'Menampilkan informasi lengkap mengenai suatu channel server.',
  aliases: ['cinfo', 'channel'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Menampilkan informasi lengkap mengenai suatu channel server.')
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel yang ingin dilihat detailnya.')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let channel;
    if (ctx.isSlash) {
      channel = ctx.interaction.options.getChannel('channel') || ctx.channel;
    } else {
      channel = ctx.message.mentions.channels.first() || ctx.guild.channels.cache.get(ctx.args[0]) || ctx.channel;
    }

    await ctx.deferReply();

    try {
      let typeStr = 'Unknown';
      switch (channel.type) {
        case ChannelType.GuildText: typeStr = 'Text Channel'; break;
        case ChannelType.GuildVoice: typeStr = 'Voice Channel'; break;
        case ChannelType.GuildCategory: typeStr = 'Category'; break;
        case ChannelType.GuildAnnouncement: typeStr = 'Announcement Channel'; break;
        case ChannelType.GuildStageVoice: typeStr = 'Stage Channel'; break;
        case ChannelType.GuildForum: typeStr = 'Forum'; break;
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(`💬 Info Channel — #${channel.name}`)
        .addFields(
          { name: 'Nama Channel', value: `${channel}`, inline: true },
          { name: 'ID Channel', value: `\`${channel.id}\``, inline: true },
          { name: 'Tipe Channel', value: typeStr, inline: true },
          { name: 'Dibuat Pada', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>`, inline: false }
        )
        .setTimestamp();

      if (channel.parent) {
        embed.addFields({ name: 'Kategori Induk', value: `\`${channel.parent.name}\``, inline: true });
      }

      if (channel.topic) {
        embed.addFields({ name: 'Topik Channel', value: channel.topic, inline: false });
      }

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error di command channelinfo:', error);
      await ctx.sendError('Gagal memuat informasi channel.');
    }
  }
};
