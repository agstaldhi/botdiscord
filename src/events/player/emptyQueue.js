module.exports = {
  name: 'emptyQueue',
  /**
   * @param {import('../../client')} client 
   * @param {import('discord-player').GuildQueue} queue 
   */
  async execute(client, queue) {
    try {
      if (queue.metadata && queue.metadata.channel) {
        await queue.metadata.channel.send({
          embeds: [client.embeds.info('🎵 Antrean musik telah habis. Memutar dihentikan.')]
        }).catch(() => {});
      }
    } catch (error) {
      client.logger.error('Error di event emptyQueue:', error);
    }
  }
};
