const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'calculate',
  description: 'Kalkulator sederhana untuk mengevaluasi ekspresi matematika.',
  aliases: ['calc', 'kalkulator', 'hitung'],
  cooldown: 3,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('calculate')
    .setDescription('Kalkulator sederhana untuk mengevaluasi ekspresi matematika.')
    .addStringOption(opt =>
      opt
        .setName('expression')
        .setDescription('Ekspresi matematika (contoh: 2 * (5 + 3)).')
        .setRequired(true)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let expression;
    if (ctx.isSlash) {
      expression = ctx.interaction.options.getString('expression');
    } else {
      expression = ctx.args.join(' ');
      if (!expression) {
        return ctx.reply('❌ Harap masukkan ekspresi matematika! Contoh: `!calculate 5 * (10 + 2)`');
      }
    }

    await ctx.deferReply();

    try {
      // 1. Bersihkan ekspresi dan lakukan validasi karakter aman (hanya angka dan operator dasar)
      const cleanExpression = expression.replace(/\s+/g, '');
      const safeRegex = /^[0-9+\-*/%().]+$/;

      if (!safeRegex.test(cleanExpression)) {
        return await ctx.sendError('Ekspresi matematika mengandung karakter ilegal! Hanya angka dan operator dasar (`+`, `-`, `*`, `/`, `%`, `(`, `)`) yang diizinkan.');
      }

      // 2. Evaluasi ekspresi secara aman
      const result = Function(`"use strict"; return (${cleanExpression})`)();

      if (result === undefined || result === null || isNaN(result) || !isFinite(result)) {
        return await ctx.sendError('Gagal mengevaluasi ekspresi matematika (Hasil tidak valid).');
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('🧮 Kalkulator Matematika')
        .addFields(
          { name: 'Soal (Ekspresi):', value: `\`\`\`\n${expression}\n\`\`\``, inline: false },
          { name: 'Jawaban (Hasil):', value: `\`\`\`\n${result}\n\`\`\``, inline: false }
        )
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });

    } catch (error) {
      await ctx.sendError('Ekspresi matematika tidak valid! Cek kembali penulisan tanda kurung atau operator.');
    }
  }
};
