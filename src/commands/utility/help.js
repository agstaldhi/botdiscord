const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { COLORS } = require('../../utils/constants');
const helpers = require('../../utils/helpers');

module.exports = {
  name: 'help',
  description: 'Menampilkan daftar perintah bot MonoHex.',
  aliases: ['h', 'bantuan'],
  cooldown: 5,
  category: 'utility',
  slashData: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan daftar perintah bot MonoHex.')
    .addStringOption(opt =>
      opt
        .setName('command')
        .setDescription('Nama command spesifik untuk info lebih detail.')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    const settings = await helpers.getSettings(ctx.guild.id);
    const prefix = settings.prefix || '!';
    
    let commandName;
    if (ctx.isSlash) {
      commandName = ctx.interaction.options.getString('command');
    } else {
      commandName = ctx.args[0];
    }

    const { commands } = ctx.client;

    // Jika user mencari bantuan untuk command tertentu
    if (commandName) {
      const command = commands.get(commandName.toLowerCase()) || 
                      commands.get(ctx.client.aliases.get(commandName.toLowerCase()));

      if (!command) {
        return await ctx.sendError(`Command \`${commandName}\` tidak ditemukan.`);
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(`ℹ️ Detail Command: ${command.name}`)
        .setDescription(command.description || 'Tidak ada deskripsi.')
        .addFields(
          { name: '📂 Kategori', value: `\`${command.category || 'Lainnya'}\``, inline: true },
          { name: '⏳ Cooldown', value: `\`${command.cooldown || 3} detik\``, inline: true },
          { name: '🔗 Aliases (Prefix)', value: command.aliases?.map(a => `\`${a}\``).join(', ') || '*Tidak ada*', inline: true }
        )
        .setFooter({ text: `Ketik ${prefix}help untuk melihat semua command` })
        .setTimestamp();

      return await ctx.reply({ embeds: [embed] });
    }

    // Default Help (Menampilkan kategori dengan Select Menu)
    const categoriesInfo = {
      config: { name: 'Configuration ⚙️', desc: 'Pengaturan server dan modul bot.' },
      moderation: { name: 'Moderation 🔨', desc: 'Perintah moderasi anggota server.' },
      giveaway: { name: 'Giveaway 🎁', desc: 'Mengadakan undian berhadiah gratis.' },
      leveling: { name: 'Leveling 📊', desc: 'Sistem ranking, XP, dan leaderboard.' },
      music: { name: 'Music 🎵', desc: 'Memutar lagu berkualitas tinggi di voice channel.' },
      tempvc: { name: 'TempVC 🎙️', desc: 'Pembuatan voice channel otomatis.' },
      ticket: { name: 'Ticket 🎫', desc: 'Sistem tiket dukungan dan bantuan.' },
      utility: { name: 'Utility 🛠️', desc: 'Perintah alat bantu & informasi server.' },
      fun: { name: 'Fun 🎮', desc: 'Permainan, lelucon, dan hiburan seru.' }
    };

    // Kelompokkan command berdasarkan kategori
    const mappedCategories = {};
    commands.forEach(cmd => {
      const cat = cmd.category || 'other';
      if (!mappedCategories[cat]) mappedCategories[cat] = [];
      mappedCategories[cat].push(cmd.name);
    });

    const mainEmbed = new EmbedBuilder()
      .setColor(COLORS.DEFAULT)
      .setTitle('📚 Menu Bantuan Bot MonoHex')
      .setDescription(`MonoHex adalah bot multifungsi premium. Gunakan menu dropdown di bawah untuk melihat perintah berdasarkan kategori.\n\n• **Prefix Server:** \`${prefix}\`\n• **Gunakan Slash:** \`/[command]\` atau **Legacy Prefix:** \`${prefix}[command]\``)
      .addFields(
        { 
          name: '🗂️ Kategori Tersedia', 
          value: Object.keys(categoriesInfo)
            .filter(cat => mappedCategories[cat] && mappedCategories[cat].length > 0)
            .map(cat => `• **${categoriesInfo[cat].name}** — _${categoriesInfo[cat].desc}_`)
            .join('\n') 
        }
      )
      .setFooter({ text: 'Gunakan /help <command> untuk detail perintah tertentu.' })
      .setTimestamp();

    // Buat Select Menu Dropdown
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('Pilih Kategori Perintah...')
      .addOptions(
        Object.keys(categoriesInfo)
          .filter(cat => mappedCategories[cat] && mappedCategories[cat].length > 0)
          .map(cat => ({
            label: categoriesInfo[cat].name.split(' ')[0],
            value: cat,
            description: categoriesInfo[cat].desc,
            emoji: categoriesInfo[cat].name.split(' ')[1] || '❔'
          }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const response = await ctx.reply({ embeds: [mainEmbed], components: [row] });
    const msg = ctx.isSlash ? await ctx.interaction.fetchReply() : response;

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: i => i.user.id === ctx.user.id,
      time: 60000
    });

    collector.on('collect', async i => {
      const selectedCategory = i.values[0];
      const info = categoriesInfo[selectedCategory];
      const cmdList = mappedCategories[selectedCategory] || [];

      const categoryEmbed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(`${info.name} - Daftar Perintah`)
        .setDescription(`${info.desc}\n\n${cmdList.map(name => `\`${prefix}${name}\``).join(', ')}`)
        .setFooter({ text: `Total Perintah: ${cmdList.length} | Waktu respon habis dalam 1 menit.` })
        .setTimestamp();

      await i.update({ embeds: [categoryEmbed] });
    });

    collector.on('end', async () => {
      // Nonaktifkan select menu ketika waktu habis
      const disabledMenu = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
      const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
      
      await msg.edit({ components: [disabledRow] }).catch(() => {});
    });
  }
};
