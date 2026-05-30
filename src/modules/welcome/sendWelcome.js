const { EmbedBuilder } = require('discord.js');
const WelcomeConfig = require('../../models/WelcomeConfig');
const logger = require('../../utils/logger');

/**
 * Helper untuk mengganti variabel dinamis di pesan/embed welcome
 */
function replaceVariables(str, member) {
  if (!str) return '';
  const count = member.guild.memberCount;
  const ordinal = `ke-${count}`;

  return str
    .replace(/{user}/g, member.toString())
    .replace(/{username}/g, member.user.username)
    .replace(/{tag}/g, member.user.tag)
    .replace(/{server}/g, member.guild.name)
    .replace(/{memberCount}/g, count.toString())
    .replace(/{memberOrdinal}/g, ordinal);
}

/**
 * Mengirimkan notifikasi selamat datang ke channel terpilih dan DM user
 * @param {import('../../client')} client 
 * @param {import('discord.js').GuildMember} member 
 */
module.exports = async (client, member) => {
  try {
    const config = await WelcomeConfig.findOne({ where: { guildId: member.guild.id } });
    if (!config) return;

    // 1. Kirim pesan welcome ke channel server (jika di-enable)
    if (config.welcomeEnabled && config.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(config.welcomeChannelId);
      if (channel) {
        const messageText = config.welcomeMessage ? replaceVariables(config.welcomeMessage, member) : '';
        const embeds = [];

        if (config.welcomeEmbed && config.welcomeEmbed.enabled) {
          const embedData = config.welcomeEmbed;
          const embed = new EmbedBuilder()
            .setColor(embedData.color || '#5865F2')
            .setTitle(embedData.title ? replaceVariables(embedData.title, member) : '')
            .setDescription(embedData.description ? replaceVariables(embedData.description, member) : '');

          if (embedData.thumbnail) {
            embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
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
          await channel.send(msgOptions).catch(err => logger.error(`Gagal mengirim welcome message ke channel:`, err));
        }
      }
    }

    // 2. Kirim pesan welcome ke DM user (jika di-enable)
    if (config.dmWelcome && config.dmMessage) {
      const dmText = replaceVariables(config.dmMessage, member);
      await member.send({ content: dmText }).catch(() => {
        logger.warn(`Gagal mengirim DM welcome ke ${member.user.tag} karena DM ditutup.`);
      });
    }
  } catch (error) {
    logger.error('Error saat memproses pengiriman welcome message:', error);
  }
};
