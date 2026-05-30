const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'userinfo',
  description: 'Menampilkan informasi lengkap profil seorang member.',
  aliases: ['uinfo', 'user', 'whois'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Menampilkan informasi lengkap profil seorang member.')
    .addUserOption(opt =>
      opt
        .setName('member')
        .setDescription('Member yang ingin dilihat profilnya.')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let targetMember;
    if (ctx.isSlash) {
      const user = ctx.interaction.options.getUser('member') || ctx.user;
      targetMember = await ctx.guild.members.fetch(user.id).catch(() => null);
    } else {
      const targetUser = ctx.message.mentions.users.first() || ctx.user;
      targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    }

    if (!targetMember) return ctx.reply('❌ Member tidak ditemukan.');

    await ctx.deferReply();

    try {
      const roles = targetMember.roles.cache
        .filter(r => r.id !== ctx.guild.roles.everyone.id)
        .sort((a, b) => b.position - a.position)
        .map(r => r.toString());

      const rolesStr = roles.length > 0 
        ? (roles.length > 20 ? roles.slice(0, 20).join(', ') + `... dan ${roles.length - 20} lainnya` : roles.join(', '))
        : '*None*';

      const embed = new EmbedBuilder()
        .setColor(targetMember.displayHexColor || COLORS.DEFAULT)
        .setTitle(`👤 Info Member — ${targetMember.user.tag}`)
        .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Nama Panggilan (Nickname)', value: targetMember.nickname || '*Tidak ada*', inline: true },
          { name: 'ID Pengguna', value: `\`${targetMember.id}\``, inline: true },
          { name: 'Akun Dibuat', value: `<t:${Math.floor(targetMember.user.createdTimestamp / 1000)}:F>`, inline: false },
          { name: 'Bergabung Server', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>`, inline: false },
          { name: `Roles [${roles.length}]`, value: rolesStr, inline: false }
        )
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error di command userinfo:', error);
      await ctx.sendError('Gagal memuat informasi member.');
    }
  }
};
