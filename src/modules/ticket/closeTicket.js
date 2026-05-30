const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Ticket = require('../../models/Ticket');
const TicketConfig = require('../../models/TicketConfig');
const { generateTranscript } = require('./generateTranscript');
const logger = require('../../utils/logger');
const { COLORS, EMOJIS } = require('../../utils/constants');
const helpers = require('../../utils/helpers');

/**
 * Memulai proses penutupan ticket (konfirmasi atau eksekusi langsung)
 * @param {import('discord.js').Interaction} interaction 
 * @param {string} reason 
 */
async function startCloseTicket(interaction, reason = 'Tidak ada alasan.') {
  const { guild, channel, user } = interaction;

  // Cari ticket berdasarkan channelId
  const ticket = await Ticket.findOne({
    where: {
      guildId: guild.id,
      channelId: channel.id,
      status: ['open', 'claimed']
    }
  });

  if (!ticket) {
    return interaction.reply({
      content: `${EMOJIS.ERROR} Channel ini bukan merupakan ticket aktif!`,
      ephemeral: true
    });
  }

  const ticketConfig = await TicketConfig.findOne({ where: { guildId: guild.id } });
  const closeConfirmation = ticketConfig ? ticketConfig.closeConfirmation : true;

  if (closeConfirmation) {
    const confirmEmbed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('🔒 Konfirmasi Penutupan Ticket')
      .setDescription('Apakah Anda yakin ingin menutup ticket ini? Tindakan ini akan mengarsipkan channel.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_confirm_close:${ticket.id}:${encodeURIComponent(reason)}`)
        .setLabel('Ya, Tutup')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_cancel_close')
        .setLabel('Batal')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      embeds: [confirmEmbed],
      components: [row]
    });
  } else {
    await executeCloseTicket(interaction, ticket, reason);
  }
}

/**
 * Mengeksekusi penutupan ticket setelah konfirmasi
 * @param {import('discord.js').Interaction} interaction 
 * @param {Object} ticketInstance 
 * @param {string} reason 
 */
