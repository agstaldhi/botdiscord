const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'translate',
  description: 'Menerjemahkan teks ke bahasa lain.',
  aliases: ['tr'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Menerjemahkan teks ke bahasa lain.')
    .addStringOption(opt =>
      opt
        .setName('text')
        .setDescription('Teks yang ingin diterjemahkan.')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('to')
        .setDescription('Kode bahasa tujuan (default: id - Indonesia).')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let text;
    let targetLang = 'id';

    if (ctx.isSlash) {
      text = ctx.interaction.options.getString('text');
      targetLang = ctx.interaction.options.getString('to') || 'id';
    } else {
      if (ctx.args.length === 0) {
        return await ctx.sendError('Gunakan format: `!translate [kode_bahasa_tujuan] <teks>` atau `!translate <teks>` untuk menerjemahkan ke bahasa Indonesia.');
      }
      
      // Deteksi jika argumen pertama adalah kode bahasa 2-3 huruf (misal: en, id, ja, ms, zh)
      const firstArg = ctx.args[0].toLowerCase();
      if (firstArg.length >= 2 && firstArg.length <= 5 && /^[a-z]+(-[a-z]+)?$/.test(firstArg)) {
        targetLang = firstArg;
        text = ctx.args.slice(1).join(' ');
      } else {
        text = ctx.args.join(' ');
      }

      if (!text) {
        return await ctx.sendError('Harap berikan teks yang ingin diterjemahkan!');
      }
    }

    await ctx.deferReply();

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      if (!response.data || !response.data[0]) {
        return await ctx.sendError('Gagal menerjemahkan teks tersebut. Pastikan format teks benar.');
      }

      const translatedText = response.data[0].map(x => x[0]).join('');
      const detectedSrcLang = response.data[2] || 'auto';

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('🌐 Google Translate')
        .addFields(
          { name: `Teks Asal (${detectedSrcLang.toUpperCase()})`, value: text.substring(0, 1024) },
          { name: `Hasil Terjemahan (${targetLang.toUpperCase()})`, value: translatedText.substring(0, 1024) }
        )
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error saat menerjemahkan:', error);
      await ctx.sendError('Gagal melakukan terjemahan. Hubungi developer jika masalah berlanjut.');
    }
  }
};
