const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const { COLORS } = require('../../utils/constants');

/**
 * Menangani aksi saat user naik level (notifikasi & pemberian role)
 * @param {import('../../client')} client 
 * @param {import('discord.js').Message} message 
 * @param {Object} userXP Record user XP dari database
 * @param {Object} levelingConfig Konfigurasi leveling guild
 */
async function handleLevelUp(client, message, userXP, levelingConfig) {
  const { guild, author, member } = message;

  try {
    // 1. Tentukan channel untuk mengirim pengumuman
    let targetChannel = message.channel;
    if (levelingConfig.levelUpChannelId) {
      const configChannel = guild.channels.cache.get(levelingConfig.levelUpChannelId);
      if (configChannel) {
        targetChannel = configChannel;
      }
    }

    // 2. Buat Embed pengumuman
    const embed = new EmbedBuilder()
      .setColor(COLORS.DEFAULT)
      .setTitle('🎉 Level Up!')
      .setDescription(`Selamat <@${author.id}>, kamu telah naik ke **Level ${userXP.level}**!`)
      .setThumbnail(author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    // 3. Cek Role Rewards
    const levelRoles = levelingConfig.levelRoles || {};
    const roleIdReward = levelRoles[String(userXP.level)];
    
    if (roleIdReward) {
      const role = guild.roles.cache.get(roleIdReward);
      if (role && member) {
        // Berikan role reward
        await member.roles.add(role).catch(err => logger.error(`Gagal memberikan role reward ${role.name}:`, err));
        embed.addFields({ name: '🎁 Role Reward', value: `Kamu mendapatkan role **${role.name}**!` });
      }
    }

    await targetChannel.send({ content: `<@${author.id}>`, embeds: [embed] }).catch(() => {});

  } catch (error) {
    logger.error('Error saat menangani level up:', error);
  }
}

module.exports = { handleLevelUp };
