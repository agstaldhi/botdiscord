const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

function parseDuration(str) {
  const regex = /^(\d+)([mhdw])$/i;
  const match = str.match(regex);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

module.exports = {
  name: 'reminder',
  description: 'Mengatur pengingat personal untuk Anda.',
  aliases: ['ingatkan', 'remind'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Mengatur pengingat personal untuk Anda.')
    .addStringOption(opt =>
      opt
        .setName('duration')
        .setDescription('Durasi pengingat (contoh: 10m, 1h, 1d).')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('message')
        .setDescription('Pesan pengingat.')
        .setRequired(true)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let durationStr, remindMessage;
    if (ctx.isSlash) {
      durationStr = ctx.interaction.options.getString('duration');
      remindMessage = ctx.interaction.options.getString('message');
    } else {
      // Legacy parse: !reminder <durasi> | <pesan>
      const rawArgs = ctx.args.join(' ').split('|');
      durationStr = rawArgs[0]?.trim();
      remindMessage = rawArgs[1]?.trim();

      if (!durationStr || !remindMessage) {
        return ctx.reply('❌ Format salah! Gunakan: `!reminder <durasi> | <pesan>`\nContoh: `!reminder 10m | Minum air putih`');
      }
    }

    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      return ctx.reply('❌ Durasi tidak valid! Gunakan format seperti: `10m` (10 menit), `2h` (2 jam), `1d` (1 hari).');
    }

    await ctx.deferReply();

    try {
      const endTimestamp = Math.floor((Date.now() + durationMs) / 1000);

      await ctx.sendSuccess(`Pengingat berhasil diatur! Bot akan mengingatkan Anda tentang **"${remindMessage}"** pada <t:${endTimestamp}:F> (<t:${endTimestamp}:R>).`);

      // Set timeout untuk pengingat
      setTimeout(async () => {
        try {
          const embed = new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle('⏰ Alarm Pengingat!')
            .setDescription(`Halo <@${ctx.user.id}>, Anda meminta untuk diingatkan tentang:\n\n**${remindMessage}**`)
            .setTimestamp();

          // Coba kirim via DM, jika gagal kirim ke channel asal
          const dmSuccess = await ctx.user.send({ embeds: [embed] })
            .then(() => true)
            .catch(() => false);

          if (!dmSuccess && ctx.channel) {
            await ctx.channel.send({
              content: `<@${ctx.user.id}> ⏰ **Pengingat!**`,
              embeds: [embed]
            }).catch(() => {});
          }
        } catch (err) {
          ctx.client.logger.error('Error saat mengirim pengingat:', err);
        }
      }, durationMs);

    } catch (error) {
      ctx.client.logger.error('Error di command reminder:', error);
      await ctx.sendError('Gagal mengatur pengingat.');
    }
  }
};
