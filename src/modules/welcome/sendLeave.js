const { EmbedBuilder } = require('discord.js');
const WelcomeConfig = require('../../models/WelcomeConfig');
const logger = require('../../utils/logger');

/**
 * Helper untuk mengganti variabel dinamis di pesan/embed leave
 */
function replaceVariables(str, member) {
  if (!str) return '';
  const count = member.guild.memberCount;
  const ordinal = `ke-${count}`;

  return str
    .replace(/{username}/g, member.user.username)
    .replace(/{tag}/g, member.user.tag)
    .replace(/{server}/g, member.guild.name)
    .replace(/{memberCount}/g, count.toString())
    .replace(/{memberOrdinal}/g, ordinal);
}

/**
 * Mengirimkan notifikasi keluar/leave member ke channel terpilih
 * @param {import('../../client')} client 
 * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} member 
 */
module.exports = async (client, member) => {
  try {
    const config = await WelcomeConfig.findOne({ where: { guildId: member.guild.id } });
    if (!config || !config.leaveEnabled || !config.leaveChannelId) return;

    const channel = member.guild.channels.cache.get(config.leaveChannelId);
    if (!channel) return;

    const messageText = config.leaveMessage ? replaceVariables(config.leaveMessage, member) : '';
    const embeds = [];

    if (config.leaveEmbed && config.leaveEmbed.enabled) {
      const embedData = config.leaveEmbed;
      const embed = new EmbedBuilder()
        .setColor(embedData.color || '#e74c3c')
        .setTitle(embedData.title ? replaceVariables(embedData.title, member) : '')
        .setDescription(embedData.description ? replaceVariables(embedData.description, member) : '');

      if (embedData.thumbnail) {
        embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }) || member.user.defaultAvatarURL);
      }

      if (embedData.footer) {
        embed.setFooter({ text: replaceVariables(embedData.footer, member) });
      }

      if (embedData.showMemberCount) {
        embed.setTimestamp();
      }

      embeds.push(embed);
    }

    const msgOptions = {};
    if (messageText) msgOptions.content = messageText;
    if (embeds.length > 0) msgOptions.embeds = embeds;

    if (msgOptions.content || msgOptions.embeds) {
      await channel.send(msgOptions).catch(err => logger.error(`Gagal mengirim leave message ke channel:`, err));
    }
  } catch (error) {
    logger.error('Error saat memproses pengiriman leave message:', error);
  }
};
