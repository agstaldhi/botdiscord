const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'joke',
  description: 'Mendapatkan lelucon acak (bahasa Inggris & terjemahan).',
  aliases: ['jokes', 'lucu', 'bodor'],
  cooldown: 5,
  category: 'fun',
  slashData: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Mendapatkan lelucon acak (bahasa Inggris & terjemahan).'),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    await ctx.deferReply();

    try {
      const response = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 4000 });
      
      if (!response.data || !response.data.setup) {
        throw new Error('Format lelucon tidak valid');
      }

      const { setup, punchline } = response.data;

      // Terjemahkan lelucon ke Bahasa Indonesia secara otomatis
      let setupIndo = '';
      let punchlineIndo = '';
      
      try {
        const trSetup = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(setup)}`, { timeout: 3000 });
        setupIndo = trSetup.data[0].map(x => x[0]).join('');

        const trPunch = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(punchline)}`, { timeout: 3000 });
        punchlineIndo = trPunch.data[0].map(x => x[0]).join('');
      } catch (trError) {
        ctx.client.logger.warn('Gagal menerjemahkan lelucon, tampilkan bahasa asli:', trError.message);
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('😂 Lelucon Acak')
        .addFields(
          { name: '💬 Setup', value: `${setup}\n_${setupIndo ? `(${setupIndo})` : ''}_` },
          { name: '⚡ Punchline', value: `||**${punchline}**||\n_${punchlineIndo ? `(||${punchlineIndo}||)` : ''}_` }
        )
        .setFooter({ text: 'Klik box hitam untuk membuka punchline!' })
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      ctx.client.logger.error('Error saat mengambil lelucon:', error);

      // Fallback lelucon Indonesia jika API down
      const indonesianJokes = [
        { s: 'Kenapa ban mobil warnanya hitam?', p: 'Kalau merah, nanti disangka stroberi.' },
        { s: 'Buah apa yang paling pemberani?', p: 'Apel. Soalnya kalau digigit dia gak teriak.' },
        { s: 'Lele apa yang bisa terbang?', p: 'Lele-lawar.' },
        { s: 'Pekerjaan apa yang paling gak disukai ikan?', p: 'Koki. Soalnya sering digoreng.' },
        { s: 'Kenapa matahari tenggelam?', p: 'Karena gak bisa berenang.' }
      ];

      const randomJoke = indonesianJokes[Math.floor(Math.random() * indonesianJokes.length)];

      const fallbackEmbed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('😂 Lelucon Lokal (Fallback)')
        .addFields(
          { name: '💬 Pertanyaan', value: randomJoke.s },
          { name: '⚡ Jawaban', value: `||**${randomJoke.p}**||` }
        )
        .setFooter({ text: 'API down, menampilkan lelucon cadangan lokal.' })
        .setTimestamp();

      await ctx.reply({ embeds: [fallbackEmbed] });
    }
  }
};
