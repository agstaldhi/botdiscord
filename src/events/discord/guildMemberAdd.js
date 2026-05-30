const sendWelcome = require('../../modules/welcome/sendWelcome');
const WelcomeConfig = require('../../models/WelcomeConfig');
const logger = require('../../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').GuildMember} member 
   */
  async execute(client, member) {
    // 1. Eksekusi Welcome Notification & DM
    await sendWelcome(client, member);

    // 2. Eksekusi Auto Role
    try {
      const config = await WelcomeConfig.findOne({ where: { guildId: member.guild.id } });
      if (config && config.autoRoles) {
        const isBot = member.user.bot;
        const rolesToAssign = isBot 
          ? (config.autoRoles.botRoles || []) 
          : (config.autoRoles.humanRoles || []);

        if (rolesToAssign.length > 0) {
          const roles = rolesToAssign.filter(roleId => member.guild.roles.cache.has(roleId));
          if (roles.length > 0) {
            await member.roles.add(roles, 'MonoHex Auto Role on join').catch(err => {
              logger.warn(`Gagal menambahkan auto roles ke member ${member.user.tag}: ${err.message}`);
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Error saat memproses auto-role untuk member ${member.user.tag}:`, error);
    }
  }
};
