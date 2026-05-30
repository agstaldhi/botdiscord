const { SlashCommandBuilder } = require('discord.js');

/**
 * Mengubah string waktu (MM:SS, HH:MM:SS, atau detik angka) menjadi milidetik
 */
function parseTimeToMs(timeStr) {
  if (!timeStr) return null;
  if (!isNaN(timeStr)) return parseInt(timeStr) * 1000; // Jika berupa angka detik saja
  
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0]);
    const secs = parseInt(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return null;
    return (mins * 60 + secs) * 1000;
  } else if (parts.length === 3) {
    const hrs = parseInt(parts[0]);
    const mins = parseInt(parts[1]);
    const secs = parseInt(parts[2]);
    if (isNaN(hrs) || isNaN(mins) || isNaN(secs)) return null;
    return (hrs * 3600 + mins * 60 + secs) * 1000;
  }
  
  return null;
}

module.exports = {
  name: 'seek',
  description: 'Melompat (seek) ke posisi durasi waktu tertentu pada lagu.',
  aliases: ['jump', 'durasi'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Melompat (seek) ke posisi durasi waktu tertentu pada lagu.')
    .addStringOption(opt => 
      opt.setName('time')
        .setDescription('Waktu tujuan (format: MM:SS, contoh: 1:30 atau 90 untuk 90 detik).')
        .setRequired(true)
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

    let timeStr;
    if (ctx.isSlash) {
      timeStr = ctx.interaction.options.getString('time');
    } else {
      timeStr = ctx.args[0];
      if (!timeStr) {
        return ctx.sendError('Masukkan waktu tujuan! (Contoh: `!seek 1:30` atau `!seek 90`)');
      }
    }

    const milliseconds = parseTimeToMs(timeStr);
    if (milliseconds === null || isNaN(milliseconds)) {
      return ctx.sendError('Format waktu tidak valid! Gunakan format detik (`90`) atau menit:detik (`1:30`).');
    }

    const track = queue.currentTrack;
    if (milliseconds > track.durationMS) {
      return ctx.sendError(`Waktu tujuan melebihi total durasi lagu! Durasi lagu ini adalah **${track.duration}**.`);
    }

    await ctx.deferReply();

    try {
      // Lakukan seek
      await queue.node.seek(milliseconds);
      await ctx.sendSuccess(`Berhasil melompat ke menit **${timeStr}**.`);
    } catch (error) {
      ctx.client.logger.error('Error saat melakukan seek:', error);
      await ctx.sendError('Terjadi kesalahan saat melompat ke durasi waktu tersebut.');
    }
  }
};
