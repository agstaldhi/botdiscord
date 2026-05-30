const { EmbedBuilder } = require('discord.js');
const Giveaway = require('../../models/Giveaway');
const UserXP = require('../../models/UserXP');
const logger = require('../../utils/logger');
const { COLORS } = require('../../utils/constants');

/**
 * Parsing string durasi (seperti 10m, 1h, 1d) menjadi milidetik
 * @param {string} str 
 * @returns {number|null} Milidetik, atau null jika tidak valid
 */
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

/**
 * Memulai Giveaway baru
 * @param {import('../../utils/CommandContext')} ctx 
 * @param {Object} options Opsi-opsi giveaway
 */
async function startGiveaway(ctx, options) {
  const { channel, prize, durationStr, winnerCount, minLevel, roleId } = options;
  const durationMs = parseDuration(durationStr);

  if (!durationMs) {
    return ctx.sendError('Durasi tidak valid! Gunakan format seperti: `10m` (10 menit), `2h` (2 jam), `1d` (1 hari).');
  }

  const endTime = new Date(Date.now() + durationMs);
  const endTimestamp = Math.floor(endTime.getTime() / 1000);

  // Buat Embed
  const embed = new EmbedBuilder()
    .setColor(COLORS.DEFAULT)
    .setTitle(`🎁 Giveaway: ${prize}`)
    .setDescription(`Klik emoji 🎉 di bawah ini untuk berpartisipasi!\n\n• Berakhir: <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n• Dihost oleh: <@${ctx.user.id}>\n• Jumlah Pemenang: **${winnerCount}**`)
    .setTimestamp();

  // Tambahkan info persyaratan jika ada
  const requirements = { minLevel: minLevel || 0, roleId: roleId || null, serverBooster: false };
  const reqLines = [];
  if (minLevel > 0) reqLines.push(`📊 Minimal Level: **${minLevel}**`);
  if (roleId) reqLines.push(`🎭 Perlu Role: <@&${roleId}>`);
  
  if (reqLines.length > 0) {
    embed.addFields({ name: '🔒 Persyaratan Masuk', value: reqLines.join('\n') });
  }

  try {
    const giveawayMsg = await channel.send({ embeds: [embed] });
    await giveawayMsg.react('🎉');

    // Simpan ke database
    await Giveaway.create({
      messageId: giveawayMsg.id,
      guildId: ctx.guild.id,
      channelId: channel.id,
      hostedBy: ctx.user.id,
      prize: prize,
      winnerCount: winnerCount,
      endTime: endTime,
      ended: false,
      winners: [],
      participants: [],
      requirements: requirements
    });

    // Jadwalkan penutupan
    scheduleGiveawayEnd(ctx.client, giveawayMsg.id, durationMs);

    return giveawayMsg.id;

  } catch (error) {
    logger.error('Gagal memulai giveaway:', error);
    throw error;
  }
}

/**
 * Menjadwalkan penutupan giveaway menggunakan setTimeout
 * @param {import('../../client')} client 
 * @param {string} messageId 
 * @param {number} delayMs 
 */
function scheduleGiveawayEnd(client, messageId, delayMs) {
  setTimeout(async () => {
    try {
      await endGiveaway(client, messageId);
    } catch (err) {
      logger.error(`Error saat menjalankan penutupan otomatis giveaway ${messageId}:`, err);
    }
  }, delayMs);
}

/**
 * Mengakhiri giveaway secara paksa atau otomatis
 * @param {import('../../client')} client 
 * @param {string} messageId 
 * @param {boolean} [force=false] Jika diakhiri paksa oleh admin
 * @returns {Promise<string[]>} List ID Pemenang
 */
async function endGiveaway(client, messageId, force = false) {
  const giveaway = await Giveaway.findOne({ where: { messageId } });
  if (!giveaway || giveaway.ended) return [];

  const guild = client.guilds.cache.get(giveaway.guildId);
  if (!guild) return [];

  const channel = guild.channels.cache.get(giveaway.channelId);
  if (!channel) return [];

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) {
    // Jika pesan dihapus, tandai ended di database agar tidak diproses lagi
    await Giveaway.update({ ended: true }, { where: { messageId } });
    return [];
  }

  // Tandai langsung di DB untuk mencegah double-process
  await Giveaway.update({ ended: true }, { where: { messageId } });

  // Ambil user yang bereaksi 🎉
  const reaction = message.reactions.cache.get('🎉');
  if (!reaction) {
    await announceNoWinners(message, giveaway);
    return [];
  }

  const users = await reaction.users.fetch();
  // Filter keluar bot
  let participants = users.filter(u => !u.bot).map(u => u.id);

  // Filter berdasarkan persyaratan
  const eligible = [];
  for (const userId of participants) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;

    let isEligible = true;

    // 1. Persyaratan Role
    if (giveaway.requirements?.roleId) {
      if (!member.roles.cache.has(giveaway.requirements.roleId)) {
        isEligible = false;
      }
    }

    // 2. Persyaratan Level
    if (isEligible && giveaway.requirements?.minLevel > 0) {
      const userXP = await UserXP.findOne({
        where: { guildId: giveaway.guildId, userId }
      });
      if (!userXP || userXP.level < giveaway.requirements.minLevel) {
        isEligible = false;
      }
    }

    if (isEligible) {
      eligible.push(userId);
    }
  }

  // Pilih pemenang secara acak
  const winners = [];
  const winnerCount = Math.min(giveaway.winnerCount, eligible.length);

  for (let i = 0; i < winnerCount; i++) {
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const winnerId = eligible.splice(randomIndex, 1)[0];
    winners.push(winnerId);
  }

  // Simpan hasil pemenang ke DB
  await Giveaway.update({
    winners: winners,
    participants: participants
  }, {
    where: { messageId }
  });

  // Perbarui Embed Pesan
  const winnersMention = winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'Tidak ada pemenang yang sah.';

  const endEmbed = new EmbedBuilder()
    .setColor('#ff4757') // Red accent for ended
    .setTitle(`🎁 Giveaway Berakhir: ${giveaway.prize}`)
    .setDescription(`Dihost oleh: <@${giveaway.hostedBy}>\nPemenang: ${winnersMention}\n\n*Giveaway telah ditutup.*`)
    .setTimestamp();

  await message.edit({ embeds: [endEmbed] }).catch(() => {});

  if (winners.length > 0) {
    await channel.send(`🎉 Selamat kepada pemenang **${giveaway.prize}**: ${winnersMention}! Hubungi <@${giveaway.hostedBy}> untuk mengklaim hadiah Anda!`).catch(() => {});
  } else {
    await channel.send(`😭 Sayang sekali, tidak ada pemenang yang memenuhi syarat untuk **${giveaway.prize}**.`).catch(() => {});
  }

  return winners;
}

