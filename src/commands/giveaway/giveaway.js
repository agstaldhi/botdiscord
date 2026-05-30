const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { startGiveaway, endGiveaway, rerollGiveaway } = require('../../modules/giveaway/giveawayManager');
const Giveaway = require('../../models/Giveaway');
const permissions = require('../../utils/permissions');
const logger = require('../../utils/logger');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'giveaway',
  description: 'Mengelola sistem giveaway server.',
  aliases: ['gw', 'gcreate'],
  cooldown: 5,
  category: 'giveaway',
  slashData: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Mengelola sistem giveaway server.')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Membuat giveaway baru.')
        .addStringOption(opt =>
          opt
            .setName('prize')
            .setDescription('Hadiah giveaway.')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('duration')
            .setDescription('Durasi giveaway (contoh: 10m, 2h, 1d).')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('winners')
            .setDescription('Jumlah pemenang.')
            .setRequired(true)
            .setMinValue(1)
        )
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel tempat mengirim giveaway.')
            .addChannelTypes(ChannelType.GuildText)
        )
        .addIntegerOption(opt =>
          opt
            .setName('min_level')
            .setDescription('Minimal level leveling bot untuk ikut.')
            .setMinValue(0)
        )
        .addRoleOption(opt =>
          opt
            .setName('role')
            .setDescription('Role yang diwajibkan untuk ikut.')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('end')
        .setDescription('Mengakhiri giveaway yang sedang berjalan.')
        .addStringOption(opt =>
          opt
            .setName('message_id')
            .setDescription('ID pesan giveaway yang ingin diakhiri.')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reroll')
        .setDescription('Memilih ulang pemenang untuk giveaway yang sudah berakhir.')
        .addStringOption(opt =>
          opt
            .setName('message_id')
            .setDescription('ID pesan giveaway yang ingin di-reroll.')
            .setRequired(true)
        )
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    // Cek izin (ADMINISTRATOR atau Bot Manager)
    const settings = await ctx.client.helpers.getSettings(ctx.guild.id);
    if (!permissions.isBotManager(ctx.member, settings)) {
      return ctx.reply('❌ Anda tidak memiliki izin untuk mengelola giveaway!');
    }

    const subcommand = ctx.isSlash 
      ? ctx.interaction.options.getSubcommand() 
      : (ctx.args[0] ? ctx.args[0].toLowerCase() : null);

    if (!subcommand) {
      return ctx.reply('❌ Gunakan salah satu subcommand berikut: `create`, `end`, `reroll`.');
    }

    switch (subcommand) {
      case 'create':
        return await this.executeCreate(ctx);
      case 'end':
        return await this.executeEnd(ctx);
      case 'reroll':
        return await this.executeReroll(ctx);
      default:
        return ctx.reply(`❌ Subcommand \`${subcommand}\` tidak dikenal.`);
    }
  },

  /**
   * Eksekusi pembuatan giveaway
   */
  async executeCreate(ctx) {
    let prize, durationStr, winnerCount, channel, minLevel = 0, roleId = null;

    if (ctx.isSlash) {
      prize = ctx.interaction.options.getString('prize');
      durationStr = ctx.interaction.options.getString('duration');
      winnerCount = ctx.interaction.options.getInteger('winners');
      channel = ctx.interaction.options.getChannel('channel') || ctx.channel;
      minLevel = ctx.interaction.options.getInteger('min_level') || 0;
      const role = ctx.interaction.options.getRole('role');
      roleId = role ? role.id : null;
    } else {
      // Legacy parse: !giveaway create <hadiah> | <durasi> | <pemenang> | [min_level] | [role_mention/id]
      const rawArgs = ctx.args.slice(1).join(' ').split('|').map(a => a.trim());
      
      prize = rawArgs[0];
      durationStr = rawArgs[1];
      winnerCount = rawArgs[2] ? parseInt(rawArgs[2]) : null;

      if (!prize || !durationStr || !winnerCount || isNaN(winnerCount)) {
        return ctx.reply('❌ Format salah! Gunakan: `!giveaway create <hadiah> | <durasi> | <pemenang> | [min_level] | [role]`\nContoh: `!giveaway create Discord Nitro | 1h | 1 | 5 | @GiveawayParticipant`');
      }

      channel = ctx.message.mentions.channels.first() || ctx.channel;

      // Hapus mention channel dari parameter jika ada
      if (ctx.message.mentions.channels.first()) {
        // Asumsikan target channel ditangani, user bisa mention di mana saja atau default ke channel ini
      }

      minLevel = rawArgs[3] ? parseInt(rawArgs[3]) : 0;
      if (isNaN(minLevel)) minLevel = 0;

      const roleMention = ctx.message.mentions.roles.first();
      roleId = roleMention ? roleMention.id : null;
      if (!roleId && rawArgs[4]) {
        // Coba deteksi ID mentah
        const cleanedRoleId = rawArgs[4].replace(/[<@&>]/g, '');
        if (ctx.guild.roles.cache.has(cleanedRoleId)) {
          roleId = cleanedRoleId;
        }
      }
    }

    await ctx.deferReply();

    try {
      const msgId = await startGiveaway(ctx, {
        channel,
        prize,
        durationStr,
        winnerCount,
        minLevel,
        roleId
      });

      await ctx.sendSuccess(`Giveaway berhasil dimulai di channel <#${channel.id}>! (Message ID: \`${msgId}\`)`);
    } catch (error) {
      logger.error('Gagal membuat giveaway:', error);
      await ctx.sendError('Gagal membuat giveaway. Pastikan format durasi benar (contoh: 10m, 1h, 1d).');
    }
  },

  /**
   * Eksekusi penutupan giveaway
   */
  async executeEnd(ctx) {
    let messageId;

    if (ctx.isSlash) {
      messageId = ctx.interaction.options.getString('message_id');
    } else {
      messageId = ctx.args[1];
      if (!messageId) {
        return ctx.reply('❌ Harap masukkan ID pesan giveaway! Format: `!giveaway end <message_id>`');
      }
    }

    await ctx.deferReply();

    try {
      const winners = await endGiveaway(ctx.client, messageId, true);
      if (winners === null || (Array.isArray(winners) && winners.length === 0)) {
        // Cek apakah giveaway di DB ada tapi emang gak ada pemenang atau tidak ketemu
        const checkGW = await Giveaway.findOne({ where: { messageId } });
        if (!checkGW) {
          return ctx.sendError('Giveaway dengan ID pesan tersebut tidak ditemukan di database.');
        }
        if (checkGW.ended) {
          return ctx.sendError('Giveaway tersebut sudah berakhir.');
        }
        return ctx.sendSuccess('Giveaway diakhiri, tetapi tidak ada pemenang yang sah.');
      }

      await ctx.sendSuccess(`Giveaway berhasil diakhiri! Pemenang telah diumumkan.`);
    } catch (error) {
      logger.error('Gagal mengakhiri giveaway:', error);
      await ctx.sendError('Gagal mengakhiri giveaway. Pastikan ID pesan valid.');
    }
  },

  /**
   * Eksekusi reroll giveaway
   */
  async executeReroll(ctx) {
    let messageId;

    if (ctx.isSlash) {
      messageId = ctx.interaction.options.getString('message_id');
    } else {
      messageId = ctx.args[1];
      if (!messageId) {
        return ctx.reply('❌ Harap masukkan ID pesan giveaway! Format: `!giveaway reroll <message_id>`');
      }
    }

    await ctx.deferReply();

    try {
      await rerollGiveaway(ctx, messageId);
    } catch (error) {
      logger.error('Gagal reroll giveaway:', error);
      await ctx.sendError('Gagal melakukan reroll. Pastikan ID pesan valid dan giveaway sudah berakhir.');
    }
  }
};
