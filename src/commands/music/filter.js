const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'filter',
  description: 'Mengaktifkan/menonaktifkan audio filter (bassboost, nightcore, 8D, dsb).',
  aliases: ['filters', 'audiofilter'],
  cooldown: 5,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Mengaktifkan/menonaktifkan audio filter.')
    .addStringOption(opt => 
      opt.setName('name')
        .setDescription('Nama audio filter.')
        .setRequired(false)
        .addChoices(
          { name: 'Bassboost', value: 'bassboost' },
          { name: 'Nightcore', value: 'nightcore' },
          { name: 'Vaporwave', value: 'vaporwave' },
          { name: '8D (Spatial Audio)', value: '8D' },
          { name: 'Treble (High frequency boost)', value: 'treble' },
          { name: 'Karaoke (Vocal cut)', value: 'karaoke' },
          { name: 'Reset / Matikan Semua Filter', value: 'clear' }
        )
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const memberVoiceChannel = ctx.member.voice.channel;
    if (!memberVoiceChannel) {
      return ctx.sendError('Anda harus bergabung ke voice channel terlebih dahulu!');
    }
    
    const botVoiceChannel = ctx.guild.members.me.voice.channel;
    if (botVoiceChannel && memberVoiceChannel.id !== botVoiceChannel.id) {
      return ctx.sendError('Anda harus berada di voice channel yang sama dengan bot!');
    }

    const queue = ctx.client.player.nodes.get(ctx.guild.id);
    if (!queue || !queue.isPlaying()) {
      return ctx.sendError('Tidak ada musik yang sedang diputar!');
    }

    let filterName;
    if (ctx.isSlash) {
      filterName = ctx.interaction.options.getString('name');
    } else {
      filterName = ctx.args[0] ? ctx.args[0].toLowerCase() : null;
    }

    await ctx.deferReply();

    try {
      const ffmpegFilters = queue.filters.ffmpeg;

      // Jika tidak menspesifikasikan nama filter, tampilkan daftar filter aktif saat ini
      if (!filterName) {
        const enabledFilters = ffmpegFilters.getFiltersEnabled();
        const listStr = enabledFilters.length > 0
          ? enabledFilters.map(f => `• \`${f}\``).join('\n')
          : '*Tidak ada filter aktif (Normal)*';

        const embed = ctx.client.embeds.create({
          title: '🎵 Audio Filters — Status',
          description: `Berikut adalah filter audio yang aktif saat ini:\n\n${listStr}\n\n*Gunakan \`/filter <nama_filter>\` untuk mengaktifkan/menonaktifkan.*`
        });
        return await ctx.reply({ embeds: [embed] });
      }

      // Reset semua filter
      if (filterName === 'clear' || filterName === 'reset' || filterName === 'normal') {
        await ffmpegFilters.clearDefaults();
        return await ctx.sendSuccess('Semua audio filter telah dinonaktifkan (kembali ke normal).');
      }

      // Validasi filter yang didukung
      const supportedFilters = ['bassboost', 'nightcore', 'vaporwave', '8D', 'treble', 'karaoke'];
      if (!supportedFilters.includes(filterName)) {
        return await ctx.sendError(`Filter tidak dikenal! Pilihlah dari: ${supportedFilters.map(f => `\`${f}\``).join(', ')}`);
      }

      // Toggle filter
      const isEnabled = ffmpegFilters.isEnabled(filterName);
      await ffmpegFilters.toggle(filterName);

      if (isEnabled) {
        await ctx.sendSuccess(`Audio filter **${filterName}** berhasil **dinonaktifkan**.`);
      } else {
        await ctx.sendSuccess(`Audio filter **${filterName}** berhasil **diaktifkan** (mungkin butuh beberapa detik untuk menyesuaikan stream).`);
      }
    } catch (error) {
      ctx.client.logger.error('Error saat mengatur audio filter:', error);
      await ctx.sendError('Terjadi kesalahan saat menerapkan audio filter.');
    }
  }
};
