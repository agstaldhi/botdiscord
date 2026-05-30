const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const MusicConfig = require('../../models/MusicConfig');

module.exports = {
  name: '247',
  description: 'Mengaktifkan/menonaktifkan mode 24/7 (bot tetap berada di voice channel).',
  aliases: ['alwayson', '24-7'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('247')
    .setDescription('Mengaktifkan/menonaktifkan mode 24/7 (bot tetap berada di voice channel).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const memberVoiceChannel = ctx.member.voice.channel;
    if (!memberVoiceChannel) {
      return ctx.sendError('Anda harus bergabung ke voice channel terlebih dahulu!');
    }

    await ctx.deferReply();

    try {
      // Dapatkan atau buat konfigurasi musik guild
      let config = await MusicConfig.findOne({ where: { guildId: ctx.guild.id } });
      if (!config) {
        config = await MusicConfig.create({ guildId: ctx.guild.id });
      }

      // Toggle mode 24/7
      const newStatus = !config.mode247;
      config.mode247 = newStatus;
      await config.save();

      // Terapkan perubahan ke queue aktif secara dinamis jika ada
      const queue = ctx.client.player.nodes.get(ctx.guild.id);
      if (queue) {
        queue.options.leaveOnEnd = !newStatus;
        queue.options.leaveOnEmpty = !newStatus;
        queue.options.leaveOnEmptyCooldown = newStatus ? 0 : 30000;
        queue.options.leaveOnEndCooldown = newStatus ? 0 : 30000;
      }

      if (newStatus) {
        await ctx.sendSuccess('Mode 24/7 **diaktifkan**. Bot tidak akan keluar dari voice channel secara otomatis.');
      } else {
        await ctx.sendSuccess('Mode 24/7 **dinonaktifkan**. Bot akan keluar secara otomatis jika antrean habis atau kosong.');
      }
    } catch (error) {
      ctx.client.logger.error('Error saat merubah mode 24/7:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba mengubah konfigurasi mode 24/7.');
    }
  }
};
