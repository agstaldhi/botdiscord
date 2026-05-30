const ReactionRole = require('../../models/ReactionRole');
const logger = require('../../utils/logger');

module.exports = {
  name: 'messageReactionAdd',
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
        logger.error('Gagal memproses partial reaction (add):', error);
        return;
      }
    }

    const { message } = reaction;
    if (!message.guild) return;

    try {
      // Cari panel reaction role di database
      const panel = await ReactionRole.findOne({
        where: {
          guildId: message.guild.id,
          messageId: message.id
        }
      });

      if (!panel) return;

      const emojiKey = reaction.emoji.id || reaction.emoji.name;
      // Cari role yang dipetakan untuk emoji ini
      const entry = panel.reactions.find(r => r.emoji === emojiKey || r.emoji.includes(emojiKey));
      if (!entry) return;

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) return;

      // 1. Mode: Normal
      if (panel.type === 'normal') {
        await member.roles.add(entry.roleId).catch(err => logger.error(`Gagal memberikan role ${entry.roleId} ke user ${user.id}:`, err));
      }
      // 2. Mode: Unique (hanya boleh punya 1 role dari panel ini)
      else if (panel.type === 'unique') {
        const otherEntries = panel.reactions.filter(r => r.roleId !== entry.roleId);
        
        for (const other of otherEntries) {
          // Hapus role lain yang ada di panel ini
          if (member.roles.cache.has(other.roleId)) {
            await member.roles.remove(other.roleId).catch(() => {});
          }
          
          // Cari reaction lain dari user ini dan hapus
          const otherReaction = message.reactions.cache.find(r => (r.emoji.id || r.emoji.name) === other.emoji);
          if (otherReaction) {
            await otherReaction.users.remove(user.id).catch(() => {});
          }
        }
        
        // Berikan role baru
        await member.roles.add(entry.roleId).catch(err => logger.error(`Gagal memberikan unique role ${entry.roleId}:`, err));
      }
      // 3. Mode: Verify
      else if (panel.type === 'verify') {
        // Berikan role
        await member.roles.add(entry.roleId).catch(err => logger.error(`Gagal memberikan verify role ${entry.roleId}:`, err));
        // Hapus reaction agar bersih
        await reaction.users.remove(user.id).catch(() => {});
      }

    } catch (error) {
      logger.error('Error pada event messageReactionAdd:', error);
    }
  }
};
