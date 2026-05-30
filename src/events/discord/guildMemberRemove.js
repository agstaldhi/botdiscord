const sendLeave = require('../../modules/welcome/sendLeave');

module.exports = {
  name: 'guildMemberRemove',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').GuildMember|import('discord.js').PartialGuildMember} member 
   */
  async execute(client, member) {
    // Jalankan sistem pengiriman notifikasi leave
    await sendLeave(client, member);
  }
};
