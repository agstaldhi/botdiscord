const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketConfig = require('../../models/TicketConfig');
const Ticket = require('../../models/Ticket');
const logger = require('../../utils/logger');
const { COLORS, EMOJIS } = require('../../utils/constants');

/**
 * Membuat ticket baru untuk user
 * @param {import('discord.js').Interaction} interaction 
 * @param {string} categoryId 
 * @param {string} title 
 * @param {string} description 
 */
async function createTicket(interaction, categoryId, title, description) {
  const { guild, user } = interaction;

  // Ambil konfigurasi ticket
  let ticketConfig = await TicketConfig.findOne({ where: { guildId: guild.id } });
  if (!ticketConfig) {
    ticketConfig = await TicketConfig.create({ guildId: guild.id });
  }

  if (!ticketConfig.enabled) {
    return interaction.reply({
      content: `${EMOJIS.ERROR} **Sistem ticket dinonaktifkan di server ini.**`,
      ephemeral: true
    });
  }

  const category = ticketConfig.categories.find(c => c.id === categoryId);
  if (!category) {
    return interaction.reply({
      content: `${EMOJIS.ERROR} **Kategori ticket tidak ditemukan.**`,
      ephemeral: true
    });
  }

  // Cek apakah user sudah memiliki ticket aktif
  const existingTicket = await Ticket.findOne({
    where: {
      guildId: guild.id,
      userId: user.id,
      status: ['open', 'claimed']
    }
  });

  if (existingTicket) {
    return interaction.reply({
      content: `${EMOJIS.ERROR} Anda sudah memiliki ticket aktif yang belum diselesaikan: <#${existingTicket.channelId}>`,
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Increment ticket counter
    const counter = ticketConfig.ticketCounter + 1;
    await TicketConfig.update({ ticketCounter: counter }, { where: { guildId: guild.id } });

    const ticketIdStr = `ticket-${String(counter).padStart(4, '0')}`;

    // Setup permissions
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory
        ]
      },
      {
        id: guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels
        ]
      }
    ];

    // Tambah staff roles permission
    if (category.staffRoles && category.staffRoles.length > 0) {
      category.staffRoles.forEach(roleId => {
        const role = guild.roles.cache.get(roleId);
        if (role) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages
            ]
          });
        }
      });
    }

    // Create channel
    const channelOptions = {
      name: ticketIdStr,
      type: ChannelType.GuildText,
      permissionOverwrites
    };

    if (category.categoryId) {
      channelOptions.parent = category.categoryId;
    }

    const ticketChannel = await guild.channels.create(channelOptions);

    // Save ticket to DB
    await Ticket.create({
      ticketId: ticketIdStr,
      guildId: guild.id,
      userId: user.id,
      channelId: ticketChannel.id,
      categoryName: category.name,
      status: 'open'
    });

    // Buat welcome embed di channel ticket
    const welcomeEmbed = new EmbedBuilder()
      .setColor(COLORS.DEFAULT)
      .setTitle(`🎫 Ticket #${String(counter).padStart(4, '0')}`)
      .setDescription(category.welcomeMessage || 'Silakan sampaikan masalah Anda di sini. Staff kami akan segera membantu Anda.')
      .addFields([
        { name: 'Pembuat', value: `<@${user.id}>`, inline: true },
        { name: 'Kategori', value: `${category.emoji || '📬'} ${category.name}`, inline: true },
        { name: 'Subjek', value: title || '*Tidak ada*', inline: false },
        { name: 'Deskripsi', value: description || '*Tidak ada*', inline: false }
      ])
      .setTimestamp();

    // Buat tombol kontrol
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Claim')
        .setStyle(ButtonStyle.Success)
        .setEmoji('👤'),
      new ButtonBuilder()
        .setCustomId('ticket_add_user')
        .setLabel('Add User')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➕'),
      new ButtonBuilder()
        .setCustomId('ticket_transcript')
        .setLabel('Transcript')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📄')
    );

    // Kirim welcome message & ping staff jika diaktifkan
    let pingMsg = '';
    if (category.pingStaff && category.staffRoles && category.staffRoles.length > 0) {
      pingMsg = category.staffRoles.map(roleId => `<@&${roleId}>`).join(' ');
    }

    if (pingMsg) {
      await ticketChannel.send({ content: pingMsg, embeds: [welcomeEmbed], components: [row] });
    } else {
      await ticketChannel.send({ embeds: [welcomeEmbed], components: [row] });
    }

    // Balas di interaction awal
    await interaction.editReply({
      content: `${EMOJIS.SUCCESS} Ticket Anda telah berhasil dibuat di <#${ticketChannel.id}>`
    });

    // Kirim log aktivitas
    if (ticketConfig.logChannelId) {
      const logChannel = guild.channels.cache.get(ticketConfig.logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('🎫 Ticket Dibuat')
          .addFields([
            { name: 'Ticket ID', value: ticketIdStr, inline: true },
            { name: 'Pembuat', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'Kategori', value: category.name, inline: true },
            { name: 'Channel', value: `<#${ticketChannel.id}>`, inline: true }
          ])
          .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }

  } catch (error) {
    logger.error('Error saat membuat ticket:', error);
    await interaction.editReply({
      content: `${EMOJIS.ERROR} Terjadi kesalahan internal saat membuat channel ticket.`
    });
  }
}

module.exports = { createTicket };
