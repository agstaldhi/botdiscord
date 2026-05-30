const { EmbedBuilder } = require('discord.js');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'roleCreate',
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
        .setColor('#2ecc71') // Hijau
        .setTitle('🆕 Role Dibuat')
        .setDescription(`Role baru telah dibuat di server.`)
        .addFields(
          { name: 'Nama Role:', value: `${role} (\`${role.name}\`)`, inline: true },
          { name: 'ID Role:', value: `\`${role.id}\``, inline: true },
          { name: 'Warna (HEX):', value: `\`${role.hexColor}\``, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] }).catch(() => {});

    } catch (error) {
      client.logger.error('Error di event roleCreate:', error);
    }
  }
};
