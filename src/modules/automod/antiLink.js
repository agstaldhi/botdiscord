const linkRegex = /(https?:\/\/[^\s]+)/gi;

/**
 * Memeriksa apakah pesan mengandung tautan (link) yang dilarang
 * @param {import('discord.js').Message} message 
 * @param {Object} config Konfigurasi AutoMod
 * @returns {boolean} True jika melanggar
 */
function checkLink(message, config) {
  if (!config || !config.antiLink || !config.antiLink.enabled) return false;

  const content = message.content;
  const matches = content.match(linkRegex);
  if (!matches) return false;

  const whitelist = config.antiLink.whitelist || [];

  for (const url of matches) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      // Periksa apakah hostname atau domain utama ada di whitelist
      const isWhitelisted = whitelist.some(domain => {
        const d = domain.toLowerCase();
        return hostname === d || hostname.endsWith('.' + d);
      });

      if (!isWhitelisted) {
        return true; // Ditemukan link tidak ter-whitelist
      }
    } catch {
      // URL parsing failed, tapi ada pola link, anggap melanggar jika tidak di-whitelist
      return true;
    }
  }

  return false;
}

module.exports = { checkLink };
