const { EmbedBuilder, ChannelType } = require('discord.js');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'channelCreate',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').GuildChannel} channel 
   */
  async execute(client, channel) {
    if (!channel.guild) return;

    try {
      const settings = await helpers.getSettings(channel.guild.id);
      if (!settings || !settings.serverLogChannelId) return;

      const logChannel = channel.guild.channels.cache.get(settings.serverLogChannelId);
      if (!logChannel) return;

      // Terjemahkan tipe channel
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
        .setColor('#2ecc71') // Hijau untuk create
        .setTitle('🆕 Channel Dibuat')
        .setDescription(`Channel baru telah dibuat di server.`)
        .addFields(
          { name: 'Nama Channel:', value: channel.type === ChannelType.GuildCategory ? `\`${channel.name}\`` : `<#${channel.id}> (\`${channel.name}\`)`, inline: true },
          { name: 'Tipe Channel:', value: typeStr, inline: true },
          { name: 'ID Channel:', value: `\`${channel.id}\``, inline: true }
        )
        .setTimestamp();

      if (channel.parent) {
        embed.addFields({ name: 'Kategori:', value: `\`${channel.parent.name}\``, inline: true });
      }

      await logChannel.send({ embeds: [embed] }).catch(() => {});

    } catch (error) {
      client.logger.error('Error di event channelCreate:', error);
    }
  }
};
