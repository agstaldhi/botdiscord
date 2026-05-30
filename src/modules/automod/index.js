const AutoModConfig = require('../../models/AutoModConfig');
const helpers = require('../../utils/helpers');
const permissions = require('../../utils/permissions');
const logger = require('../../utils/logger');

const { checkSpam } = require('./antiSpam');
const { checkLink } = require('./antiLink');
const { checkBadWords } = require('./badWords');
const { checkMention } = require('./antiMention');
const { checkCaps } = require('./antiCaps');
const { applyPunishment } = require('./punishment');

/**
 * Memeriksa pesan untuk semua filter AutoMod
 * @param {import('../../client')} client 
 * @param {import('discord.js').Message} message 
 * @returns {Promise<boolean>} True jika pesan melanggar dan telah di-handle
 */
async function checkMessage(client, message) {
  if (!message.guild || message.author.bot) return false;

  // Cek apakah modul automod aktif secara global untuk guild ini
  const settings = await helpers.getSettings(message.guild.id);
  if (!settings || !settings.modules || !settings.modules.automod) return false;

  // Lewati pemeriksaan jika user adalah Bot Owner atau Administrator
  if (permissions.isBotOwner(message.author) || message.member.permissions.has('Administrator')) return false;

  // Ambil konfigurasi AutoMod untuk guild ini
  let config = await AutoModConfig.findOne({ where: { guildId: message.guild.id } });
  if (!config) {
    config = await AutoModConfig.create({ guildId: message.guild.id });
  }

  // Lewati pemeriksaan jika channel di-ignore
  if (config.ignoredChannels && config.ignoredChannels.includes(message.channelId)) return false;

  // Lewati pemeriksaan jika user memiliki role yang di-ignore
  if (config.ignoredRoles && config.ignoredRoles.length > 0) {
    const hasIgnoredRole = message.member.roles.cache.some(role => config.ignoredRoles.includes(role.id));
    if (hasIgnoredRole) return false;
  }

  // 1. Cek Anti Spam
  if (config.antiSpam && config.antiSpam.enabled) {
    if (checkSpam(message, config)) {
      await applyPunishment(client, message, config.antiSpam.punishment || 'delete', 'AutoMod: Spamming');
      return true;
    }
  }

  // 2. Cek Anti Mention
  if (config.antiMention && config.antiMention.enabled) {
    if (checkMention(message, config)) {
      await applyPunishment(client, message, config.antiMention.punishment || 'delete', 'AutoMod: Mass Mention');
      return true;
    }
  }

  // 3. Cek Anti Caps
  if (config.antiCaps && config.antiCaps.enabled) {
    if (checkCaps(message, config)) {
      await applyPunishment(client, message, config.antiCaps.punishment || 'delete', 'AutoMod: Excessive Caps');
      return true;
    }
  }

  // 4. Cek Anti Link
  if (config.antiLink && config.antiLink.enabled) {
    if (checkLink(message, config)) {
      await applyPunishment(client, message, config.antiLink.punishment || 'delete', 'AutoMod: Anti-Link');
      return true;
    }
  }

  // 5. Cek Bad Words
  if (config.badWords && config.badWords.enabled) {
    if (checkBadWords(message, config)) {
      await applyPunishment(client, message, config.badWords.punishment || 'delete', 'AutoMod: Bad Words');
      return true;
    }
  }

  return false;
}

module.exports = { checkMessage };
