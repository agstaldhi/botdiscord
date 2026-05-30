const { SlashCommandBuilder } = require('discord.js');
const { QueueRepeatMode } = require('discord-player');

module.exports = {
  name: 'loop',
  description: 'Mengatur mode perulangan (loop) lagu.',
  aliases: ['ulang', 'repeat'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Mengatur mode perulangan (loop) lagu.')
    .addIntegerOption(opt => 
      opt.setName('mode')
        .setDescription('Pilih mode perulangan.')
        .setRequired(true)
        .addChoices(
          { name: 'Matikan (Off)', value: QueueRepeatMode.OFF },
          { name: 'Lagu saat ini (Track)', value: QueueRepeatMode.TRACK },
          { name: 'Seluruh Antrean (Queue)', value: QueueRepeatMode.QUEUE },
          { name: 'Autoplay (Auto)', value: QueueRepeatMode.AUTOPLAY }
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

    let mode;
    if (ctx.isSlash) {
      mode = ctx.interaction.options.getInteger('mode');
    } else {
      const modeStr = ctx.args[0] ? ctx.args[0].toLowerCase() : '';
      if (modeStr === 'track' || modeStr === 'song' || modeStr === 'single') {
        mode = QueueRepeatMode.TRACK;
      } else if (modeStr === 'queue' || modeStr === 'all') {
        mode = QueueRepeatMode.QUEUE;
      } else if (modeStr === 'autoplay' || modeStr === 'auto') {
        mode = QueueRepeatMode.AUTOPLAY;
      } else if (modeStr === 'off' || modeStr === 'disable') {
        mode = QueueRepeatMode.OFF;
      } else {
        return ctx.sendError('Gunakan format: `!loop <off/track/queue/autoplay>`');
      }
    }

    await ctx.deferReply();

    try {
      queue.setRepeatMode(mode);
      
      const modeNames = {
        [QueueRepeatMode.OFF]: 'Dinonaktifkan (Off)',
        [QueueRepeatMode.TRACK]: 'Lagu Saat Ini (Track Loop)',
        [QueueRepeatMode.QUEUE]: 'Seluruh Antrean (Queue Loop)',
        [QueueRepeatMode.AUTOPLAY]: 'Autoplay'
      };

      await ctx.sendSuccess(`Mode perulangan berhasil diatur ke: **${modeNames[mode]}**.`);
    } catch (error) {
      ctx.client.logger.error('Error saat mengatur loop:', error);
      await ctx.sendError('Terjadi kesalahan saat mencoba mengubah mode perulangan.');
    }
  }
};
