module.exports = {
  name: 'playerError',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord-player').GuildQueue} queue 
   * @param {Error} error 
   */
  async execute(client, queue, error) {
    client.logger.error(`[Player Error] Terjadi error pada koneksi streaming: ${error.message}`, error);
    
    try {
      if (queue.metadata && queue.metadata.channel) {
        await queue.metadata.channel.send({
          embeds: [client.embeds.error(`Terjadi masalah saat streaming audio: \`${error.message}\``)]
        }).catch(() => {});
      }
    } catch (e) {
      client.logger.error('Gagal mengirim pemberitahuan error player:', e);
    }
  }
};
