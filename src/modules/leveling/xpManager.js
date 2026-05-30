const UserXP = require('../../models/UserXP');
const LevelingConfig = require('../../models/LevelingConfig');
const helpers = require('../../utils/helpers');
const { handleLevelUp } = require('./levelUpHandler');
const logger = require('../../utils/logger');

/**
 * Memberikan XP secara acak ke member dan mendeteksi kenaikan level
 * @param {import('../../client')} client 
 * @param {import('discord.js').Message} message 
 */
async function giveXP(client, message) {
  if (!message.guild || message.author.bot) return;

  try {
    const guildId = message.guild.id;
    
    // Cek apakah leveling modul diaktifkan di guild config
    const settings = await helpers.getSettings(guildId);
    if (!settings || !settings.modules || !settings.modules.leveling) return;

    // Cek allowed channels untuk leveling jika dikonfigurasi
    if (settings.allowedChannels && settings.allowedChannels.leveling && settings.allowedChannels.leveling.length > 0) {
      if (!settings.allowedChannels.leveling.includes(message.channelId)) {
        return; // Channel tidak diperbolehkan mendapat XP
      }
    }

    // Cek ignored channels
    if (settings.ignoredChannels && settings.ignoredChannels.includes(message.channelId)) {
      return;
    }

    // Dapatkan atau buat config leveling
    let levelingConfig = await LevelingConfig.findOne({ where: { guildId } });
    if (!levelingConfig) {
      levelingConfig = await LevelingConfig.create({ guildId });
    }

    // Dapatkan atau buat record XP user
    let [userXP, created] = await UserXP.findOrCreate({
      where: { guildId, userId: message.author.id }
    });

    const now = Date.now();
    const cooldown = levelingConfig.xpCooldown || 60000;
    const lastGain = new Date(userXP.lastXpGain).getTime();

    // Jika cooldown belum selesai, lewati pemberian XP (tapi tetap hitung pesan jika perlu, atau lewati total)
    if (!created && now - lastGain < cooldown) {
      return;
    }

    // Berikan XP acak antara xpMin dan xpMax
    const min = levelingConfig.xpMin || 15;
    const max = levelingConfig.xpMax || 25;
    const xpGained = Math.floor(Math.random() * (max - min + 1)) + min;

    userXP.xp += xpGained;
    userXP.totalMessages += 1;
    userXP.lastXpGain = new Date(now);

    // Deteksi naik level
    let currentLevel = userXP.level;
    let leveledUp = false;

    // Naik level jika XP saat ini melebihi target: (level + 1) * 100
    while (userXP.xp >= (currentLevel + 1) * 100) {
      userXP.xp -= (currentLevel + 1) * 100;
      currentLevel += 1;
      leveledUp = true;
    }

    userXP.level = currentLevel;

    // Update database
    await UserXP.update({
      xp: userXP.xp,
      level: userXP.level,
      totalMessages: userXP.totalMessages,
      lastXpGain: userXP.lastXpGain
    }, {
      where: { id: userXP.id }
    });

    if (leveledUp) {
      await handleLevelUp(client, message, userXP, levelingConfig);
    }

  } catch (error) {
    logger.error('Error saat memproses pemberian XP:', error);
  }
}

module.exports = { giveXP };
