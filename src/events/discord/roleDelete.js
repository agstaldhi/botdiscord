const { EmbedBuilder } = require('discord.js');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'roleDelete',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').Role} role 
   */
  async execute(client, role) {
    if (!role.guild) return;

    try {
      const settings = await helpers.getSettings(role.guild.id);
      if (!settings || !settings.serverLogChannelId) return;

      const logChannel = role.guild.channels.cache.get(settings.serverLogChannelId);
      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setColor('#e74c3c') // Merah
        .setTitle('🗑️ Role Dihapus')
        .setDescription(`Sebuah role telah dihapus dari server.`)
        .addFields(
          { name: 'Nama Role:', value: `\`${role.name}\``, inline: true },
          { name: 'ID Role:', value: `\`${role.id}\``, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] }).catch(() => {});

    } catch (error) {
      client.logger.error('Error di event roleDelete:', error);
    }
  }
};
