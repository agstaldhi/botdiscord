const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'roleinfo',
  description: 'Menampilkan informasi lengkap mengenai suatu role server.',
  aliases: ['rinfo', 'role'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Menampilkan informasi lengkap mengenai suatu role server.')
    .addRoleOption(opt =>
      opt
        .setName('role')
        .setDescription('Role yang ingin dilihat detailnya.')
        .setRequired(true)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let role;
    if (ctx.isSlash) {
      role = ctx.interaction.options.getRole('role');
    } else {
      role = ctx.message.mentions.roles.first() || ctx.guild.roles.cache.get(ctx.args[0]) || ctx.guild.roles.cache.find(r => r.name.toLowerCase() === ctx.args.join(' ').toLowerCase());
      if (!role) return ctx.reply('❌ Tentukan role yang valid! Format: `!roleinfo <@role/role_id/nama_role>`');
    }

    await ctx.deferReply();

    try {
      const embed = new EmbedBuilder()
        .setColor(role.hexColor || COLORS.DEFAULT)
        .setTitle(`🛡️ Info Role — ${role.name}`)
        .addFields(
          { name: 'Nama Role', value: `${role}`, inline: true },
          { name: 'ID Role', value: `\`${role.id}\``, inline: true },
          { name: 'Warna (HEX)', value: `\`${role.hexColor}\``, inline: true },
          { name: 'Posisi Hirarki', value: `\`${role.position}\` (Teratas dari bawah)`, inline: true },
          { name: 'Di-hoist (Terpisah)', value: role.hoist ? '✅ Yes' : '❌ No', inline: true },
          { name: 'Dapat Dimention', value: role.mentionable ? '✅ Yes' : '❌ No', inline: true },
          { name: 'Jumlah Member', value: `\`${role.members.size}\` member`, inline: true },
          { name: 'Dibuat Pada', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: false }
        )
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error di command roleinfo:', error);
      await ctx.sendError('Gagal memuat informasi role.');
    }
  }
};
