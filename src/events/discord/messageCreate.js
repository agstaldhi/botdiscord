const { Collection } = require('discord.js');
const CommandContext = require('../../utils/CommandContext');
const logger = require('../../utils/logger');
const permissions = require('../../utils/permissions');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'messageCreate',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').Message} message 
   */
  async execute(client, message) {
    // Abaikan pesan dari bot
    if (message.author.bot) return;

    // Jalankan pemeriksaan AutoMod
    if (message.guild) {
      const automod = require('../../modules/automod');
      const isViolated = await automod.checkMessage(client, message).catch(() => false);
      if (isViolated) return;
    }

    // Ambil prefix default
    let prefix = process.env.DEFAULT_PREFIX || '!';
    let settings = null;

    // Jika pesan dikirim di server, ambil prefix server dari database/cache
    if (message.guild) {
      settings = await helpers.getSettings(message.guild.id);
      if (settings && settings.prefix) {
        prefix = settings.prefix;
      }
    }

    // Pengecekan apakah pesan diawali prefix
    if (!message.content.startsWith(prefix)) {
      // Jalankan Autoresponder scan
      const { handleAutoresponder } = require('../../modules/autoresponder/autoresponderManager');
      await handleAutoresponder(message);

      // Jalankan pemberian XP Leveling
      const { giveXP } = require('../../modules/leveling/xpManager');
      await giveXP(client, message);
      return;
    }

    // Parse argumen dan nama command
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Cari command berdasarkan nama atau alias
    const command = client.commands.get(commandName) || 
                    client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if (!command) return;

    // Inisialisasi wrapper context
    const ctx = new CommandContext(client, message, args);

    // Cek Guild Only
    const nonGuildCategories = ['utility', 'fun'];
    if (!message.guild && !nonGuildCategories.includes(command.category)) {
      return ctx.reply('❌ Command ini hanya dapat digunakan di dalam server Discord!');
    }

    // Cek channel whitelist/ignored jika bukan admin/owner
    if (message.guild && !permissions.isBotOwner(message.author) && !message.member.permissions.has('Administrator')) {
      // Ignored channels (blacklist global bot)
      if (settings.ignoredChannels && settings.ignoredChannels.includes(message.channelId)) {
        return; // Hening, tidak merespon sama sekali
      }

      // Whitelist channel commands
      if (settings.allowedChannels && settings.allowedChannels.commands && settings.allowedChannels.commands.length > 0) {
        if (!settings.allowedChannels.commands.includes(message.channelId)) {
          // Hanya ingatkan di channel yang salah jika guild config mengizinkan
          return message.react('❌').catch(() => {});
        }
      }
    }

    // Pengecekan khusus kategori musik (channel lock & DJ role)
    if (command.category === 'music' && message.guild) {
      const MusicConfig = require('../../models/MusicConfig');
      const musicConfig = await MusicConfig.findOne({ where: { guildId: message.guild.id } }).catch(() => null);
      
      // 1. Validasi Channel Musik khusus
      if (musicConfig && musicConfig.musicChannelId && message.channelId !== musicConfig.musicChannelId) {
        if (!permissions.isBotOwner(message.author) && !message.member.permissions.has('Administrator')) {
          return message.react('❌').catch(() => {});
        }
      }

      // 2. Validasi DJ Role untuk perintah kontrol musik
      const controlCommands = ['pause', 'resume', 'stop', 'skip', 'volume', 'loop', 'shuffle', 'remove', 'move', 'seek', 'filter', '247'];
      if (controlCommands.includes(command.name)) {
        if (!permissions.isDJ(message.member, musicConfig)) {
          return message.reply('❌ Anda memerlukan role DJ atau hak Administrator untuk mengontrol pemutaran musik!')
            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000))
            .catch(() => {});
        }
      }
    }

    // Cek Cooldown
    if (!client.cooldowns.has(command.name)) {
      client.cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`⏳ Silakan tunggu \`${timeLeft.toFixed(1)}s\` sebelum menggunakan command \`${command.name}\` kembali.`)
          .then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 3000);
          });
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Cek Hak Akses Bot Manager untuk Kategori Config
    if (command.category === 'config' && message.guild) {
      if (!permissions.isBotManager(message.member, settings)) {
        return ctx.reply('❌ Anda tidak memiliki hak akses sebagai **Bot Manager** atau **Administrator** untuk mengkonfigurasi bot!');
      }
    }

    // Eksekusi Command
    try {
      await command.execute(ctx);
    } catch (error) {
      logger.error(`Error saat mengeksekusi prefix command !${command.name}:`, error);
      ctx.reply('❌ Terjadi kesalahan internal saat memproses command ini.').catch(() => {});
    }
  }
};
