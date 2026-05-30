const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'coinflip',
  description: 'Melempar koin untuk menentukan Heads (Gambar) atau Tails (Angka).',
  aliases: ['cf', 'flip', 'koin'],
  cooldown: 3,
  category: 'fun',
  slashData: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Melempar koin untuk menentukan Heads (Gambar) atau Tails (Angka).'),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    // Kirim pesan loading awal untuk sensasi melempar
    const sent = await ctx.reply({ content: '🪙 *Melempar koin ke udara...*', fetchReply: true });

    const results = [
      { name: 'Heads (Gambar)', emoji: '👑', img: 'https://i.imgur.com/3N4oWsk.png' }, // Heads representation
      { name: 'Tails (Angka)', emoji: '🔢', img: 'https://i.imgur.com/K1L8RjU.png' }   // Tails representation
    ];

    const finalResult = results[Math.floor(Math.random() * results.length)];

    // Berikan jeda 1 detik agar seperti melempar sungguhan
    setTimeout(async () => {
      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('🪙 Hasil Lemparan Koin')
        .setDescription(`Koin mendarat dan menunjukkan **${finalResult.emoji} ${finalResult.name}**!`)
        .setFooter({ text: `Diputar untuk ${ctx.user.tag}` })
        .setTimestamp();

      if (ctx.isSlash) {
        await ctx.interaction.editReply({ content: null, embeds: [embed] });
      } else {
        await sent.edit({ content: null, embeds: [embed] }).catch(() => {});
      }
    }, 1000);
  }
};
