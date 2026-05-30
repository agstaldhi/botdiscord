/**
 * Memeriksa apakah pesan mengandung kata kasar/dilarang
 * @param {import('discord.js').Message} message 
 * @param {Object} config Konfigurasi AutoMod
 * @returns {boolean} True jika melanggar
 */
function checkBadWords(message, config) {
  if (!config || !config.badWords || !config.badWords.enabled) return false;

  const words = config.badWords.words || [];
  if (words.length === 0) return false;

  const content = message.content.toLowerCase();
  const wildcard = config.badWords.wildcardMatch;

  if (wildcard) {
    // Cocokkan substring
    return words.some(word => content.includes(word.toLowerCase()));
  } else {
    // Cocokkan kata utuh (menggunakan regex batas kata / word boundary)
    return words.some(word => {
      // Escape karakter khusus regex
      const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
      return regex.test(content);
    });
  }
}

module.exports = { checkBadWords };
