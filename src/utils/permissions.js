const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  /**
   * Cek apakah user terdaftar sebagai Bot Owner di .env
   * @param {import('discord.js').User} user 
   * @returns {boolean}
   */
  isBotOwner(user) {
    const owners = (process.env.BOT_OWNERS || '').split(',').map(id => id.trim());
    return owners.includes(user.id);
  },

  /**
   * Cek apakah member adalah Bot Manager (memenuhi salah satu kriteria hirarki)
   * @param {import('discord.js').GuildMember} member 
   * @param {Object} settings Konfigurasi guild dari database/cache
   * @returns {boolean}
   */
  isBotManager(member, settings) {
    if (!member) return false;
    
    // 1. Bot Owner
    if (this.isBotOwner(member.user)) return true;
    
    // 2. Server ADMINISTRATOR
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    
    if (!settings) return false;

    // 3. User terdaftar spesifik
    if (settings.managerUsers && settings.managerUsers.includes(member.id)) {
      return true;
    }
    
    // 4. Role terdaftar spesifik
    if (settings.managerRoles && settings.managerRoles.length > 0) {
      const hasManagerRole = member.roles.cache.some(role => settings.managerRoles.includes(role.id));
      if (hasManagerRole) return true;
    }
    
    return false;
  },

  /**
   * Cek apakah member memiliki kewenangan DJ untuk mengontrol musik
   * @param {import('discord.js').GuildMember} member 
   * @param {Object} musicConfig Konfigurasi musik dari database/cache
   * @returns {boolean}
   */
  isDJ(member, musicConfig) {
    if (!member) return false;
    
    // Bot Owner & Admin selalu diperbolehkan
    if (this.isBotOwner(member.user)) return true;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

    // Jika DJ Role belum diset, semua member adalah DJ
    if (!musicConfig || !musicConfig.djRoleId) return true;

    return member.roles.cache.has(musicConfig.djRoleId);
  }
};
