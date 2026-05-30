const GuildConfig = require('../models/GuildConfig');

// Cache untuk konfigurasi server (Guild ID -> Config Object)
const configCache = new Map();

module.exports = {
  configCache,

  /**
   * Mengambil konfigurasi guild dari cache atau database PostgreSQL
   * @param {string} guildId 
   * @returns {Promise<Object>}
   */
  async getSettings(guildId) {
    if (!guildId) return null;
    
    // Jika ada di cache, gunakan cache
    if (configCache.has(guildId)) {
      return configCache.get(guildId);
    }
    
    try {
      // Cari di database menggunakan Sequelize syntax
      let settings = await GuildConfig.findOne({ where: { guildId } });
      
      // Jika tidak ada, buat baris default baru
      if (!settings) {
        settings = await GuildConfig.create({ guildId });
      }
      
      // Convert instance Sequelize ke raw JSON object
      const configObj = typeof settings.toJSON === 'function' ? settings.toJSON() : settings;
      configCache.set(guildId, configObj);
      return configObj;
    } catch (error) {
      console.error(`Gagal mendapatkan setting untuk guild ${guildId}:`, error);
      
      // Fallback ke objek kosong/default jika DB bermasalah sementara waktu
      return {
        guildId,
        prefix: "!",
        language: "id",
        modules: {
          welcome: true, leave: true, automod: false, leveling: false,
          music: true, ticket: false, giveaway: true, autoresponder: false, stats: false
        },
        allowedChannels: { music: [], commands: [], leveling: [] },
        ignoredChannels: [],
        managerRoles: [],
        managerUsers: []
      };
    }
  },

  /**
   * Memperbarui konfigurasi guild di database PostgreSQL dan memperbarui cache
   * @param {string} guildId 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async updateSettings(guildId, data) {
    if (!guildId) return null;
    
    try {
      // Update data di database menggunakan Sequelize syntax
      await GuildConfig.update(data, { where: { guildId } });
      
      // Ambil data terbaru untuk di-cache
      const settings = await GuildConfig.findOne({ where: { guildId } });
      
      const configObj = typeof settings.toJSON === 'function' ? settings.toJSON() : settings;
      configCache.set(guildId, configObj);
      return configObj;
    } catch (error) {
      console.error(`Gagal mengupdate setting untuk guild ${guildId}:`, error);
      throw error;
    }
  },

  /**
   * Menghapus konfigurasi guild dari cache
   * @param {string} guildId 
   */
  clearSettingsCache(guildId) {
    configCache.delete(guildId);
  },

  /**
   * Format waktu millisecond menjadi string baca manusia (misal: 1h 30m 15s)
   * @param {number} ms 
   * @returns {string}
   */
  formatDuration(ms) {
    if (isNaN(ms) || ms < 0) return '0s';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    
    return parts.join(' ');
  }
};
