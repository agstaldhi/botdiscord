const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
  name: 'poll',
  description: 'Membuat polling pendapat sederhana atau pilihan ganda.',
  aliases: ['tanyajawab', 'polling'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Membuat polling pendapat sederhana atau pilihan ganda.')
    .addStringOption(opt =>
      opt
        .setName('question')
        .setDescription('Pertanyaan polling.')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('options')
        .setDescription('Opsi pilihan ganda dipisahkan koma (maks 10). Contoh: Game, Musik, Film')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let question, optionsRaw;
    if (ctx.isSlash) {
      question = ctx.interaction.options.getString('question');
      optionsRaw = ctx.interaction.options.getString('options');
    } else {
      // Legacy parse: !poll <pertanyaan> | [opsi1, opsi2, ...]
      const rawArgs = ctx.args.join(' ').split('|');
      question = rawArgs[0]?.trim();
      optionsRaw = rawArgs[1]?.trim();

      if (!question) {
        return ctx.reply('❌ Format salah! Gunakan: `!poll <pertanyaan> | [opsi1, opsi2, ...]`\nContoh: `!poll Apakah kamu suka musik?` atau `!poll Pilih genre favoritmu | Game, Musik, Film`');
      }
    }

    await ctx.deferReply();

    try {
      let options = [];
      if (optionsRaw) {
        options = optionsRaw.split(',').map(o => o.trim()).filter(o => o.length > 0);
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('📊 Polling Pendapat')
        .setFooter({ text: `Dibuat oleh: ${ctx.user.tag}` })
        .setTimestamp();

      if (options.length === 0) {
        // Polling Yes / No
        embed.setDescription(`📢 **${question}**\n\n👍 = Setuju / Ya\n👎 = Tidak Setuju / Tidak`);
        
        const pollMsg = await ctx.reply({ embeds: [embed] });
        // Tambahkan reaksi
        await pollMsg.react('👍').catch(() => {});
        await pollMsg.react('👎').catch(() => {});
      } else {
        // Polling Pilihan Ganda (Maks 10)
        if (options.length > 10) {
          return await ctx.sendError('Maksimal jumlah pilihan ganda adalah 10 opsi!');
        }

        let description = `📢 **${question}**\n\n`;
        for (let i = 0; i < options.length; i++) {
          description += `${NUMBER_EMOJIS[i]} — ${options[i]}\n`;
        }

        embed.setDescription(description);

        const pollMsg = await ctx.reply({ embeds: [embed] });
        // Tambahkan reaksi numerik
        for (let i = 0; i < options.length; i++) {
          await pollMsg.react(NUMBER_EMOJIS[i]).catch(() => {});
        }
      }

    } catch (error) {
      ctx.client.logger.error('Error di command poll:', error);
      await ctx.sendError('Gagal membuat polling.');
    }
  }
};
