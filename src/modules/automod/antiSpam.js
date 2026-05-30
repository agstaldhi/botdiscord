const spamMap = new Map();

/**
 * Memeriksa apakah pesan dikirim terlalu cepat (spam)
 * @param {import('discord.js').Message} message 
 * @param {Object} config Konfigurasi AutoMod
 * @returns {boolean} True jika melanggar
 */
function checkSpam(message, config) {
  if (!config || !config.antiSpam || !config.antiSpam.enabled) return false;

  const { guildId, author } = message;
  const { maxMessages, interval } = config.antiSpam;
  
  const key = `${guildId}:${author.id}`;
  const now = Date.now();

  if (!spamMap.has(key)) {
    spamMap.set(key, []);
  }

  const userMessages = spamMap.get(key);
  // Bersihkan pesan yang sudah di luar interval waktu
  const filtered = userMessages.filter(timestamp => now - timestamp < interval);
  filtered.push(now);
  spamMap.set(key, filtered);

  if (filtered.length > maxMessages) {
    // Hapus data cache setelah kena trigger biar tidak terus-terusan trigger setiap kirim pesan berikutnya
    spamMap.delete(key);
    return true;
  }

  return false;
}

module.exports = { checkSpam };
