const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'purge',
  description: 'Menghapus beberapa pesan sekaligus di channel.',
  aliases: ['clear', 'clean', 'hapuspesan'],
  cooldown: 3,
  category: 'moderation',
  slashData: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Menghapus beberapa pesan sekaligus di channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt => 
      opt.setName('amount')
        .setDescription('Jumlah pesan yang ingin dihapus (1-100).')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addStringOption(opt =>
      opt.setName('filter')
        .setDescription('Filter tipe pesan yang ingin dihapus.')
        .setRequired(false)
        .addChoices(
          { name: 'Semua Pesan', value: 'all' },
          { name: 'Pesan Bot saja', value: 'bots' },
          { name: 'Pesan Manusia saja', value: 'humans' }
        )
    )
    .addUserOption(opt => 
      opt.setName('user')
        .setDescription('Hanya hapus pesan dari user spesifik ini.')
        .setRequired(false)
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    let amount;
    let filter = 'all';
    let filterUser = null;

    if (ctx.isSlash) {
      amount = ctx.interaction.options.getInteger('amount');
      filter = ctx.interaction.options.getString('filter') || 'all';
      filterUser = ctx.interaction.options.getUser('user');
    } else {
      amount = parseInt(ctx.args[0]);
      if (isNaN(amount) || amount < 1 || amount > 100) {
        return ctx.sendError('Gunakan format: `!purge <jumlah 1-100> [filter: bots/humans/mention]`');
      }

      const secondArg = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
      if (secondArg === 'bots') {
        filter = 'bots';
      } else if (secondArg === 'humans') {
        filter = 'humans';
      } else if (ctx.message.mentions.users.first()) {
        filterUser = ctx.message.mentions.users.first();
      }
    }

    await ctx.deferReply(true); // Ephemeral reply jika slash

    try {
      // Ambil riwayat pesan terakhir dari channel
      const messages = await ctx.channel.messages.fetch({ limit: amount });
      
      // Terapkan filter jika ada
      let messagesToDelete = messages;
      
      if (filterUser) {
        messagesToDelete = messages.filter(m => m.author.id === filterUser.id);
      } else if (filter === 'bots') {
        messagesToDelete = messages.filter(m => m.author.bot);
      } else if (filter === 'humans') {
        messagesToDelete = messages.filter(m => !m.author.bot);
      }

      // Selalu batasi total penghapusan sesuai jumlah yang diminta (jika filter membuat data lebih sedikit)
      const countToDelete = messagesToDelete.size;
      if (countToDelete === 0) {
        return ctx.sendError('Tidak ditemukan pesan yang cocok dengan kriteria filter untuk dihapus.');
      }

      // bulkDelete
      const deleted = await ctx.channel.bulkDelete(messagesToDelete, true);
      
      const successMsg = `🧹 Berhasil menghapus **${deleted.size}** pesan dari channel ini.`;
      
      if (ctx.isSlash) {
        await ctx.sendSuccess(successMsg);
      } else {
        // Pada prefix command, kirim respon sukses lalu hapus respon tersebut setelah 3 detik agar channel tetap bersih
        const responseMsg = await ctx.reply({ content: `✅ **${successMsg}**` });
        setTimeout(() => {
          responseMsg.delete().catch(() => {});
          // Hapus juga pesan pemicu
          ctx.message.delete().catch(() => {});
        }, 3000);
      }
    } catch (error) {
      ctx.client.logger.error('Error saat melakukan purge:', error);
      await ctx.sendError('Gagal menghapus pesan. Catatan: Discord tidak mengizinkan bulk delete untuk pesan yang berusia lebih dari 14 hari.');
    }
  }
};
