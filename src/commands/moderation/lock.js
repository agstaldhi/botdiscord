const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'lock',
  description: 'Mengunci channel agar member biasa tidak dapat mengirim pesan.',
  aliases: ['lockchannel', 'kunci'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Mengunci channel agar member biasa tidak dapat mengirim pesan.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt => 
      opt.setName('channel')
        .setDescription('Channel yang ingin dikunci (default: channel saat ini).')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Alasan penguncian channel.')
        .setRequired(false)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let targetChannel;
    let reason;

    if (ctx.isSlash) {
      targetChannel = ctx.interaction.options.getChannel('channel') || ctx.channel;
      reason = ctx.interaction.options.getString('reason') || 'Tidak ada alasan.';
    } else {
      targetChannel = ctx.message.mentions.channels.first() || ctx.channel;
      reason = ctx.args.slice(1).join(' ') || 'Tidak ada alasan.';
    }

    await ctx.deferReply();

    try {
      // Dapatkan role @everyone
      const everyoneRole = ctx.guild.roles.everyone;

      // Edit permission overwrites untuk @everyone
      await targetChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false
      }, { reason: `Locked oleh ${ctx.user.tag}: ${reason}` });

      await ctx.sendSuccess(`Channel ${targetChannel} berhasil **dikunci**!`);
      
      // Jika dikunci bukan di channel saat ini, kirim pemberitahuan juga ke channel target
      if (targetChannel.id !== ctx.channel.id) {
        await targetChannel.send({
          embeds: [ctx.client.embeds.warning(`🔒 **Channel ini telah dikunci oleh moderator.**\nAlasan: \`${reason}\``)]
        }).catch(() => {});
      }
    } catch (error) {
      ctx.client.logger.error('Error saat me-lock channel:', error);
      await ctx.sendError('Gagal mengunci channel. Pastikan bot memiliki izin yang cukup.');
    }
  }
};
