const Warning = require('../../models/Warning');
const AutoModConfig = require('../../models/AutoModConfig');
const modLogger = require('../../utils/modLogger');
const logger = require('../../utils/logger');
const { COLORS } = require('../../utils/constants');
const { EmbedBuilder } = require('discord.js');

/**
 * Menerapkan hukuman ke member yang melanggar AutoMod
 * @param {import('../../client')} client 
 * @param {import('discord.js').Message} message 
 * @param {string} action Aksi utama: delete, warn, mute, kick, ban
 * @param {string} reason Alasan pelanggaran (misal: "AutoMod: Spam")
 */
async function applyPunishment(client, message, action, reason) {
  const { guild, member, author, channel } = message;

  // Selalu hapus pesan untuk semua jenis pelanggaran AutoMod (kecuali jika action adalah none, tapi minimal delete)
  if (action !== 'none') {
    await message.delete().catch(() => {});
  }

  // Jika action hanya delete, kirim notifikasi singkat ke channel lalu hapus
  if (action === 'delete') {
    const warnMsg = await channel.send(`⚠️ <@${author.id}>, pesan Anda dihapus karena melanggar aturan (${reason}).`).catch(() => null);
    if (warnMsg) {
      setTimeout(() => warnMsg.delete().catch(() => {}), 4000);
    }
    return;
  }

  // Jika warn atau lebih berat, catat di database dan cek eskalasi
  if (action === 'warn' || action === 'mute' || action === 'kick' || action === 'ban') {
    try {
      // 1. Simpan warning ke database
      const warnCase = await Warning.create({
        guildId: guild.id,
        userId: author.id,
        moderatorId: client.user.id,
        reason: reason
      });

      const totalWarns = await Warning.count({
        where: {
          guildId: guild.id,
          userId: author.id,
          active: true
        }
      });

      // Kirim mod log warning awal
      await modLogger(client, guild, 'WARN', author, client.user, reason);

      // Beritahu user via DM
      await author.send({
        content: `⚠️ Anda menerima peringatan otomatis di server **${guild.name}**\n• Alasan: \`${reason}\`\n• Total Peringatan Anda saat ini: **${totalWarns}**`
      }).catch(() => {});

      // Kirim notifikasi di channel
      const notifyMsg = await channel.send(`⚠️ <@${author.id}> telah diperingatkan karena melanggar aturan (${reason}). [Case ID: \`${warnCase.warnId ? warnCase.warnId.substring(0,8) : 'MOCK'}\`]`).catch(() => null);
      if (notifyMsg) {
        setTimeout(() => notifyMsg.delete().catch(() => {}), 5000);
      }

      // 2. Cek Eskalasi Hukuman
      const automodConfig = await AutoModConfig.findOne({ where: { guildId: guild.id } });
      if (automodConfig && automodConfig.punishmentEscalation && automodConfig.punishmentEscalation.enabled) {
        const levels = automodConfig.punishmentEscalation.levels || [];
        // Cari level eskalasi yang sesuai dengan jumlah warnings
        const level = levels.find(l => l.warnings === totalWarns);

        if (level) {
          const escReason = `Eskalasi AutoMod: Mencapai ${totalWarns} Peringatan (${reason})`;
          
          if (level.action === 'mute') {
            const durationMs = (level.duration || 10) * 60 * 1000;
            await member.timeout(durationMs, escReason).catch(err => logger.error('Gagal timeout member via AutoMod escalation:', err));
            await modLogger(client, guild, 'TIMEOUT', author, client.user, escReason, `${level.duration} Menit`);
            await channel.send(`🔇 <@${author.id}> telah di-timeout selama ${level.duration} menit karena akumulasi peringatan.`).catch(() => {});
          } 
          else if (level.action === 'kick') {
            await member.kick(escReason).catch(err => logger.error('Gagal kick member via AutoMod escalation:', err));
            await modLogger(client, guild, 'KICK', author, client.user, escReason);
            await channel.send(`🔨 <@${author.id}> telah di-kick dari server karena akumulasi peringatan.`).catch(() => {});
          } 
          else if (level.action === 'ban') {
            await member.ban({ reason: escReason }).catch(err => logger.error('Gagal ban member via AutoMod escalation:', err));
            await modLogger(client, guild, 'BAN', author, client.user, escReason);
            await channel.send(`🔨 <@${author.id}> telah di-ban permanen dari server karena akumulasi peringatan.`).catch(() => {});
          }
        }
      }

    } catch (error) {
      logger.error('Error saat menerapkan hukuman AutoMod:', error);
    }
  }
}

module.exports = { applyPunishment };
