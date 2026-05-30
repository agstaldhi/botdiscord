/**
 * Memeriksa apakah pesan menggunakan huruf kapital secara berlebihan
 * @param {import('discord.js').Message} message 
 * @param {Object} config Konfigurasi AutoMod
 * @returns {boolean} True jika melanggar
 */
function checkCaps(message, config) {
  if (!config || !config.antiCaps || !config.antiCaps.enabled) return false;

  const minLength = config.antiCaps.minLength || 10;
  const threshold = config.antiCaps.threshold || 70;

  const text = message.content.trim();
  if (text.length < minLength) return false;

  // Ambil karakter huruf alfabet saja
  const alphabetOnly = text.replace(/[^a-zA-Z]/g, '');
  if (alphabetOnly.length < minLength) return false;

  // Hitung jumlah huruf kapital
  const capsOnly = alphabetOnly.replace(/[^A-Z]/g, '');
  const percentage = (capsOnly.length / alphabetOnly.length) * 100;

  if (percentage > threshold) {
    return true;
  }

  return false;
}

module.exports = { checkCaps };
