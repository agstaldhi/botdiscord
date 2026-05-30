const { EmbedBuilder } = require('discord.js');

class CommandContext {
  /**
   * @param {import('../client')} client 
   * @param {import('discord.js').ChatInputCommandInteraction|import('discord.js').Message} interactionOrMessage 
   * @param {string[]} args 
   */
  constructor(client, interactionOrMessage, args = []) {
    this.client = client;
    this.args = args;
    
    // Deteksi jenis trigger (Slash Command atau Prefix Message)
    if (interactionOrMessage.isCommand && interactionOrMessage.isCommand()) {
      this.interaction = interactionOrMessage;
      this.message = null;
      this.isSlash = true;
      this.user = interactionOrMessage.user;
      this.member = interactionOrMessage.member;
      this.guild = interactionOrMessage.guild;
      this.channel = interactionOrMessage.channel;
    } else {
      this.interaction = null;
      this.message = interactionOrMessage;
      this.isSlash = false;
      this.user = interactionOrMessage.author;
      this.member = interactionOrMessage.member;
      this.guild = interactionOrMessage.guild;
      this.channel = interactionOrMessage.channel;
    }
  }

  /**
   * Kirim balasan/respon ke user (menangani reply, followUp, atau editReply secara otomatis)
   * @param {string|import('discord.js').InteractionReplyOptions|import('discord.js').MessageReplyOptions} options 
   * @returns {Promise<import('discord.js').Message>}
   */
  async reply(options) {
    if (typeof options === 'string') {
      options = { content: options };
    }

    if (this.isSlash) {
      if (this.interaction.replied || this.interaction.deferred) {
        return await this.interaction.editReply(options);
      }
      return await this.interaction.reply(options);
    } else {
      return await this.message.reply(options);
    }
  }

  /**
   * Defer respon (berguna jika eksekusi command butuh waktu lebih dari 3 detik)
   * @param {boolean} [ephemeral=false] 
   */
  async deferReply(ephemeral = false) {
    if (this.isSlash) {
      return await this.interaction.deferReply({ ephemeral });
    } else {
      if (this.channel && typeof this.channel.sendTyping === 'function') {
        await this.channel.sendTyping();
      }
    }
  }

  /**
   * Kirim pesan sukses berstandar
   * @param {string} text 
   * @returns {Promise<import('discord.js').Message>}
   */
  async sendSuccess(text) {
    const embed = this.client.embeds.success(text);
    return await this.reply({ embeds: [embed] });
  }

  /**
   * Kirim pesan error berstandar
   * @param {string} text 
   * @returns {Promise<import('discord.js').Message>}
   */
  async sendError(text) {
    const embed = this.client.embeds.error(text);
    return await this.reply({ embeds: [embed] });
  }
}

module.exports = CommandContext;
