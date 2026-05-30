const { Collection, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const CommandContext = require('../../utils/CommandContext');
const logger = require('../../utils/logger');
const permissions = require('../../utils/permissions');
const helpers = require('../../utils/helpers');
const { COLORS, EMOJIS } = require('../../utils/constants');

module.exports = {
  name: 'interactionCreate',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord.js').Interaction} interaction 
   */
  async execute(client, interaction) {
    // 1. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Inisialisasi wrapper context
      const ctx = new CommandContext(client, interaction);

      // Cek Guild Only (Umumnya hampir semua modul MonoHex membutuhkan Guild)
      const nonGuildCategories = ['utility', 'fun'];
      if (!interaction.guild && !nonGuildCategories.includes(command.category)) {
        return ctx.reply({
          content: '❌ Command ini hanya dapat digunakan di dalam server Discord!',
          ephemeral: true
        });
      }

      // Cek whitelist/blacklist channel jika bukan admin
      if (interaction.guild && !permissions.isBotOwner(interaction.user) && !interaction.member.permissions.has('Administrator')) {
        const settings = await helpers.getSettings(interaction.guildId);
        
        // Pengecekan ignored channels (blacklist global bot)
        if (settings.ignoredChannels && settings.ignoredChannels.includes(interaction.channelId)) {
          return ctx.reply({
            content: '❌ Bot dinonaktifkan di channel ini.',
            ephemeral: true
          });
        }

        // Pengecekan allowed channels untuk bot commands secara umum
        if (settings.allowedChannels && settings.allowedChannels.commands && settings.allowedChannels.commands.length > 0) {
          if (!settings.allowedChannels.commands.includes(interaction.channelId)) {
            // Jika ada whitelist channel, command hanya boleh jalan di channel tersebut
            const channelMentions = settings.allowedChannels.commands.map(id => `<#${id}>`).join(', ');
            return ctx.reply({
              content: `❌ Command hanya dapat dijalankan di channel berikut: ${channelMentions}`,
              ephemeral: true
            });
          }
        }
      }

      // Pengecekan khusus kategori musik (channel lock & DJ role)
      if (command.category === 'music' && interaction.guild) {
        const MusicConfig = require('../../models/MusicConfig');
        const musicConfig = await MusicConfig.findOne({ where: { guildId: interaction.guildId } }).catch(() => null);
        
        // 1. Validasi Channel Musik khusus
        if (musicConfig && musicConfig.musicChannelId && interaction.channelId !== musicConfig.musicChannelId) {
          return ctx.reply({
            content: `❌ Perintah musik hanya diperbolehkan di channel khusus musik: <#${musicConfig.musicChannelId}>`,
            ephemeral: true
          });
        }

        // 2. Validasi DJ Role untuk perintah kontrol musik
        const controlCommands = ['pause', 'resume', 'stop', 'skip', 'volume', 'loop', 'shuffle', 'remove', 'move', 'seek', 'filter', '247'];
        if (controlCommands.includes(command.name)) {
          if (!permissions.isDJ(interaction.member, musicConfig)) {
            return ctx.reply({
              content: '❌ Anda memerlukan role DJ atau hak Administrator untuk mengontrol pemutaran musik!',
              ephemeral: true
            });
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

      if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          return ctx.reply({
            content: `⏳ Silakan tunggu \`${timeLeft.toFixed(1)}s\` sebelum menggunakan command \`${command.name}\` kembali.`,
            ephemeral: true
          });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      // Cek Hak Akses Bot Manager untuk Kategori Config
      if (command.category === 'config' && interaction.guild) {
        const settings = await helpers.getSettings(interaction.guildId);
        if (!permissions.isBotManager(interaction.member, settings)) {
          return ctx.reply({
            content: '❌ Anda tidak memiliki hak akses sebagai **Bot Manager** atau **Administrator** untuk mengkonfigurasi bot!',
            ephemeral: true
          });
        }
      }

      // Eksekusi Command
      try {
        await command.execute(ctx);
      } catch (error) {
        logger.error(`Error saat mengeksekusi command /${command.name}:`, error);
        
        const errorMsg = '❌ Terjadi kesalahan internal saat memproses command ini.';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMsg, ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
        }
      }
    }
    
    // 2. Handle Button Interactions
    if (interaction.isButton()) {
      const customId = interaction.customId;
      
      // A. Open ticket button (from panel)
      if (customId.startsWith('ticket_open:')) {
        const categoryId = customId.split(':')[1];
        
        const modal = new ModalBuilder()
          .setCustomId(`ticket_create_modal:${categoryId}`)
          .setTitle('🎫 Buka Ticket Bantuan');

        const subjectInput = new TextInputBuilder()
          .setCustomId('ticket_subject')
          .setLabel('Subjek Masalah')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Masukkan judul singkat masalah Anda')
          .setRequired(true)
          .setMaxLength(100);

        const descInput = new TextInputBuilder()
          .setCustomId('ticket_description')
          .setLabel('Deskripsi Masalah')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Jelaskan detail masalah yang Anda alami secara rinci')
          .setRequired(true)
          .setMaxLength(1000);

        modal.addComponents(
          new ActionRowBuilder().addComponents(subjectInput),
          new ActionRowBuilder().addComponents(descInput)
        );

        return await interaction.showModal(modal);
      }

      // B. Close ticket button
      if (customId === 'ticket_close') {
        const Ticket = require('../../models/Ticket');
        const ticket = await Ticket.findOne({ where: { guildId: interaction.guildId, channelId: interaction.channelId, status: ['open', 'claimed'] } });
        if (!ticket) return interaction.reply({ content: '❌ Ticket aktif tidak ditemukan!', ephemeral: true });

        // Cek izin (pembuat ticket atau staff)
        const checkIsStaff = async (member, ticketInstance) => {
          if (permissions.isBotOwner(member.user)) return true;
          if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
          const TicketConfig = require('../../models/TicketConfig');
          const ticketConfig = await TicketConfig.findOne({ where: { guildId: member.guild.id } });
          if (!ticketConfig) return false;
          const category = ticketConfig.categories.find(c => c.name === ticketInstance.categoryName);
          if (!category || !category.staffRoles || category.staffRoles.length === 0) return false;
          return member.roles.cache.some(role => category.staffRoles.includes(role.id));
        };

        const isCreator = interaction.user.id === ticket.userId;
        const isStaff = await checkIsStaff(interaction.member, ticket);
        if (!isCreator && !isStaff) {
          return interaction.reply({ content: '❌ Anda tidak memiliki izin untuk menutup ticket ini!', ephemeral: true });
        }

        const { startCloseTicket } = require('../../modules/ticket/closeTicket');
        return await startCloseTicket(interaction);
      }

      // C. Claim ticket button
      if (customId === 'ticket_claim') {
        const Ticket = require('../../models/Ticket');
        const ticket = await Ticket.findOne({ where: { guildId: interaction.guildId, channelId: interaction.channelId, status: 'open' } });
        if (!ticket) return interaction.reply({ content: '❌ Ticket ini sudah diklaim atau ditutup!', ephemeral: true });

        // Cek staff
        const TicketConfig = require('../../models/TicketConfig');
        const ticketConfig = await TicketConfig.findOne({ where: { guildId: interaction.guildId } });
        const category = ticketConfig ? ticketConfig.categories.find(c => c.name === ticket.categoryName) : null;
        const isStaff = permissions.isBotOwner(interaction.user) || 
                        interaction.member.permissions.has(PermissionFlagsBits.Administrator) || 
                        (category && category.staffRoles && interaction.member.roles.cache.some(r => category.staffRoles.includes(r.id)));

        if (!isStaff) return interaction.reply({ content: '❌ Hanya staff pendukung yang dapat mengklaim ticket ini!', ephemeral: true });

        try {
          await Ticket.update({ status: 'claimed', claimedBy: interaction.user.id }, { where: { id: ticket.id } });
          const cleanName = interaction.channel.name.replace('ticket-', '');
          await interaction.channel.setName(`⚡-${cleanName}-${interaction.user.username.substring(0, 10)}`).catch(() => {});
          
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.SUCCESS)
                .setDescription(`👤 **Ticket telah diklaim oleh <@${interaction.user.id}>.**\nDia sekarang akan membantu Anda menyelesaikan masalah ini.`)
            ]
          });
        } catch (err) {
          logger.error('Error saat claim ticket via button:', err);
          return interaction.reply({ content: '❌ Gagal mengklaim ticket.', ephemeral: true });
        }
      }

      // D. Add User button
      if (customId === 'ticket_add_user') {
        const Ticket = require('../../models/Ticket');
        const ticket = await Ticket.findOne({ where: { guildId: interaction.guildId, channelId: interaction.channelId, status: ['open', 'claimed'] } });
        if (!ticket) return interaction.reply({ content: '❌ Ticket aktif tidak ditemukan!', ephemeral: true });

        // Cek staff
        const TicketConfig = require('../../models/TicketConfig');
        const ticketConfig = await TicketConfig.findOne({ where: { guildId: interaction.guildId } });
        const category = ticketConfig ? ticketConfig.categories.find(c => c.name === ticket.categoryName) : null;
        const isStaff = permissions.isBotOwner(interaction.user) || 
                        interaction.member.permissions.has(PermissionFlagsBits.Administrator) || 
                        (category && category.staffRoles && interaction.member.roles.cache.some(r => category.staffRoles.includes(r.id)));

        if (!isStaff) return interaction.reply({ content: '❌ Hanya staff yang diperbolehkan menambahkan user!', ephemeral: true });

        // Show Modal to enter User ID
        const modal = new ModalBuilder()
          .setCustomId('ticket_add_user_modal')
          .setTitle('➕ Tambah User ke Ticket');

        const userInput = new TextInputBuilder()
          .setCustomId('user_id_input')
          .setLabel('ID Pengguna Discord')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Masukkan ID pengguna (angka)')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(userInput));
        return await interaction.showModal(modal);
      }

      // E. Transcript button
      if (customId === 'ticket_transcript') {
        const Ticket = require('../../models/Ticket');
        const ticket = await Ticket.findOne({ where: { guildId: interaction.guildId, channelId: interaction.channelId } });
        if (!ticket) return interaction.reply({ content: '❌ Ticket tidak ditemukan!', ephemeral: true });

        const TicketConfig = require('../../models/TicketConfig');
        const ticketConfig = await TicketConfig.findOne({ where: { guildId: interaction.guildId } });
        const category = ticketConfig ? ticketConfig.categories.find(c => c.name === ticket.categoryName) : null;
        const isStaff = permissions.isBotOwner(interaction.user) || 
                        interaction.member.permissions.has(PermissionFlagsBits.Administrator) || 
                        (category && category.staffRoles && interaction.member.roles.cache.some(r => category.staffRoles.includes(r.id)));

        if (!isStaff) return interaction.reply({ content: '❌ Hanya staff yang diperbolehkan mengambil transcript!', ephemeral: true });

        await interaction.deferReply();
        try {
          const { generateTranscript } = require('../../modules/ticket/generateTranscript');
          const attachment = await generateTranscript(interaction.channel);
          return await interaction.editReply({
            content: `📄 **Transcript untuk channel #${interaction.channel.name} berhasil dibuat.**`,
            files: [attachment]
          });
        } catch (err) {
          logger.error('Error saat transcript via button:', err);
          return interaction.editReply({ content: '❌ Gagal membuat transcript.' });
        }
      }

      // F. Confirm Close button
      if (customId.startsWith('ticket_confirm_close:')) {
        const parts = customId.split(':');
        const ticketDbId = parts[1];
        const reason = decodeURIComponent(parts[2] || 'Tidak ada alasan.');

        const Ticket = require('../../models/Ticket');
        const ticket = await Ticket.findByPk(ticketDbId);
        if (!ticket) return interaction.reply({ content: '❌ Data ticket tidak ditemukan di database!', ephemeral: true });

        const { executeCloseTicket } = require('../../modules/ticket/closeTicket');
        return await executeCloseTicket(interaction, ticket, reason);
      }

      // G. Cancel Close button
      if (customId === 'ticket_cancel_close') {
        return await interaction.update({
          content: '❌ Penutupan ticket dibatalkan.',
          embeds: [],
          components: []
        });
      }

      // H. Delete Ticket Channel button
      if (customId === 'ticket_delete') {
        const isStaff = permissions.isBotOwner(interaction.user) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!isStaff) return interaction.reply({ content: '❌ Hanya Administrator yang diperbolehkan menghapus channel ini!', ephemeral: true });

        await interaction.reply({ content: '🗑️ *Menghapus saluran dalam 5 detik...*' });
        setTimeout(async () => {
          await interaction.channel.delete().catch(err => logger.error('Gagal menghapus channel ticket:', err));
        }, 5000);
      }

      // I. Reset XP All Confirm button
      if (customId === 'confirm_reset_all_xp') {
        const UserXP = require('../../models/UserXP');
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) && !permissions.isBotOwner(interaction.user)) {
          return interaction.reply({ content: '❌ Anda tidak memiliki izin untuk mengkonfirmasi reset XP server!', ephemeral: true });
        }
        try {
          await UserXP.destroy({ where: { guildId: interaction.guildId } });
          return await interaction.update({
            content: '✅ **Seluruh data leveling server ini telah berhasil di-reset.**',
            embeds: [],
            components: []
          });
        } catch (err) {
          logger.error('Error saat mereset seluruh XP server via tombol:', err);
          return interaction.reply({ content: '❌ Gagal mereset data leveling server.', ephemeral: true });
        }
      }

      // J. Reset XP Cancel button
      if (customId === 'cancel_reset_all_xp') {
        return await interaction.update({
          content: '❌ Aksi reset data leveling server dibatalkan.',
          embeds: [],
          components: []
        });
      }
    }

    // 3. Handle Modal Submissions
    if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      if (customId.startsWith('ticket_create_modal:')) {
        const categoryId = customId.split(':')[1];
        const subject = interaction.fields.getTextInputValue('ticket_subject');
        const description = interaction.fields.getTextInputValue('ticket_description');

        const { createTicket } = require('../../modules/ticket/createTicket');
        return await createTicket(interaction, categoryId, subject, description);
      }

      if (customId === 'ticket_add_user_modal') {
        const userId = interaction.fields.getTextInputValue('user_id_input').trim();
        const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
        
        if (!targetMember) {
          return interaction.reply({ content: '❌ Pengguna tidak ditemukan di server ini!', ephemeral: true });
        }

        try {
          await interaction.channel.permissionOverwrites.edit(targetMember, {
            ViewChannel: true,
            SendMessages: true,
            AttachFiles: true,
            ReadMessageHistory: true
          });

          const Ticket = require('../../models/Ticket');
          const ticket = await Ticket.findOne({ where: { guildId: interaction.guildId, channelId: interaction.channelId } });
          if (ticket) {
            const participants = ticket.participants || [];
            if (!participants.includes(targetMember.id)) {
              participants.push(targetMember.id);
              await Ticket.update({ participants }, { where: { id: ticket.id } });
            }
          }

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.SUCCESS)
                .setDescription(`${EMOJIS.SUCCESS} <@${targetMember.id}> berhasil ditambahkan ke ticket ini.`)
            ]
          });
        } catch (err) {
          logger.error('Error saat menambah user via modal:', err);
          return interaction.reply({ content: '❌ Gagal menambahkan user ke ticket.', ephemeral: true });
        }
      }

      if (customId === 'embed_builder_modal') {
        const title = interaction.fields.getTextInputValue('embed_title');
        const description = interaction.fields.getTextInputValue('embed_description');
        const color = interaction.fields.getTextInputValue('embed_color') || '#5865F2';
        const image = interaction.fields.getTextInputValue('embed_image');

        const embed = new EmbedBuilder()
          .setDescription(description)
          .setTimestamp();
        
        if (title) embed.setTitle(title);
        
        try {
          embed.setColor(color);
        } catch (e) {
          embed.setColor('#5865F2');
        }

        if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
          embed.setImage(image);
        }

        await interaction.channel.send({ embeds: [embed] });
        return await interaction.reply({ content: '✅ Embed berhasil dikirim!', ephemeral: true });
      }
    }
  }
};
