const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'lyrics',
  description: 'Mencari lirik lagu yang sedang diputar atau lagu tertentu.',
  aliases: ['lirik'],
  cooldown: 5,
  category: 'music',
  slashData: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Mencari lirik lagu yang sedang diputar atau lagu tertentu.')
    .addStringOption(opt => 
      opt.setName('title')
        .setDescription('Judul lagu yang ingin dicari liriknya.')
        .setRequired(false)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let title;

    if (ctx.isSlash) {
      title = ctx.interaction.options.getString('title');
    } else {
      title = ctx.args.join(' ');
    }

    const queue = ctx.client.player.nodes.get(ctx.guild.id);

    // Jika input lagu kosong, ambil lagu yang sedang diputar saat ini
    if (!title) {
      if (!queue || !queue.currentTrack) {
        return ctx.sendError('Masukkan judul lagu atau putar lagu terlebih dahulu untuk mencari lirik!');
      }
      
      // Bersihkan judul lagu dari embel-embel (seperti official video, lyrics, dsb) untuk pencarian lirik optimal
      title = queue.currentTrack.title
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/official/i, '')
        .replace(/video/i, '')
        .replace(/music/i, '')
        .replace(/lyric/i, '')
        .trim();
    }

    await ctx.deferReply();

    try {
      // Menggunakan Some Random API yang free dan langsung mengembalikan teks lirik utuh
      const response = await axios.get(`https://some-random-api.com/others/lyrics`, {
        params: { title }
      });

      const data = response.data;
      if (!data || !data.lyrics) {
        return ctx.sendError(`Lirik untuk lagu \`${title}\` tidak ditemukan.`);
      }

      // Potong lirik jika melebihi batas 4096 karakter deskripsi Embed
      let lyrics = data.lyrics;
      if (lyrics.length > 4000) {
        lyrics = lyrics.substring(0, 3990) + '\n\n*Lirik dipotong karena terlalu panjang...*';
      }

      const embed = ctx.client.embeds.create({
        title: `${data.title} — ${data.author}`,
        description: lyrics,
        thumbnail: data.thumbnail?.genius || null,
        footer: { text: `Sumber: Genius via SomeRandomAPI` }
      });

      await ctx.reply({ embeds: [embed] });
    } catch (error) {
      ctx.client.logger.error('Error saat mencari lirik:', error);
      await ctx.sendError('Gagal mencari lirik lagu saat ini. Pastikan judul lagu benar atau coba beberapa saat lagi.');
    }
  }
};
