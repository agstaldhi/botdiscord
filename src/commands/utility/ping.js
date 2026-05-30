const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Mengecek latensi dan responsivitas bot.',
  aliases: ['latency', 'p'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Mengecek latensi dan responsivitas bot.'),
  
  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const sent = await ctx.reply({ content: 'Mengecek koneksi...', fetchReply: true });
    
    // Hitung selisih waktu kirim
    const triggerTime = ctx.isSlash ? ctx.interaction.createdTimestamp : ctx.message.createdTimestamp;
    const latency = sent.createdTimestamp - triggerTime;
    const apiPing = ctx.client.ws.ping;
    
    await ctx.reply({
      content: `🏓 **Pong!**\n• Latency Bot: \`${latency}ms\`\n• API Gateway: \`${apiPing}ms\``
    });
  }
};
