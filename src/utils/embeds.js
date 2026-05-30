const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS } = require('./constants');

module.exports = {
  /**
   * Embed untuk respon sukses
   * @param {string} text 
   * @returns {EmbedBuilder}
   */
  success(text) {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setDescription(`${EMOJIS.SUCCESS} **${text}**`);
  },

  /**
   * Embed untuk respon error/gagal
   * @param {string} text 
   * @returns {EmbedBuilder}
   */
  error(text) {
    return new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setDescription(`${EMOJIS.ERROR} **${text}**`);
  },

  /**
   * Embed untuk respon info/panduan
   * @param {string} text 
   * @returns {EmbedBuilder}
   */
  info(text) {
    return new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setDescription(`${EMOJIS.INFO} ${text}`);
  },

  /**
   * Embed untuk respon warning/peringatan
   * @param {string} text 
   * @returns {EmbedBuilder}
   */
  warning(text) {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setDescription(`${EMOJIS.WARNING} ${text}`);
  },

  /**
   * Builder embed kustom dengan opsi fleksibel
   */
  create({ title, description, color, fields, author, thumbnail, image, footer, timestamp = true }) {
    const embed = new EmbedBuilder();
    
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    
    embed.setColor(color || COLORS.DEFAULT);
    
    if (fields && fields.length > 0) {
      embed.addFields(fields);
    }
    
    if (author) {
      embed.setAuthor(typeof author === 'string' ? { name: author } : author);
    }
    
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);
    
    if (footer) {
      embed.setFooter(typeof footer === 'string' ? { text: footer } : footer);
    }
    
    if (timestamp) embed.setTimestamp();
    
    return embed;
  }
};