async function executeCloseTicket(interaction, ticketInstance, reason) {
  const { guild, channel } = interaction;
  
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: '🔒 *Sedang memproses penutupan ticket...*', embeds: [], components: [] }).catch(() => {});
  } else {
    await interaction.reply({ content: '🔒 *Sedang memproses penutupan ticket...*' }).catch(() => {});
  }

  try {
    const ticketConfig = await TicketConfig.findOne({ where: { guildId: guild.id } });
    const archiveCategoryId = ticketConfig ? ticketConfig.archiveCategoryId : null;
    const logChannelId = ticketConfig ? ticketConfig.logChannelId : null;
    const transcriptChannelId = ticketConfig ? ticketConfig.transcriptChannelId : null;

    // 1. Update status ticket di database
    const now = new Date();
    await Ticket.update({
      status: 'done',
      closedAt: now,
      closedBy: interaction.user.id,
      reason: reason
    }, {
      where: { id: ticketInstance.id }
    });

    // 2. Cabut permission VIEW_CHANNEL untuk pembuat ticket
    const creatorMember = await guild.members.fetch(ticketInstance.userId).catch(() => null);
    if (creatorMember) {
      await channel.permissionOverwrites.edit(creatorMember, {
        ViewChannel: false
      }).catch(err => logger.error(`Gagal mencabut ViewChannel untuk user ${ticketInstance.userId}:`, err));
      
      // Kirim DM ke pembuat ticket
      const dmEmbed = new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('🎫 Ticket Ditutup')
        .setDescription(`Ticket Anda **#${ticketInstance.ticketId}** di server **${guild.name}** telah diselesaikan.`)
        .addFields([
          { name: 'Kategori', value: ticketInstance.categoryName, inline: true },
          { name: 'Ditutup Oleh', value: `${interaction.user.tag}`, inline: true },
          { name: 'Alasan', value: reason || 'Tidak ada.', inline: false }
        ])
        .setTimestamp();
      await creatorMember.send({ embeds: [dmEmbed] }).catch(() => {});
    }

    // 3. Rename channel
    const newName = ticketInstance.ticketId.replace('ticket-', 'done-');
    await channel.setName(newName).catch(err => logger.error('Gagal me-rename channel ticket:', err));

    // 4. Pindahkan ke kategori arsip jika diset
    if (archiveCategoryId) {
      const archiveCategory = guild.channels.cache.get(archiveCategoryId);
      if (archiveCategory && archiveCategory.type === 4) { // Category
        await channel.setParent(archiveCategoryId, { lockPermissions: false }).catch(err => logger.error('Gagal memindahkan channel ke category arsip:', err));
      }
    }

    // 5. Generate transcript
    let transcriptAttachment = null;
    try {
      transcriptAttachment = await generateTranscript(channel);
    } catch (err) {
      logger.error('Gagal men-generate transcript saat close ticket:', err);
    }

    // Hitung durasi ticket aktif
    const durationMs = now.getTime() - new Date(ticketInstance.createdAt).getTime();
    const durationStr = helpers.formatDuration(durationMs);

    // 6. Kirim transcript ke transcript channel jika ada
    if (transcriptChannelId && transcriptAttachment) {
      const transChannel = guild.channels.cache.get(transcriptChannelId);
      if (transChannel) {
        const transEmbed = new EmbedBuilder()
          .setColor(COLORS.INFO)
          .setTitle(`📄 Transcript Ticket — #${ticketInstance.ticketId}`)
          .addFields([
            { name: 'Pembuat', value: `<@${ticketInstance.userId}>`, inline: true },
            { name: 'Kategori', value: ticketInstance.categoryName, inline: true },
            { name: 'Durasi', value: durationStr, inline: true },
            { name: 'Ditutup Oleh', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Alasan', value: reason, inline: false }
          ])
          .setTimestamp();

        await transChannel.send({
          embeds: [transEmbed],
          files: [transcriptAttachment]
        }).catch(err => logger.error('Gagal mengirim file transcript:', err));
      }
    }

    // 7. Kirim log aktivitas
    if (logChannelId) {
      const logChannel = guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(COLORS.ERROR)
          .setTitle('🎫 Ticket Selesai (Closed)')
          .addFields([
            { name: 'Ticket ID', value: ticketInstance.ticketId, inline: true },
            { name: 'Pembuat', value: `<@${ticketInstance.userId}>`, inline: true },
            { name: 'Kategori', value: ticketInstance.categoryName, inline: true },
            { name: 'Ditutup Oleh', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
            { name: 'Durasi Aktif', value: durationStr, inline: true },
            { name: 'Alasan', value: reason, inline: false }
          ])
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }

    // Kirim konfirmasi akhir ke dalam channel itu sendiri
    const finishedEmbed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setDescription(`${EMOJIS.SUCCESS} **Ticket ini telah ditutup.**\n\n- **Ditutup oleh:** <@${interaction.user.id}>\n- **Durasi aktif:** \`${durationStr}\`\n- **Alasan:** *${reason}*\n\n*Channel ini sekarang bersifat read-only bagi staff & admin untuk arsip.*`);

    // Sediakan tombol delete channel untuk staff
    const deleteRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_delete')
        .setLabel('Hapus Channel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
    );

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: '', embeds: [finishedEmbed], components: [deleteRow] }).catch(() => {});
    } else {
      await channel.send({ embeds: [finishedEmbed], components: [deleteRow] }).catch(() => {});
    }

  } catch (error) {
    logger.error('Error saat mengeksekusi close ticket:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: `${EMOJIS.ERROR} Terjadi kesalahan internal saat menutup ticket.` }).catch(() => {});
    } else {
      await interaction.reply({ content: `${EMOJIS.ERROR} Terjadi kesalahan internal saat menutup ticket.`, ephemeral: true }).catch(() => {});
    }
  }
}

module.exports = { startCloseTicket, executeCloseTicket };
