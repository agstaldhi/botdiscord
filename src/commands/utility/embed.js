const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { COLORS } = require('../../utils/constants');

module.exports = {
  name: 'embed',
  description: 'Membuat dan mengirim pesan embed kustom di channel ini.',
  aliases: ['buatembed'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Membuat dan mengirim pesan embed kustom di channel ini.'),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    if (ctx.isSlash) {
      // Buka Modal Builder
      const modal = new ModalBuilder()
        .setCustomId('embed_builder_modal')
        .setTitle('🎨 Embed Builder');

      const titleInput = new TextInputBuilder()
        .setCustomId('embed_title')
        .setLabel('Judul Embed (Judul)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Masukkan judul embed (opsional)')
        .setRequired(false)
        .setMaxLength(256);

      const descInput = new TextInputBuilder()
        .setCustomId('embed_description')
        .setLabel('Isi Embed (Deskripsi)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Masukkan isi pesan embed di sini')
        .setRequired(true)
        .setMaxLength(4000);

      const colorInput = new TextInputBuilder()
        .setCustomId('embed_color')
        .setLabel('Warna Embed (Hex Code)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Contoh: #5865F2')
        .setRequired(false)
        .setMaxLength(7);

      const imageInput = new TextInputBuilder()
        .setCustomId('embed_image')
        .setLabel('Gambar Embed (URL Gambar)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Contoh: https://example.com/image.png')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(colorInput),
        new ActionRowBuilder().addComponents(imageInput)
      );

      return await ctx.interaction.showModal(modal);
    } else {
      // Legacy parse: !embed Judul | Deskripsi | Warna | GambarURL
      const rawArgs = ctx.args.join(' ').split('|');
      const title = rawArgs[0]?.trim();
      const description = rawArgs[1]?.trim();
      const color = rawArgs[2]?.trim() || '#5865F2';
      const image = rawArgs[3]?.trim();

      if (!description) {
        return ctx.reply('❌ Format salah! Gunakan: `!embed Judul | Deskripsi | WarnaHex | GambarURL`\nContoh: `!embed Halo Dunia | Ini adalah pesan embed kustom pertama saya. | #5865F2`');
      }

      try {
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

        await ctx.channel.send({ embeds: [embed] });
        
        // Hapus pesan asli user jika bot punya izin
        await ctx.message.delete().catch(() => {});
      } catch (err) {
        ctx.client.logger.error('Error saat membuat embed legacy:', err);
        return ctx.reply('❌ Gagal membuat embed. Pastikan format benar.');
      }
    }
  }
};
