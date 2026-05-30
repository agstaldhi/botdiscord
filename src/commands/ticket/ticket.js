const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const TicketConfig = require('../../models/TicketConfig');
const Ticket = require('../../models/Ticket');
const { createTicket } = require('../../modules/ticket/createTicket');
const { startCloseTicket } = require('../../modules/ticket/closeTicket');
const { generateTranscript } = require('../../modules/ticket/generateTranscript');
const logger = require('../../utils/logger');
const permissions = require('../../utils/permissions');
const { COLORS, EMOJIS } = require('../../utils/constants');

module.exports = {
  name: 'ticket',
  description: 'Sistem manajemen ticket bantuan server.',
  aliases: ['tkt'],
  cooldown: 3,
  category: 'ticket',
  slashData: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Sistem manajemen ticket bantuan server.')
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('Membuat panel ticket di channel tertentu.')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel tempat mengirim panel ticket.')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption(opt =>
          opt
            .setName('title')
            .setDescription('Judul panel ticket.')
        )
        .addStringOption(opt =>
          opt
            .setName('description')
            .setDescription('Deskripsi penjelasan panel ticket.')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('close')
        .setDescription('Menutup ticket aktif.')
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Alasan menutup ticket.')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('claim')
        .setDescription('Mengklaim ticket untuk dikerjakan (Staff only).')
    )
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Menambahkan user ke ticket aktif (Staff only).')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User yang ingin ditambahkan.')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Menghapus user dari ticket aktif (Staff only).')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User yang ingin dihapus.')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('transcript')
        .setDescription('Membuat transcript pesan ticket saat ini (Staff only).')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const subcommand = ctx.isSlash ? ctx.interaction.options.getSubcommand() : (ctx.args[0] ? ctx.args[0].toLowerCase() : null);

    if (!subcommand) {
      return ctx.reply('❌ Gunakan salah satu subcommand berikut: `setup`, `close`, `claim`, `add`, `remove`, `transcript`.');
    }

    switch (subcommand) {
      case 'setup':
        return await this.executeSetup(ctx);
      case 'close':
        return await this.executeClose(ctx);
      case 'claim':
        return await this.executeClaim(ctx);
      case 'add':
        return await this.executeAdd(ctx);
      case 'remove':
        return await this.executeRemove(ctx);
      case 'transcript':
        return await this.executeTranscript(ctx);
      default:
        return ctx.reply(`❌ Subcommand \`${subcommand}\` tidak dikenal.`);
    }
  },

  /**
   * Setup panel ticket
   */
  async executeSetup(ctx) {
    // Cek izin (ADMINISTRATOR atau Bot Manager)
    const settings = await ctx.client.helpers.getSettings(ctx.guild.id);
    if (!permissions.isBotManager(ctx.member, settings)) {
      return ctx.reply('❌ Anda tidak memiliki izin untuk melakukan setup ticket!');
    }

    let channel, title, description;

    if (ctx.isSlash) {
      channel = ctx.interaction.options.getChannel('channel');
      title = ctx.interaction.options.getString('title') || '📬 Hubungi Bantuan Staff';
      description = ctx.interaction.options.getString('description') || 'Silakan pilih kategori bantuan di bawah ini untuk membuka ticket bantuan baru.';
    } else {
      channel = ctx.message.mentions.channels.first();
      if (!channel) return ctx.reply('❌ Format salah! Gunakan: `!ticket setup <#channel> [judul] | [deskripsi]`');
      
      const restArgs = ctx.args.slice(2).join(' ').split('|');
      title = restArgs[0]?.trim() || '📬 Hubungi Bantuan Staff';
      description = restArgs[1]?.trim() || 'Silakan pilih kategori bantuan di bawah ini untuk membuka ticket bantuan baru.';
    }

    await ctx.deferReply();

    try {
      let ticketConfig = await TicketConfig.findOne({ where: { guildId: ctx.guild.id } });
      if (!ticketConfig) {
        ticketConfig = await TicketConfig.create({ guildId: ctx.guild.id });
      }

      // Inisialisasi default category jika kosong
      let categories = ticketConfig.categories || [];
      if (categories.length === 0) {
        categories = [
          {
            id: 'support_default',
            name: 'Dukungan Umum',
            emoji: '🛠️',
            description: 'Untuk masalah atau pertanyaan umum.',
            staffRoles: [],
            categoryId: null,
            pingStaff: false,
            welcomeMessage: 'Halo! Staff kami akan segera melayani Anda. Silakan jelaskan masalah Anda.'
          }
        ];
        await TicketConfig.update({ categories, enabled: true }, { where: { guildId: ctx.guild.id } });
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(ctx.guild.iconURL({ dynamic: true }))
        .setFooter({ text: 'Sistem Ticket MonoHex', iconURL: ctx.client.user.displayAvatarURL() })
        .setTimestamp();

      const row = new ActionRowBuilder();
      categories.forEach(cat => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_open:${cat.id}`)
            .setLabel(cat.name)
            .setEmoji(cat.emoji || '🎫')
            .setStyle(ButtonStyle.Primary)
        );
      });

      await channel.send({ embeds: [embed], components: [row] });
      await ctx.sendSuccess(`Panel ticket berhasil dikirim di <#${channel.id}>!`);

    } catch (error) {
      logger.error('Error saat setup panel ticket:', error);
      await ctx.sendError('Gagal melakukan setup panel ticket.');
    }
  },

  /**
   * Menutup ticket aktif
   */
  async executeClose(ctx) {
    let reason = 'Tidak ada alasan.';
    if (ctx.isSlash) {
      reason = ctx.interaction.options.getString('reason') || reason;
    } else {
      reason = ctx.args.slice(1).join(' ') || reason;
    }

    // Cek apakah channel saat ini adalah ticket
    const ticket = await Ticket.findOne({
      where: {
        guildId: ctx.guild.id,
        channelId: ctx.channel.id,
        status: ['open', 'claimed']
      }
    });

    if (!ticket) {
      return ctx.reply('❌ Perintah ini hanya bisa digunakan di dalam channel ticket aktif!');
    }

    // Cek apakah member pembuat atau staff
    const isCreator = ctx.user.id === ticket.userId;
    const isStaff = await checkIsStaff(ctx.member, ticket, ctx.guild.id);

    if (!isCreator && !isStaff) {
      return ctx.reply('❌ Anda tidak memiliki izin untuk menutup ticket ini!');
    }

    await startCloseTicket(ctx.isSlash ? ctx.interaction : ctx.message, reason);
  },

  /**
   * Mengklaim ticket (Staff only)
   */
  async executeClaim(ctx) {
    const ticket = await Ticket.findOne({
      where: {
        guildId: ctx.guild.id,
        channelId: ctx.channel.id,
        status: 'open'
      }
    });

    if (!ticket) {
      return ctx.reply('❌ Ticket ini tidak tersedia untuk diklaim (sudah diklaim atau ditutup).');
    }

    const isStaff = await checkIsStaff(ctx.member, ticket, ctx.guild.id);
    if (!isStaff) {
      return ctx.reply('❌ Hanya staff pendukung yang dapat mengklaim ticket ini!');
    }

    await ctx.deferReply();

    try {
      await Ticket.update({
        status: 'claimed',
        claimedBy: ctx.user.id
      }, {
        where: { id: ticket.id }
      });

      // Update channel name to indicate claimed status
      const cleanName = ctx.channel.name.replace('ticket-', '');
      await ctx.channel.setName(`⚡-${cleanName}-${ctx.user.username.substring(0, 10)}`).catch(() => {});

      const claimEmbed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setDescription(`👤 **Ticket telah diklaim oleh <@${ctx.user.id}>.**\nDia sekarang akan membantu Anda menyelesaikan masalah ini.`);

      await ctx.reply({ embeds: [claimEmbed] });

      // Update welcome message buttons to reflect claimed state if possible
      // (Bisa opsional, tapi minimal kirim pesan ini)
    } catch (error) {
      logger.error('Error saat claim ticket:', error);
      await ctx.sendError('Gagal mengklaim ticket.');
    }
  },

  /**
   * Menambahkan user ke ticket
   */
  async executeAdd(ctx) {
    const ticket = await Ticket.findOne({
      where: {
        guildId: ctx.guild.id,
        channelId: ctx.channel.id,
        status: ['open', 'claimed']
      }
    });

    if (!ticket) {
      return ctx.reply('❌ Saluran ini bukan merupakan ticket aktif!');
    }

    const isStaff = await checkIsStaff(ctx.member, ticket, ctx.guild.id);
    if (!isStaff) {
      return ctx.reply('❌ Hanya staff yang diperbolehkan menambahkan pengguna ke ticket!');
    }

    let targetUser;
    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('user');
    } else {
      targetUser = ctx.message.mentions.users.first();
      if (!targetUser) return ctx.reply('❌ Format salah! Gunakan: `!ticket add <@user>`');
    }

    await ctx.deferReply();

    try {
      // Edit permission channel
      await ctx.channel.permissionOverwrites.edit(targetUser, {
        ViewChannel: true,
        SendMessages: true,
        AttachFiles: true,
        ReadMessageHistory: true
      });

      // Update participants list in database
      const participants = ticket.participants || [];
      if (!participants.includes(targetUser.id)) {
        participants.push(targetUser.id);
        await Ticket.update({ participants }, { where: { id: ticket.id } });
      }

      await ctx.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setDescription(`${EMOJIS.SUCCESS} <@${targetUser.id}> berhasil ditambahkan ke ticket ini.`)
        ]
      });
    } catch (error) {
      logger.error('Gagal menambahkan user ke ticket:', error);
      await ctx.sendError('Gagal menambahkan user ke ticket.');
    }
  },

  /**
   * Menghapus user dari ticket
   */
  async executeRemove(ctx) {
    const ticket = await Ticket.findOne({
      where: {
        guildId: ctx.guild.id,
        channelId: ctx.channel.id,
        status: ['open', 'claimed']
      }
    });

    if (!ticket) {
      return ctx.reply('❌ Saluran ini bukan merupakan ticket aktif!');
    }

    const isStaff = await checkIsStaff(ctx.member, ticket, ctx.guild.id);
    if (!isStaff) {
      return ctx.reply('❌ Hanya staff yang diperbolehkan menghapus pengguna dari ticket!');
    }

    let targetUser;
    if (ctx.isSlash) {
      targetUser = ctx.interaction.options.getUser('user');
    } else {
      targetUser = ctx.message.mentions.users.first();
      if (!targetUser) return ctx.reply('❌ Format salah! Gunakan: `!ticket remove <@user>`');
    }

    if (targetUser.id === ticket.userId) {
      return ctx.reply('❌ Anda tidak bisa menghapus pembuat ticket dari ticketnya sendiri!');
    }

    await ctx.deferReply();

    try {
      // Hapus permission
      await ctx.channel.permissionOverwrites.delete(targetUser);

      // Update DB
      const participants = ticket.participants || [];
      const index = participants.indexOf(targetUser.id);
      if (index > -1) {
        participants.splice(index, 1);
        await Ticket.update({ participants }, { where: { id: ticket.id } });
      }

      await ctx.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setDescription(`${EMOJIS.SUCCESS} <@${targetUser.id}> berhasil dihapus dari ticket ini.`)
        ]
      });
    } catch (error) {
      logger.error('Gagal menghapus user dari ticket:', error);
      await ctx.sendError('Gagal menghapus user dari ticket.');
    }
  },

  /**
   * Membuat transcript manual
   */
  async executeTranscript(ctx) {
    const ticket = await Ticket.findOne({
      where: {
        guildId: ctx.guild.id,
        channelId: ctx.channel.id
      }
    });

    if (!ticket) {
      return ctx.reply('❌ Perintah ini hanya bisa digunakan di dalam channel ticket!');
    }

    const isStaff = await checkIsStaff(ctx.member, ticket, ctx.guild.id);
    if (!isStaff) {
      return ctx.reply('❌ Hanya staff yang diperbolehkan men-generate transcript!');
    }

    await ctx.deferReply();

    try {
      const attachment = await generateTranscript(ctx.channel);
      await ctx.reply({
        content: `📄 **Transcript untuk channel #${ctx.channel.name} berhasil dibuat.**`,
        files: [attachment]
      });
    } catch (error) {
      logger.error('Gagal men-generate transcript:', error);
      await ctx.sendError('Gagal membuat transcript.');
    }
  }
};

/**
 * Cek apakah member adalah staff pendukung
 * @param {import('discord.js').GuildMember} member 
 * @param {Object} ticketInstance 
 * @param {string} guildId 
 * @returns {Promise<boolean>}
 */
async function checkIsStaff(member, ticketInstance, guildId) {
  if (permissions.isBotOwner(member.user)) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  const ticketConfig = await TicketConfig.findOne({ where: { guildId } });
  if (!ticketConfig) return false;

  const category = ticketConfig.categories.find(c => c.name === ticketInstance.categoryName);
  if (!category || !category.staffRoles || category.staffRoles.length === 0) return false;

  return member.roles.cache.some(role => category.staffRoles.includes(role.id));
}
