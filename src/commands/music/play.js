const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'play',
  description: 'Memutar lagu dari YouTube, Spotify, atau SoundCloud di Voice Channel.',
  aliases: ['p', 'putar'],
  cooldown: 3,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Memutar lagu dari YouTube, Spotify, atau SoundCloud di Voice Channel.')
    .addStringOption(opt => 
      opt.setName('query')
        .setDescription('Judul lagu, nama artis, atau link (YouTube/Spotify/SoundCloud).')
        .setRequired(true)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const memberVoiceChannel = ctx.member.voice.channel;
    
    // Validasi voice channel user
    if (!memberVoiceChannel) {
      return ctx.sendError('Anda harus bergabung ke voice channel terlebih dahulu untuk memutar musik!');
    }
    
    // Validasi kesamaan voice channel dengan bot jika bot sudah terhubung
    const botVoiceChannel = ctx.guild.members.me.voice.channel;
    if (botVoiceChannel && memberVoiceChannel.id !== botVoiceChannel.id) {
      return ctx.sendError('Anda harus berada di voice channel yang sama dengan bot!');
    }

    let query;
    if (ctx.isSlash) {
      query = ctx.interaction.options.getString('query');
    } else {
      query = ctx.args.join(' ');
      if (!query) {
        return ctx.sendError('Masukkan judul lagu atau URL! (Contoh: `!play shape of you`)');
      }
    }

    await ctx.deferReply();

    try {
      // Pemutaran menggunakan discord-player v6 .play() helper
      const { track } = await ctx.client.player.play(memberVoiceChannel, query, {
        nodeOptions: {
          metadata: {
            channel: ctx.channel,
            requestedBy: ctx.user
          },
          selfDeafen: true,
          volume: 80,
          leaveOnEnd: true,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 30000, // 30 detik kosong baru DC
          leaveOnEndCooldown: 30000
        }
      });

      await ctx.sendSuccess(`Menambahkan **[${track.title}](${track.url})** ke antrean.`);
    } catch (error) {
      ctx.client.logger.error('Error saat menjalankan command play:', error);
      await ctx.sendError(`Gagal memutar musik: \`${error.message}\``);
    }
  }
};
