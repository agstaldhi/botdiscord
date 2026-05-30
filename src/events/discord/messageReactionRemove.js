const ReactionRole = require('../../models/ReactionRole');
const logger = require('../../utils/logger');

module.exports = {
  name: 'messageReactionRemove',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').MessageReaction} reaction 
   * @param {import('discord.js').User} user 
   */
  async execute(client, reaction, user) {
    // Abaikan reaction dari bot
    if (user.bot) return;

    // Pastikan reaction tidak partial
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        logger.error('Gagal memproses partial reaction (remove):', error);
        return;
      }
    }

    const { message } = reaction;
    if (!message.guild) return;

    try {
      // Cari panel di database
      const panel = await ReactionRole.findOne({
        where: {
          guildId: message.guild.id,
          messageId: message.id
        }
      });

      if (!panel) return;

      // Verify mode tidak mencabut role ketika reaction di-remove
      if (panel.type === 'verify') return;

      const emojiKey = reaction.emoji.id || reaction.emoji.name;
      const entry = panel.reactions.find(r => r.emoji === emojiKey || r.emoji.includes(emojiKey));
      if (!entry) return;

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return;

      // Cabut role dari member
      if (member.roles.cache.has(entry.roleId)) {
        await member.roles.remove(entry.roleId).catch(err => logger.error(`Gagal mencabut role ${entry.roleId} dari user ${user.id}:`, err));
      }

    } catch (error) {
      logger.error('Error pada event messageReactionRemove:', error);
    }
  }
};