/**
 * Mengumumkan bahwa tidak ada pemenang
 */
async function announceNoWinners(message, giveaway) {
  const endEmbed = new EmbedBuilder()
    .setColor('#ff4757')
    .setTitle(`🎁 Giveaway Berakhir: ${giveaway.prize}`)
    .setDescription(`Dihost oleh: <@${giveaway.hostedBy}>\nPemenang: Tidak ada partisipan.\n\n*Giveaway telah ditutup.*`)
    .setTimestamp();
  
  await message.edit({ embeds: [endEmbed] }).catch(() => {});
  await message.reply('😭 Tidak ada peserta yang berpartisipasi dalam giveaway ini.').catch(() => {});
}

/**
 * Memilih ulang (reroll) pemenang dari peserta yang tersisa
 * @param {import('../../utils/CommandContext')} ctx 
 * @param {string} messageId 
 * @returns {Promise<void>}
 */
async function rerollGiveaway(ctx, messageId) {
  const giveaway = await Giveaway.findOne({ where: { messageId } });
  if (!giveaway) {
    return ctx.sendError('Giveaway tidak ditemukan.');
  }

  if (!giveaway.ended) {
    return ctx.sendError('Giveaway ini belum berakhir! Selesaikan dulu giveaway ini sebelum melakukan reroll.');
  }

  const guild = ctx.guild;
  const channel = guild.channels.cache.get(giveaway.channelId);
  if (!channel) return ctx.sendError('Channel giveaway tidak ditemukan.');

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) return ctx.sendError('Pesan giveaway asli telah dihapus.');

  // Ambil reaksi 🎉 lagi
  const reaction = message.reactions.cache.get('🎉');
  if (!reaction) return ctx.sendError('Reaksi 🎉 pada pesan tidak ditemukan.');

  const users = await reaction.users.fetch();
  let participants = users.filter(u => !u.bot && u.id !== giveaway.hostedBy).map(u => u.id);

  // Filter berdasarkan persyaratan
  const eligible = [];
  for (const userId of participants) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;

    let isEligible = true;

    if (giveaway.requirements?.roleId) {
      if (!member.roles.cache.has(giveaway.requirements.roleId)) {
        isEligible = false;
      }
    }

    if (isEligible && giveaway.requirements?.minLevel > 0) {
      const userXP = await UserXP.findOne({
        where: { guildId: giveaway.guildId, userId }
      });
      if (!userXP || userXP.level < giveaway.requirements.minLevel) {
        isEligible = false;
      }
    }

    if (isEligible) {
      eligible.push(userId);
    }
  }

  if (eligible.length === 0) {
    return ctx.sendError('Tidak ada partisipan baru yang memenuhi syarat untuk dipilih.');
  }

  // Pilih satu pemenang acak
  const randomIndex = Math.floor(Math.random() * eligible.length);
  const newWinnerId = eligible[randomIndex];

  // Tambahkan ke DB
  const currentWinners = giveaway.winners || [];
  currentWinners.push(newWinnerId);
  await Giveaway.update({ winners: currentWinners }, { where: { messageId } });

  // Update embed
  const winnersMention = currentWinners.map(id => `<@${id}>`).join(', ');
  const endEmbed = new EmbedBuilder()
    .setColor('#ff4757')
    .setTitle(`🎁 Giveaway Berakhir (Rerolled): ${giveaway.prize}`)
    .setDescription(`Dihost oleh: <@${giveaway.hostedBy}>\nPemenang: ${winnersMention}\n\n*Pemenang telah dipilih ulang.*`)
    .setTimestamp();

  await message.edit({ embeds: [endEmbed] }).catch(() => {});
  await channel.send(`🎉 **Reroll Sukses!** Pemenang baru untuk **${giveaway.prize}** adalah <@${newWinnerId}>! Selamat!`).catch(() => {});
}

module.exports = {
  startGiveaway,
  endGiveaway,
  rerollGiveaway,
  scheduleGiveawayEnd
};
