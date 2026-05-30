const { EmbedBuilder } = require('discord.js');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'guildMemberUpdate',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').GuildMember} oldMember 
   * @param {import('discord.js').GuildMember} newMember 
   */
  async execute(client, oldMember, newMember) {
    try {
      const settings = await helpers.getSettings(newMember.guild.id);
      if (!settings || !settings.serverLogChannelId) return;

      const logChannel = newMember.guild.channels.cache.get(settings.serverLogChannelId);
      if (!logChannel) return;

      const embeds = [];

      // 1. Deteksi Perubahan Nickname
      if (oldMember.nickname !== newMember.nickname) {
        const oldNick = oldMember.nickname || '*Tidak ada*';
        const newNick = newMember.nickname || '*Tidak ada*';

        const embed = new EmbedBuilder()
          .setColor('#f1c40f') // Kuning
          .setAuthor({
            name: newMember.user.tag,
            iconURL: newMember.user.displayAvatarURL({ dynamic: true })
          })
          .setDescription(`👤 **Perubahan Nickname:** ${newMember}`)
          .addFields(
            { name: 'Sebelum:', value: oldNick, inline: true },
            { name: 'Sesudah:', value: newNick, inline: true }
          )
          .setFooter({ text: `User ID: ${newMember.id}` })
          .setTimestamp();

        embeds.push(embed);
      }

      // 2. Deteksi Perubahan Role
      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;

      if (oldRoles.size !== newRoles.size) {
        // Cari role yang ditambahkan
        const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
        // Cari role yang dihapus
        const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

        if (addedRoles.size > 0) {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71') // Hijau
            .setAuthor({
              name: newMember.user.tag,
              iconURL: newMember.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`➕ **Role diberikan ke** ${newMember}:\n${addedRoles.map(role => `${role} (\`${role.id}\`)`).join('\n')}`)
            .setFooter({ text: `User ID: ${newMember.id}` })
            .setTimestamp();

          embeds.push(embed);
        }

        if (removedRoles.size > 0) {
          const embed = new EmbedBuilder()
            .setColor('#e74c3c') // Merah
            .setAuthor({
              name: newMember.user.tag,
              iconURL: newMember.user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`➖ **Role dicabut dari** ${newMember}:\n${removedRoles.map(role => `${role} (\`${role.id}\`)`).join('\n')}`)
            .setFooter({ text: `User ID: ${newMember.id}` })
            .setTimestamp();

          embeds.push(embed);
        }
      }

      // Kirim seluruh log jika ada perubahan
      if (embeds.length > 0) {
        await logChannel.send({ embeds }).catch(() => {});
      }

    } catch (error) {
      client.logger.error('Error di event guildMemberUpdate:', error);
    }
  }
};
