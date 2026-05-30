const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const axios = require('axios');
const { COLORS } = require('../../utils/constants');

/**
 * Mendecode entitas HTML yang sering ada di respon Open Trivia DB
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&eacute;/g, 'é')
    .replace(/&aacute;/g, 'á')
    .replace(/&oacute;/g, 'ó')
    .replace(/&iacute;/g, 'í')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&deg;/g, '°')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&uuml;/g, 'ü');
}

module.exports = {
  name: 'trivia',
  description: 'Memulai kuis trivia interaktif untuk seluruh server.',
  aliases: ['kuis', 'tanya'],
  cooldown: 10,
  category: 'fun',
  slashData: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Memulai kuis trivia interaktif untuk seluruh server.'),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    await ctx.deferReply();

    try {
      // Ambil kuis dari Open Trivia DB
      const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 5000 });
      
      if (!response.data || response.data.response_code !== 0 || !response.data.results[0]) {
        throw new Error('Gagal mengambil kuis dari API');
      }

      const questionData = response.data.results[0];
      const decodedQuestion = decodeHtmlEntities(questionData.question);
      const correctAnswer = decodeHtmlEntities(questionData.correct_answer);
      
      // Kumpulkan opsi jawaban dan acak
      const options = questionData.incorrect_answers.map(ans => decodeHtmlEntities(ans));
      options.push(correctAnswer);

      // Shuffle options (Fisher-Yates)
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[options[j]]] = [options[j], options[i]];
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('🧠 Trivia Quiz Interaktif')
        .setDescription(`**Pertanyaan:**\n${decodedQuestion}`)
        .addFields(
          { name: '📂 Kategori', value: questionData.category, inline: true },
          { name: '📊 Kesulitan', value: questionData.difficulty.toUpperCase(), inline: true },
          { name: '⏳ Waktu Jawab', value: '15 detik', inline: true }
        )
        .setFooter({ text: 'Siapapun bisa menjawab! Klik pilihan di bawah untuk memilih.' })
        .setTimestamp();

      // Buat tombol opsi jawaban
      const buttons = options.map((opt, index) => {
        return new ButtonBuilder()
          .setCustomId(`trivia_opt_${index}`)
          .setLabel(opt.substring(0, 80))
          .setStyle(ButtonStyle.Primary);
      });

      const row = new ActionRowBuilder().addComponents(buttons);

      const responseMsg = await ctx.reply({ embeds: [embed], components: [row] });
      const msg = ctx.isSlash ? await ctx.interaction.fetchReply() : responseMsg;

      const answeredUsers = new Set();
      let winner = null;

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 15000
      });

      collector.on('collect', async i => {
        if (answeredUsers.has(i.user.id)) {
          return await i.reply({ content: '❌ Anda hanya dapat menjawab sekali untuk setiap kuis trivia!', ephemeral: true });
        }
        
        answeredUsers.add(i.user.id);
        const selectedIndex = parseInt(i.customId.replace('trivia_opt_', ''));
        const selectedAnswer = options[selectedIndex];

        if (selectedAnswer === correctAnswer) {
          winner = i.user;
          await i.deferUpdate();
          collector.stop('winner');
        } else {
          await i.reply({ content: `❌ Salah! **${selectedAnswer}** bukanlah jawaban yang tepat.`, ephemeral: true });
        }
      });

      collector.on('end', async (collected, reason) => {
        // Matikan semua tombol dan beri highlight ke jawaban benar
        const disabledButtons = buttons.map(btn => {
          const builder = ButtonBuilder.from(btn).setDisabled(true);
          const index = parseInt(btn.data.custom_id.replace('trivia_opt_', ''));
          
          if (options[index] === correctAnswer) {
            builder.setStyle(ButtonStyle.Success);
          } else {
            builder.setStyle(ButtonStyle.Secondary);
          }
          return builder;
        });

        const disabledRow = new ActionRowBuilder().addComponents(disabledButtons);

        if (reason === 'winner' && winner) {
          const winnerEmbed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('🏆 Trivia Selesai: Ada Pemenang!')
            .setDescription(`**Pertanyaan:**\n${decodedQuestion}\n\nJawaban benar: **${correctAnswer}**\n\nSelamat kepada ${winner} yang berhasil menjawab dengan benar terlebih dahulu!`)
            .addFields(
              { name: '📂 Kategori', value: questionData.category, inline: true },
              { name: '📊 Kesulitan', value: questionData.difficulty.toUpperCase(), inline: true }
            )
            .setFooter({ text: 'Terima kasih telah berpartisipasi!' })
            .setTimestamp();

          await msg.edit({ embeds: [winnerEmbed], components: [disabledRow] }).catch(() => {});
        } else {
          const timeoutEmbed = new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setTitle('⏰ Trivia Selesai: Waktu Habis!')
            .setDescription(`**Pertanyaan:**\n${decodedQuestion}\n\nJawaban yang benar adalah: **${correctAnswer}**\n\nSayang sekali, tidak ada yang berhasil menjawab dengan benar tepat waktu.`)
            .addFields(
              { name: '📂 Kategori', value: questionData.category, inline: true },
              { name: '📊 Kesulitan', value: questionData.difficulty.toUpperCase(), inline: true }
            )
            .setFooter({ text: 'Ketik kembali perintah untuk bermain lagi.' })
            .setTimestamp();

          await msg.edit({ embeds: [timeoutEmbed], components: [disabledRow] }).catch(() => {});
        }
      });

    } catch (error) {
      ctx.client.logger.error('Error di command trivia:', error);
      await ctx.sendError('Gagal memuat kuis trivia. Coba lagi beberapa saat lagi.');
    }
  }
};
