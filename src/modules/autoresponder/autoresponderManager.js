const Autoresponder = require('../../models/Autoresponder');
const logger = require('../../utils/logger');

// Kooldowns in-memory
const cooldowns = new Map();

/**
 * Memproses pesan masuk untuk mencocokkan trigger autoresponder
 * @param {import('discord.js').Message} message 
 */
async function handleAutoresponder(message) {
  if (!message.guild || message.author.bot || message.system) return;

  try {
    const config = await Autoresponder.findOne({ where: { guildId: message.guild.id } });
    if (!config || !config.triggers || config.triggers.length === 0) return;

    const content = message.content.trim();
    if (!content) return;

    for (const t of config.triggers) {
      // Cek limit channel jika ada di masa depan, untuk sekarang default global
      if (t.channels && t.channels.length > 0 && !t.channels.includes(message.channel.id)) {
        continue;
      }

      let isMatch = false;
      const lowerContent = content.toLowerCase();
      const triggerLower = t.trigger.toLowerCase();

      switch (t.matchType) {
        case 'exact':
          isMatch = (lowerContent === triggerLower);
          break;
        case 'contains':
          isMatch = lowerContent.includes(triggerLower);
          break;
        case 'startsWith':
          isMatch = lowerContent.startsWith(triggerLower);
          break;
        case 'endsWith':
          isMatch = lowerContent.endsWith(triggerLower);
          break;
        case 'regex':
          try {
            const regex = new RegExp(t.trigger, 'i');
            isMatch = regex.test(content);
          } catch (e) {
            // Regex tidak valid
            isMatch = false;
          }
          break;
      }

      if (isMatch) {
        // Cek cooldown
        const cooldownKey = `${message.guild.id}-${t.id}`;
        const now = Date.now();
        const expirationTime = cooldowns.get(cooldownKey) || 0;

        if (now < expirationTime) {
          // Sedang cooldown, abaikan trigger ini
          continue;
        }

        // Set cooldown baru (default 5 detik jika tidak ditentukan)
        const cooldownAmount = (t.cooldown || 5) * 1000;
        cooldowns.set(cooldownKey, now + cooldownAmount);

        // Format placeholder respon
        let responseText = t.response
          .replace(/{user}/g, `<@${message.author.id}>`)
          .replace(/{username}/g, message.author.username)
          .replace(/{server}/g, message.guild.name);

        // Kirim Respon
        if (t.replyDM) {
          await message.author.send(responseText).catch(() => {});
        } else {
          await message.channel.send(responseText).catch(() => {});
        }

        // Hapus pesan asli jika dikonfigurasi
        if (t.deleteOriginal) {
          await message.delete().catch(() => {});
        }

        // Cukup picu satu autoresponder per pesan
        break;
      }
    }
  } catch (error) {
    logger.error('Error saat memproses autoresponder:', error);
  }
}

module.exports = { handleAutoresponder };
