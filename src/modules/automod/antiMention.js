/**
 * Memeriksa apakah pesan melakukan mention berlebihan (mass mention)
 * @param {import('discord.js').Message} message 
 * @param {Object} config Konfigurasi AutoMod
 * @returns {boolean} True jika melanggar
 */
function checkMention(message, config) {
  if (!config || !config.antiMention || !config.antiMention.enabled) return false;

  const maxMentions = config.antiMention.maxMentions || 5;
  const userMentions = message.mentions.users.size;
  const roleMentions = message.mentions.roles.size;

  if (userMentions + roleMentions > maxMentions) {
    return true;
  }

  return false;
}

module.exports = { checkMention };
