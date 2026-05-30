module.exports = {
  name: 'error',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord-player').GuildQueue} queue 
   * @param {Error} error 
   */
  async execute(client, queue, error) {
    client.logger.error(`[Queue Error] Terjadi error pada antrean musik: ${error.message}`, error);
    
    try {
      if (queue.metadata && queue.metadata.channel) {
        await queue.metadata.channel.send({
          embeds: [client.embeds.error(`Terjadi kesalahan internal pada antrean musik: \`${error.message}\``)]
        }).catch(() => {});
      }
    } catch (e) {
      client.logger.error('Gagal mengirim pemberitahuan error queue:', e);
    }
  }
};
