const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unlock',
  description: 'Membuka kembali channel yang terkunci.',
  aliases: ['unlockchannel', 'bukakunci'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Membuka kembali channel yang terkunci.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt => 
      opt.setName('channel')
        .setDescription('Channel yang ingin dibuka (default: channel saat ini).')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Alasan pembukaan kunci channel.')
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
      const everyoneRole = ctx.guild.roles.everyone;

      // Set SendMessages ke null (reset) agar mengikuti default permission server
      await targetChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null
      }, { reason: `Unlocked oleh ${ctx.user.tag}: ${reason}` });

      await ctx.sendSuccess(`Channel ${targetChannel} berhasil **dibuka kembali**!`);
      
      if (targetChannel.id !== ctx.channel.id) {
        await targetChannel.send({
          embeds: [ctx.client.embeds.success(`🔓 **Channel ini telah dibuka kembali oleh moderator.**`)]
        }).catch(() => {});
      }
    } catch (error) {
      ctx.client.logger.error('Error saat me-unlock channel:', error);
      await ctx.sendError('Gagal membuka kunci channel. Pastikan bot memiliki izin yang cukup.');
    }
  }
};
