const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: '8ball',
  description: 'Memberikan jawaban acak atas pertanyaan Anda.',
  aliases: ['eightball', 'ramal'],
  cooldown: 3,
  category: 'fun',
  slashData: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Memberikan jawaban acak atas pertanyaan Anda.')
    .addStringOption(opt =>
      opt
        .setName('question')
        .setDescription('Pertanyaan yang ingin diajukan.')
        .setRequired(true)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let question;

    if (ctx.isSlash) {
      question = ctx.interaction.options.getString('question');
    } else {
      question = ctx.args.join(' ');
      if (!question) {
        return await ctx.sendError('Harap ajukan pertanyaan yang ingin dijawab! Contoh: `!8ball Apakah hari ini akan hujan?`');
      }
    }

    const answers = [
      // Positif
      'Ya, tentu saja.',
      'Sudah pasti.',
      'Tanpa ragu.',
      'Sangat meyakinkan.',
      'Bisa jadi.',
      'Tanda-tanda menunjukkan ya.',
      'Menurut saya, iya.',
      
      // Netral
      'Tanyakan lagi nanti.',
      'Lebih baik tidak memberitahumu sekarang.',
      'Konsentrasi dan tanyakan lagi.',
      'Coba tanyakan lagi nanti.',
      
      // Negatif
      'Jangan harap.',
      'Jawaban saya adalah tidak.',
      'Sumber saya mengatakan tidak.',
      'Sangat meragukan.',
      'Tentu saja tidak.'
    ];

    const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

    const embed = new EmbedBuilder()
      .setColor(COLORS.DEFAULT)
      .setTitle('🔮 Magic 8-Ball')
      .addFields(
        { name: '❓ Pertanyaan Anda', value: question },
        { name: '🔮 Jawaban 8-Ball', value: randomAnswer }
      )
      .setThumbnail('https://i.imgur.com/vH3sY5o.png') // Standard 8-ball icon url or similar
      .setFooter({ text: `Diminta oleh ${ctx.user.tag}` })
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  }
};
