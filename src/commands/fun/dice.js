const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'dice',
  description: 'Melempar dadu dengan jumlah sisi dan kuantitas kustom.',
  aliases: ['roll', 'dadu'],
  cooldown: 3,
  category: 'fun',
  slashData: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Melempar dadu dengan jumlah sisi dan kuantitas kustom.')
    .addIntegerOption(opt =>
      opt
        .setName('sides')
        .setDescription('Jumlah sisi dadu (default: 6, min: 2, max: 1000).')
        .setMinValue(2)
        .setMaxValue(1000)
    )
    .addIntegerOption(opt =>
      opt
        .setName('amount')
        .setDescription('Jumlah dadu yang ingin dilempar (default: 1, min: 1, max: 20).')
        .setMinValue(1)
        .setMaxValue(20)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let sides = 6;
    let amount = 1;

    if (ctx.isSlash) {
      sides = ctx.interaction.options.getInteger('sides') || 6;
      amount = ctx.interaction.options.getInteger('amount') || 1;
    } else {
      // Cek format standard game roll (misal: 2d20, 1d6)
      const firstArg = ctx.args[0];
      if (firstArg && /^(\d+)[dD](\d+)$/.test(firstArg)) {
        const match = firstArg.match(/^(\d+)[dD](\d+)$/);
        amount = parseInt(match[1]);
        sides = parseInt(match[2]);
      } else {
        if (ctx.args[0]) amount = parseInt(ctx.args[0]);
        if (ctx.args[1]) sides = parseInt(ctx.args[1]);
      }

      // Validasi input
      if (isNaN(amount) || amount < 1 || amount > 20) {
        amount = 1;
      }
      if (isNaN(sides) || sides < 2 || sides > 1000) {
        sides = 6;
      }
    }

    const rolls = [];
    let total = 0;

    for (let i = 0; i < amount; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.DEFAULT)
      .setTitle('🎲 Hasil Lemparan Dadu')
      .setDescription(`Melempar **${amount}** dadu dengan **${sides}** sisi (Format: \`${amount}d${sides}\`)`)
      .addFields(
        { name: '🎲 Hasil Lemparan', value: rolls.map(r => `\`${r}\``).join(', ') },
        { name: '📊 Total Nilai', value: `**${total}**` }
      )
      .setFooter({ text: `Dilempar oleh ${ctx.user.tag}` })
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  }
};
