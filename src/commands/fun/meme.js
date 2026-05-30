const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'meme',
  description: 'Mendapatkan meme acak dari Reddit.',
  aliases: ['randommeme', 'memes'],
  cooldown: 5,
  category: 'fun',
  slashData: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Mendapatkan meme acak dari Reddit.'),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    await ctx.deferReply();

    try {
      // Panggil API meme publik (Reddit scraper API)
      const response = await axios.get('https://meme-api.com/gimme', { timeout: 5000 });
      
      if (!response.data || !response.data.url) {
        throw new Error('Format respon API tidak valid');
      }

      const { title, url, author, subreddit, postLink, ups } = response.data;

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(title.substring(0, 256))
        .setURL(postLink)
        .setImage(url)
        .addFields(
          { name: '👤 Pembuat', value: `u/${author}`, inline: true },
          { name: '📁 Subreddit', value: `r/${subreddit}`, inline: true },
          { name: '👍 Upvotes', value: `${ups}`, inline: true }
        )
        .setFooter({ text: `Meme acak • Diminta oleh ${ctx.user.tag}` })
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error saat mengambil meme:', error);
      
      // Fallback jika API down
      const fallbackEmbed = new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('⚠️ Gagal mengambil meme online')
        .setDescription('API meme sedang bermasalah atau sibuk. Ini meme teks manual untuk Anda:\n\n*Developer: "Mengapa kode saya berjalan di lokal tapi gagal di server?"*\n*Server: "Karena kamu menulis dengan do\'a, bukan logika!"*')
        .setTimestamp();

      await ctx.reply({ embeds: [fallbackEmbed] });
    }
  }
};
