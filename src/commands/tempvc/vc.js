const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const TempVC = require('../../models/TempVC');
const TempVCConfig = require('../../models/TempVCConfig');
const { transferOwnership } = require('../../modules/tempvc/transferOwnership');
const permissions = require('../../utils/permissions');
const logger = require('../../utils/logger');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'vc',
  description: 'Mengendalikan Temporary Voice Channel milik Anda.',
  aliases: ['voice', 'room'],
  cooldown: 3,
  category: 'tempvc',
  slashData: new SlashCommandBuilder()
    .setName('vc')
    .setDescription('Mengendalikan Temporary Voice Channel milik Anda.')
    .addSubcommand(sub =>
      sub
        .setName('rename')
        .setDescription('Mengubah nama voice channel Anda.')
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('Nama baru untuk voice channel Anda.')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('limit')
        .setDescription('Mengubah batas maksimal jumlah user di channel Anda.')
        .addIntegerOption(opt =>
          opt
            .setName('limit')
            .setDescription('Jumlah maksimal user (0 = unlimited, 1-99).')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(99)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('lock')
        .setDescription('Mengunci channel agar member lain tidak bisa masuk.')
    )
    .addSubcommand(sub =>
      sub
        .setName('unlock')
        .setDescription('Membuka kunci channel agar bisa dimasuki kembali.')
    )
    .addSubcommand(sub =>
      sub
        .setName('kick')
        .setDescription('Mengeluarkan user tertentu dari voice channel Anda.')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User yang ingin di-kick.')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('transfer')
        .setDescription('Mentransfer kepemilikan room ini ke member lain.')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Member baru yang dijadikan owner room.')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('info')
        .setDescription('Menampilkan informasi mengenai Temporary Voice Channel Anda.')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    // 1. Cek apakah user sedang berada di voice channel
    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) {
      return ctx.reply('❌ Anda harus bergabung ke voice channel terlebih dahulu!');
    }

    // 2. Cek apakah voice channel tersebut merupakan TempVC aktif
    const tempVC = await TempVC.findOne({ where: { channelId: voiceChannel.id } });
    if (!tempVC) {
      return ctx.reply('❌ Channel voice tempat Anda berada bukanlah Temporary Voice Channel buatan bot!');
    }

    // 3. Cek apakah user adalah owner, Administrator, atau Bot Manager
    const settings = await ctx.client.helpers.getSettings(ctx.guild.id);
    const isOwner = tempVC.ownerId === ctx.user.id;
    const isManager = permissions.isBotManager(ctx.member, settings) || ctx.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isOwner && !isManager) {
      return ctx.reply('❌ Hanya pemilik Temporary Voice Channel yang bisa mengontrol room ini!');
    }

    const subcommand = ctx.isSlash 
      ? ctx.interaction.options.getSubcommand() 
      : (ctx.args[0] ? ctx.args[0].toLowerCase() : null);

    if (!subcommand) {
      return ctx.reply('❌ Gunakan salah satu subcommand berikut: `rename`, `limit`, `lock`, `unlock`, `kick`, `transfer`, `info`.');
    }

    // Cek perizinan konfigurasi guild untuk batasan spesifik
    const config = await TempVCConfig.findOne({ where: { guildId: ctx.guild.id } });

    switch (subcommand) {
      case 'rename':
        if (config && !config.allowUserRename && !isManager) {
          return ctx.reply('❌ Administrator menonaktifkan fitur rename room bagi user!');
        }
        return await this.executeRename(ctx, voiceChannel);
      case 'limit':
        if (config && !config.allowUserLimit && !isManager) {
          return ctx.reply('❌ Administrator menonaktifkan fitur limit room bagi user!');
        }
        return await this.executeLimit(ctx, voiceChannel);
      case 'lock':
        if (config && !config.allowUserLock && !isManager) {
          return ctx.reply('❌ Administrator menonaktifkan fitur lock room bagi user!');
        }
        return await this.executeLock(ctx, voiceChannel, false);
      case 'unlock':
        return await this.executeLock(ctx, voiceChannel, true);
      case 'kick':
        return await this.executeKick(ctx, voiceChannel);
      case 'transfer':
        return await this.executeTransfer(ctx, voiceChannel, tempVC.ownerId);
      case 'info':
        return await this.executeInfo(ctx, voiceChannel, tempVC);
      default:
        return ctx.reply(`❌ Subcommand \`${subcommand}\` tidak dikenal.`);
    }
  },

  /**
   * Mengubah nama room
   */
  async executeRename(ctx, channel) {
    let newName;
    if (ctx.isSlash) {
      newName = ctx.interaction.options.getString('name');
    } else {
      newName = ctx.args.slice(1).join(' ');
      if (!newName) return ctx.reply('❌ Harap masukkan nama baru! Format: `!vc rename <nama_baru>`');
    }

    if (newName.length > 100) return ctx.reply('❌ Nama channel tidak boleh lebih dari 100 karakter!');

    await ctx.deferReply();

    try {
      await channel.setName(newName);
      await ctx.sendSuccess(`Nama voice channel berhasil diubah menjadi \`${newName}\`! (Catatan: Discord membatasi perubahan nama channel maksimal 2 kali per 10 menit).`);
    } catch (error) {
      logger.error('Gagal me-rename TempVC:', error);
      await ctx.sendError('Gagal mengubah nama channel. Kemungkinan bot terkena rate limit dari Discord.');
    }
  },

  /**
   * Mengubah limit user
   */
  async executeLimit(ctx, channel) {
    let limit;
    if (ctx.isSlash) {
      limit = ctx.interaction.options.getInteger('limit');
    } else {
      limit = parseInt(ctx.args[1]);
      if (isNaN(limit) || limit < 0 || limit > 99) {
        return ctx.reply('❌ Format salah! Harap masukkan angka limit antara 0 hingga 99. Format: `!vc limit <0-99>`');
      }
    }

    await ctx.deferReply();

    try {
      await channel.setUserLimit(limit);
      const text = limit === 0 ? 'tidak terbatas' : `${limit} user`;
      await ctx.sendSuccess(`Batas maksimal user voice channel berhasil diubah menjadi **${text}**!`);
    } catch (error) {
      logger.error('Gagal men-set user limit TempVC:', error);
      await ctx.sendError('Gagal mengubah batas user channel.');
    }
  },

  /**
   * Mengunci atau membuka room
   */
  async executeLock(ctx, channel, isUnlock) {
    await ctx.deferReply();

    try {
      if (isUnlock) {
        // Unlock: Everyone can connect
        await channel.permissionOverwrites.edit(ctx.guild.roles.everyone.id, {
          Connect: true
        });
        await ctx.sendSuccess('🔓 Channel berhasil dibuka! Semua member kini bisa bergabung.');
      } else {
        // Lock: Everyone cannot connect (except owner / staff)
        await channel.permissionOverwrites.edit(ctx.guild.roles.everyone.id, {
          Connect: false
        });
        await ctx.sendSuccess('🔒 Channel berhasil dikunci! Hanya yang di-invite atau staff yang bisa bergabung.');
      }
    } catch (error) {
      logger.error('Gagal mengubah lock state TempVC:', error);
      await ctx.sendError('Gagal mengubah status kunci channel.');
    }
  },

  /**
   * Mendepak user dari room
   */
  async executeKick(ctx, channel) {
    let targetMember;
    if (ctx.isSlash) {
      const user = ctx.interaction.options.getUser('user');
      targetMember = await ctx.guild.members.fetch(user.id).catch(() => null);
    } else {
      const targetUser = ctx.message.mentions.users.first();
      if (!targetUser) return ctx.reply('❌ Mention user yang ingin dikeluarkan! Format: `!vc kick <@user>`');
      targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    }

    if (!targetMember) return ctx.reply('❌ Member tidak ditemukan.');

    if (targetMember.voice.channelId !== channel.id) {
      return ctx.reply('❌ Member tersebut tidak sedang berada di dalam voice channel Anda!');
    }

    if (targetMember.id === ctx.user.id) {
      return ctx.reply('❌ Anda tidak bisa mengeluarkan diri Anda sendiri!');
    }

    await ctx.deferReply();

    try {
      // Pindahkan user keluar dari voice channel (ke null)
      await targetMember.voice.setChannel(null);
      
      // Hapus izin connect untuk user tersebut agar tidak bisa balik
      await channel.permissionOverwrites.edit(targetMember.id, {
        Connect: false
      });

      await ctx.sendSuccess(`🚨 Member <@${targetMember.id}> berhasil dikeluarkan dari voice channel dan dilarang masuk kembali!`);
    } catch (error) {
      logger.error('Gagal me-kick member dari TempVC:', error);
      await ctx.sendError('Gagal mendepak member dari voice channel.');
    }
  },

  /**
   * Mentransfer ownership room
   */
  async executeTransfer(ctx, channel, currentOwnerId) {
    let targetMember;
    if (ctx.isSlash) {
      const user = ctx.interaction.options.getUser('user');
      targetMember = await ctx.guild.members.fetch(user.id).catch(() => null);
    } else {
      const targetUser = ctx.message.mentions.users.first();
      if (!targetUser) return ctx.reply('❌ Mention member baru yang akan dijadikan owner! Format: `!vc transfer <@user>`');
      targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    }

    if (!targetMember) return ctx.reply('❌ Member tidak ditemukan.');

    if (targetMember.voice.channelId !== channel.id) {
      return ctx.reply('❌ Member tersebut harus berada di dalam voice channel Anda untuk dijadikan owner!');
    }

    if (targetMember.id === ctx.user.id) {
      return ctx.reply('❌ Anda sudah menjadi owner room ini!');
    }

    await ctx.deferReply();

    try {
      await transferOwnership(channel, targetMember, currentOwnerId);
      await ctx.sendSuccess(`👑 Kepemilikan room berhasil dialihkan kepada <@${targetMember.id}>!`);
    } catch (error) {
      logger.error('Gagal mentransfer kepemilikan TempVC:', error);
      await ctx.sendError('Gagal mengalihkan kepemilikan room.');
    }
  },

  /**
   * Menampilkan info room
   */
  async executeInfo(ctx, channel, tempVC) {
    await ctx.deferReply();

    try {
      const everyoneOverwrite = channel.permissionOverwrites.cache.get(ctx.guild.roles.everyone.id);
      const isLocked = everyoneOverwrite?.deny.has(PermissionFlagsBits.Connect) || false;

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('🎙️ Informasi Temporary Voice Channel')
        .setDescription(`Informasi mengenai room voice yang sedang aktif.`)
        .addFields(
          { name: 'Nama Room', value: `\`${channel.name}\``, inline: true },
          { name: 'Pemilik', value: `<@${tempVC.ownerId}>`, inline: true },
          { name: 'Status Kunci', value: isLocked ? '🔒 Terkunci' : '🔓 Terbuka', inline: true },
          { name: 'Member Aktif', value: `${channel.members.size} / ${channel.userLimit === 0 ? '∞' : channel.userLimit}`, inline: true },
          { name: 'Bitrate', value: `${channel.bitrate / 1000} kbps`, inline: true },
          { name: 'Kategori', value: channel.parent ? `\`${channel.parent.name}\`` : '*Tidak ada*', inline: true }
        )
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Gagal memuat info TempVC:', error);
      await ctx.sendError('Gagal memuat informasi channel.');
    }
  }
};
