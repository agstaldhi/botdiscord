const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const helpers = require('../../utils/helpers');
const WelcomeConfig = require('../../models/WelcomeConfig');
const MusicConfig = require('../../models/MusicConfig');
const TicketConfig = require('../../models/TicketConfig');
const AutoModConfig = require('../../models/AutoModConfig');
const ReactionRole = require('../../models/ReactionRole');
const TempVCConfig = require('../../models/TempVCConfig');
const Autoresponder = require('../../models/Autoresponder');
const StatsConfig = require('../../models/StatsConfig');
const { COLORS } = require('../../utils/constants');
const permissions = require('../../utils/permissions');

module.exports = {
  name: 'config',
  description: 'Konfigurasi pengaturan bot MonoHex.',
  aliases: ['cfg', 'setup'],
  cooldown: 5,
  category: 'config',
  slashData: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Konfigurasi pengaturan bot MonoHex.')
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('Melihat semua konfigurasi server saat ini.')
    )
    .addSubcommand(sub =>
      sub
        .setName('prefix')
        .setDescription('Mengubah prefix legacy commands untuk server ini.')
        .addStringOption(opt =>
          opt
            .setName('new_prefix')
            .setDescription('Prefix baru (maksimal 5 karakter)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('welcome')
        .setDescription('Mengatur pesan selamat datang (Welcome Message).')
        .addBooleanOption(opt => opt.setName('status').setDescription('Aktifkan/nonaktifkan modul welcome.'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel pengiriman pesan welcome.').addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('message').setDescription('Pesan welcome (Gunakan {user}, {server}, dsb.)'))
        .addBooleanOption(opt => opt.setName('embed').setDescription('Gunakan format embed untuk welcome.'))
        .addBooleanOption(opt => opt.setName('dm').setDescription('Aktifkan pesan sambutan via DM ke member baru.'))
        .addStringOption(opt => opt.setName('dm_message').setDescription('Pesan welcome via DM.'))
    )
    .addSubcommand(sub =>
      sub
        .setName('leave')
        .setDescription('Mengatur pesan perpisahan (Leave Message).')
        .addBooleanOption(opt => opt.setName('status').setDescription('Aktifkan/nonaktifkan modul leave.'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel pengiriman pesan leave.').addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('message').setDescription('Pesan leave (Gunakan {username}, {server}, dsb.)'))
        .addBooleanOption(opt => opt.setName('embed').setDescription('Gunakan format embed untuk leave.'))
    )
    .addSubcommand(sub =>
      sub
        .setName('autorole')
        .setDescription('Mengatur pemberian role otomatis saat member bergabung.')
        .addRoleOption(opt => opt.setName('human_role').setDescription('Role untuk member manusia (Human).'))
        .addRoleOption(opt => opt.setName('bot_role').setDescription('Role untuk bot.'))
        .addBooleanOption(opt => opt.setName('clear').setDescription('Hapus semua auto roles.'))
    )
    .addSubcommand(sub =>
      sub
        .setName('logs')
        .setDescription('Mengatur channel pencatatan log server.')
        .addChannelOption(opt => opt.setName('mod_log').setDescription('Channel khusus mencatat aksi moderasi (Ban, Kick, Timeout).').addChannelTypes(ChannelType.GuildText))
        .addChannelOption(opt => opt.setName('server_log').setDescription('Channel mencatat aktivitas server (Edit/Hapus pesan, Join/Leave).').addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub =>
      sub
        .setName('music')
        .setDescription('Mengatur pembatasan channel musik dan DJ Role.')
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel khusus teks untuk perintah musik.').addChannelTypes(ChannelType.GuildText))
        .addRoleOption(opt => opt.setName('dj_role').setDescription('Role khusus DJ untuk mengendalikan musik.'))
        .addBooleanOption(opt => opt.setName('clear_dj').setDescription('Hapus pembatasan DJ Role.'))
        .addBooleanOption(opt => opt.setName('clear_channel').setDescription('Hapus pembatasan channel musik.'))
    )
    .addSubcommand(sub =>
      sub
        .setName('ticket')
        .setDescription('Mengatur konfigurasi global sistem ticket.')
        .addBooleanOption(opt => opt.setName('status').setDescription('Aktifkan/nonaktifkan modul ticket.'))
        .addChannelOption(opt => opt.setName('log_channel').setDescription('Channel log aktivitas ticket.').addChannelTypes(ChannelType.GuildText))
        .addChannelOption(opt => opt.setName('transcript_channel').setDescription('Channel transcript ticket selesai.').addChannelTypes(ChannelType.GuildText))
        .addChannelOption(opt => opt.setName('archive_category').setDescription('Kategori channel arsip ticket selesai.').addChannelTypes(ChannelType.GuildCategory))
        .addBooleanOption(opt => opt.setName('confirmation').setDescription('Aktifkan konfirmasi sebelum menutup ticket.'))
    )
    .addSubcommand(sub =>
      sub
        .setName('ticket_category')
        .setDescription('Mengatur kategori ticket (tambah/hapus).')
        .addStringOption(opt => opt.setName('action').setDescription('Pilih aksi: add atau remove.').setRequired(true).addChoices(
          { name: 'Tambah Kategori (add)', value: 'add' },
          { name: 'Hapus Kategori (remove)', value: 'remove' }
        ))
        .addStringOption(opt => opt.setName('name').setDescription('Nama kategori (misal: Dukungan Teknis).').setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji kategori (misal: 🛠️).'))
        .addStringOption(opt => opt.setName('description').setDescription('Deskripsi singkat kategori.'))
        .addRoleOption(opt => opt.setName('staff_role').setDescription('Role staff penanggung jawab kategori ini.'))
        .addChannelOption(opt => opt.setName('channel_category').setDescription('Category channel Discord untuk meletakkan ticket baru.').addChannelTypes(ChannelType.GuildCategory))
        .addStringOption(opt => opt.setName('welcome_msg').setDescription('Pesan sambutan di channel ticket.'))
    )
    .addSubcommand(sub =>
      sub
        .setName('automod')
        .setDescription('Mengatur konfigurasi AutoMod.')
        .addBooleanOption(opt => opt.setName('status').setDescription('Aktifkan/nonaktifkan modul AutoMod secara global.'))
        .addBooleanOption(opt => opt.setName('spam').setDescription('Aktifkan/nonaktifkan Anti Spam.'))
        .addIntegerOption(opt => opt.setName('spam_max').setDescription('Maksimal pesan sebelum dideteksi spam (default 5).'))
        .addStringOption(opt => opt.setName('spam_punishment').setDescription('Hukuman untuk spam.').addChoices(
          { name: 'Hapus Pesan (delete)', value: 'delete' },
          { name: 'Peringatan (warn)', value: 'warn' },
          { name: 'Timeout (mute)', value: 'mute' }
        ))
        .addBooleanOption(opt => opt.setName('link').setDescription('Aktifkan/nonaktifkan Anti Link.'))
        .addStringOption(opt => opt.setName('link_whitelist').setDescription('Domain whitelist baru (dipisahkan koma, misal: google.com,youtube.com)'))
        .addBooleanOption(opt => opt.setName('badwords').setDescription('Aktifkan/nonaktifkan Bad Words filter.'))
        .addStringOption(opt => opt.setName('badwords_add').setDescription('Kata kasar yang ingin ditambahkan (dipisahkan koma).'))
        .addBooleanOption(opt => opt.setName('mention').setDescription('Aktifkan/nonaktifkan Anti Mass Mention.'))
        .addIntegerOption(opt => opt.setName('mention_max').setDescription('Maksimal mention per pesan.'))
        .addBooleanOption(opt => opt.setName('caps').setDescription('Aktifkan/nonaktifkan Anti Caps.'))
        .addIntegerOption(opt => opt.setName('caps_threshold').setDescription('Persentase huruf kapital sebelum melanggar (default 70).'))
    )
    .addSubcommand(sub =>
      sub
        .setName('reactionrole')
        .setDescription('Membuat panel reaction role baru.')
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel tempat mengirim panel reaction role.').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('title').setDescription('Judul panel reaction role (misal: Pilih Role Game).').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('Tipe panel reaction role.').setRequired(true).addChoices(
          { name: 'Normal (bisa ambil banyak role)', value: 'normal' },
          { name: 'Unique (hanya bisa 1 role dari panel ini)', value: 'unique' },
          { name: 'Verify (sekali klik, tidak bisa dilepas)', value: 'verify' }
        ))
        .addStringOption(opt => opt.setName('roles_data').setDescription('Data emoji dan role. Format: emoji:role (dipisahkan koma. Contoh: 🔴:@RoleA, 🟢:@RoleB)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('tempvc')
        .setDescription('Mengatur Temporary Voice Channel (TempVC).')
        .addBooleanOption(opt => opt.setName('status').setDescription('Aktifkan/nonaktifkan modul TempVC.'))
        .addChannelOption(opt => opt.setName('trigger_channel').setDescription('Channel voice pemicu ("➕ Buat Channel").').addChannelTypes(ChannelType.GuildVoice))
        .addChannelOption(opt => opt.setName('category').setDescription('Kategori Discord tempat TempVC baru dibuat.').addChannelTypes(ChannelType.GuildCategory))
        .addStringOption(opt => opt.setName('name_template').setDescription('Template nama room (Contoh: "🎙️ {username}\'s Room").'))
        .addIntegerOption(opt => opt.setName('user_limit').setDescription('Batas maksimal user bawaan room (0 = unlimited, 1-99).').setMinValue(0).setMaxValue(99))
        .addIntegerOption(opt => opt.setName('bitrate').setDescription('Bitrate audio bawaan room (8000 - 96000 bps).').setMinValue(8000).setMaxValue(96000))
    )
    .addSubcommand(sub =>
      sub
        .setName('autoresponder')
        .setDescription('Mengatur Autoresponder server.')
        .addStringOption(opt => opt.setName('action').setDescription('Pilih aksi.').setRequired(true).addChoices(
          { name: 'Tambah Trigger (add)', value: 'add' },
          { name: 'Hapus Trigger (remove)', value: 'remove' },
          { name: 'Daftar Trigger (list)', value: 'list' }
        ))
        .addStringOption(opt => opt.setName('trigger').setDescription('Kata pemicu.'))
        .addStringOption(opt => opt.setName('response').setDescription('Respon otomatis.'))
        .addStringOption(opt => opt.setName('match_type').setDescription('Tipe kecocokan trigger.').addChoices(
          { name: 'Exact (Sama Persis)', value: 'exact' },
          { name: 'Contains (Mengandung)', value: 'contains' },
          { name: 'StartsWith (Diawali)', value: 'startsWith' },
          { name: 'EndsWith (Diakhiri)', value: 'endsWith' },
          { name: 'Regex (RegEx)', value: 'regex' }
        ))
        .addStringOption(opt => opt.setName('id').setDescription('ID trigger yang ingin dihapus (bisa dilihat dari list).'))
    )
    .addSubcommand(sub =>
      sub
        .setName('stats')
        .setDescription('Mengatur Server Stats Channels (Display voice channel).')
        .addStringOption(opt => opt.setName('action').setDescription('Pilih aksi.').setRequired(true).addChoices(
          { name: 'Tambah Stats (add)', value: 'add' },
          { name: 'Hapus Stats (remove)', value: 'remove' },
          { name: 'Daftar Stats (list)', value: 'list' }
        ))
        .addStringOption(opt => opt.setName('type').setDescription('Tipe statistik yang di-display.').addChoices(
          { name: 'Total Members (👥)', value: 'totalMembers' },
          { name: 'Online Members (🟢)', value: 'onlineMembers' },
          { name: 'Bots (🤖)', value: 'bots' },
          { name: 'Humans (👨)', value: 'humans' },
          { name: 'Boosts (⚡)', value: 'boosts' },
          { name: 'Channels (💬)', value: 'channels' },
          { name: 'Roles (🔑)', value: 'roles' }
        ))
        .addStringOption(opt => opt.setName('template').setDescription('Template nama channel (Contoh: "👥 Members: {value}").'))
        .addStringOption(opt => opt.setName('id').setDescription('ID Stats Channel yang ingin dihapus (bisa dilihat dari list).'))
    )
    .addSubcommand(sub =>
      sub
        .setName('managers')
        .setDescription('Mengatur daftar Bot Manager (Akses ke perintah /config).')
        .addStringOption(opt => opt.setName('action').setDescription('Pilih aksi.').setRequired(true).addChoices(
          { name: 'Tambah Manager (add)', value: 'add' },
          { name: 'Hapus Manager (remove)', value: 'remove' },
          { name: 'Daftar Manager (list)', value: 'list' }
        ))
        .addStringOption(opt => opt.setName('type').setDescription('Tipe target.').addChoices(
          { name: 'Role', value: 'role' },
          { name: 'User', value: 'user' }
        ))
        .addRoleOption(opt => opt.setName('role').setDescription('Role target untuk ditambahkan/dihapus.'))
        .addUserOption(opt => opt.setName('user').setDescription('User target untuk ditambahkan/dihapus.'))
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('Mereset konfigurasi bot server ini ke default.')
    ),

  /**
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async execute(ctx) {
    if (ctx.isSlash) {
      const subcommand = ctx.interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'view':
          return await this.executeView(ctx);
        case 'prefix':
          return await this.executePrefix(ctx, ctx.interaction.options.getString('new_prefix'));
        case 'welcome':
          return await this.executeWelcome(ctx);
        case 'leave':
          return await this.executeLeave(ctx);
        case 'autorole':
          return await this.executeAutoRole(ctx);
        case 'logs':
          return await this.executeLogs(ctx);
        case 'music':
          return await this.executeMusic(ctx);
        case 'ticket':
          return await this.executeTicket(ctx);
        case 'ticket_category':
          return await this.executeTicketCategory(ctx);
        case 'automod':
          return await this.executeAutoMod(ctx);
        case 'reactionrole':
          return await this.executeReactionRole(ctx);
        case 'tempvc':
          return await this.executeTempVC(ctx);
        case 'autoresponder':
          return await this.executeAutoresponder(ctx);
        case 'stats':
          return await this.executeStats(ctx);
        case 'managers':
          return await this.executeManagers(ctx);
        case 'reset':
          return await this.executeReset(ctx);
      }
    } else {
      // Legacy prefix command router: !config <subcommand> <options...>
      const subcommand = ctx.args[0] ? ctx.args[0].toLowerCase() : 'view';
      
      switch (subcommand) {
        case 'view':
          return await this.executeView(ctx);
        case 'prefix':
          const newPrefix = ctx.args[1];
          if (!newPrefix) return ctx.sendError('Gunakan format: `!config prefix <prefix_baru>`');
          return await this.executePrefix(ctx, newPrefix);
        case 'welcome':
          return await this.executeWelcomeLegacy(ctx);
        case 'leave':
          return await this.executeLeaveLegacy(ctx);
        case 'autorole':
          return await this.executeAutoRoleLegacy(ctx);
        case 'logs':
          return await this.executeLogsLegacy(ctx);
        case 'music':
          return await this.executeMusicLegacy(ctx);
        case 'ticket':
          return await this.executeTicketLegacy(ctx);
        case 'ticket_category':
          return await this.executeTicketCategoryLegacy(ctx);
        case 'automod':
          return await this.executeAutoModLegacy(ctx);
        case 'reactionrole':
          return await this.executeReactionRoleLegacy(ctx);
        case 'tempvc':
          return await this.executeTempVCLegacy(ctx);
        case 'autoresponder':
          return await this.executeAutoresponderLegacy(ctx);
        case 'stats':
          return await this.executeStatsLegacy(ctx);
        case 'managers':
          return await this.executeManagersLegacy(ctx);
        case 'reset':
          return await this.executeResetLegacy(ctx);
        default:
          return ctx.sendError('Subcommand tidak valid! Gunakan: `view`, `prefix`, `welcome`, `leave`, `autorole`, `logs`, `music`, `ticket`, `ticket_category`, `automod`, `reactionrole`, `tempvc`, `autoresponder`, `stats`, `managers`, atau `reset`.');
      }
    }
  },

  /**
   * Menampilkan konfigurasi server saat ini
   * @param {import('../../utils/CommandContext')} ctx 
   */
  async executeView(ctx) {
    await ctx.deferReply();
    const settings = await helpers.getSettings(ctx.guild.id);
    
    let welcome = await WelcomeConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!welcome) welcome = await WelcomeConfig.create({ guildId: ctx.guild.id });

    let music = await MusicConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!music) music = await MusicConfig.create({ guildId: ctx.guild.id });

    let ticketConfig = await TicketConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!ticketConfig) ticketConfig = await TicketConfig.create({ guildId: ctx.guild.id });

    let automodConfig = await AutoModConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!automodConfig) automodConfig = await AutoModConfig.create({ guildId: ctx.guild.id });

    const humanRolesStr = welcome.autoRoles?.humanRoles?.map(id => `<@&${id}>`).join(', ') || '*None*';
    const botRolesStr = welcome.autoRoles?.botRoles?.map(id => `<@&${id}>`).join(', ') || '*None*';

    const embed = ctx.client.embeds.create({
      title: `⚙️ Konfigurasi Server — ${ctx.guild.name}`,
      description: 'Status modul dan pengaturan server saat ini untuk bot MonoHex.',
      fields: [
        { name: 'Prefix Server', value: `\`${settings.prefix}\``, inline: true },
        { name: 'Bahasa Bot', value: `\`${settings.language === 'id' ? 'Bahasa Indonesia (id)' : 'English (en)'}\``, inline: true },
        { name: '\u200B', value: '\u200B', inline: true }, // Spacer
        
        { 
          name: '📢 Welcome Message', 
          value: `Status: ${welcome.welcomeEnabled ? '🟢 Aktif' : '🔴 Nonaktif'}\nChannel: ${welcome.welcomeChannelId ? `<#${welcome.welcomeChannelId}>` : '*Belum diset*'}\nEmbed Format: ${welcome.welcomeEmbed?.enabled ? '✅ Yes' : '❌ No'}\nDM Welcome: ${welcome.dmWelcome ? '✅ Yes' : '❌ No'}`, 
          inline: false 
        },
        { 
          name: '📯 Leave Message', 
          value: `Status: ${welcome.leaveEnabled ? '🟢 Aktif' : '🔴 Nonaktif'}\nChannel: ${welcome.leaveChannelId ? `<#${welcome.leaveChannelId}>` : '*Belum diset*'}\nEmbed Format: ${welcome.leaveEmbed?.enabled ? '✅ Yes' : '❌ No'}`, 
          inline: false 
        },
        {
          name: '🎭 Auto Role (On Join)',
          value: `Humans: ${humanRolesStr}\nBots: ${botRolesStr}`,
          inline: false
        },
        {
          name: '📝 Channel Log',
          value: `Mod Log: ${settings.modLogChannelId ? `<#${settings.modLogChannelId}>` : '*Belum diset*'}\nServer Log: ${settings.serverLogChannelId ? `<#${settings.serverLogChannelId}>` : '*Belum diset*'}`,
          inline: false
        },
        {
          name: '🎵 Pengaturan Musik',
          value: `DJ Role: ${music.djRoleId ? `<@&${music.djRoleId}>` : '*Semua member*'}\nChannel Khusus: ${music.musicChannelId ? `<#${music.musicChannelId}>` : '*Semua channel*'}\nMode 24/7: ${music.mode247 ? '🟢 Aktif' : '🔴 Nonaktif'}\nVolume Default: \`${music.defaultVolume}%\``,
          inline: false
        },
        {
          name: '🎫 Sistem Ticket',
          value: `Status: ${ticketConfig.enabled ? '🟢 Aktif' : '🔴 Nonaktif'}\nLog Channel: ${ticketConfig.logChannelId ? `<#${ticketConfig.logChannelId}>` : '*Belum diset*'}\nTranscript Channel: ${ticketConfig.transcriptChannelId ? `<#${ticketConfig.transcriptChannelId}>` : '*Belum diset*'}\nArchive Category: ${ticketConfig.archiveCategoryId ? `\`${ticketConfig.archiveCategoryId}\`` : '*Belum diset*'}\nCategories: ${ticketConfig.categories?.map(c => `\`${c.name}\``).join(', ') || '*None*'}`,
          inline: false
        },
        {
          name: '🛡️ AutoMod System',
          value: `Status: ${settings.modules.automod ? '🟢 Aktif' : '🔴 Nonaktif'}\nAnti-Spam: ${automodConfig.antiSpam?.enabled ? '🟢' : '🔴'} | Anti-Link: ${automodConfig.antiLink?.enabled ? '🟢' : '🔴'} | Bad-Words: ${automodConfig.badWords?.enabled ? '🟢' : '🔴'}\nAnti-Mention: ${automodConfig.antiMention?.enabled ? '🟢' : '🔴'} | Anti-Caps: ${automodConfig.antiCaps?.enabled ? '🟢' : '🔴'}`,
          inline: false
        },
        { 
          name: '📊 Leveling XP', 
          value: settings.modules.leveling ? '🟢 Aktif' : '🔴 Nonaktif', 
          inline: true 
        }
      ],
      thumbnail: ctx.guild.iconURL({ dynamic: true }) || null
    });

    await ctx.reply({ embeds: [embed] });
  },

  /**
   * Mengubah prefix server
   */
  async executePrefix(ctx, newPrefix) {
    if (newPrefix.length > 5) return ctx.sendError('Prefix baru tidak boleh lebih dari 5 karakter!');
    
    await ctx.deferReply();
    await helpers.updateSettings(ctx.guild.id, { prefix: newPrefix });
    await ctx.sendSuccess(`Prefix server berhasil diubah menjadi \`${newPrefix}\`!`);
  },

  /**
   * Mengatur Welcome Config via Slash
   */
  async executeWelcome(ctx) {
    await ctx.deferReply();
    
    let welcome = await WelcomeConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!welcome) welcome = await WelcomeConfig.create({ guildId: ctx.guild.id });

    const status = ctx.interaction.options.getBoolean('status');
    const channel = ctx.interaction.options.getChannel('channel');
    const message = ctx.interaction.options.getString('message');
    const useEmbed = ctx.interaction.options.getBoolean('embed');
    const dm = ctx.interaction.options.getBoolean('dm');
    const dmMessage = ctx.interaction.options.getString('dm_message');

    const updateData = {};
    if (status !== null) {
      updateData.welcomeEnabled = status;
      await helpers.updateSettings(ctx.guild.id, { 'modules.welcome': status });
    }
    if (channel !== null) updateData.welcomeChannelId = channel.id;
    if (message !== null) updateData.welcomeMessage = message;
    if (useEmbed !== null) {
      updateData.welcomeEmbed = { ...welcome.welcomeEmbed, enabled: useEmbed };
    }
    if (dm !== null) updateData.dmWelcome = dm;
    if (dmMessage !== null) updateData.dmMessage = dmMessage;

    await WelcomeConfig.update(updateData, { where: { guildId: ctx.guild.id } });
    await ctx.sendSuccess('Konfigurasi welcome message berhasil diperbarui!');
  },

  /**
   * Mengatur Leave Config via Slash
   */
  async executeLeave(ctx) {
    await ctx.deferReply();
    
    let welcome = await WelcomeConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!welcome) welcome = await WelcomeConfig.create({ guildId: ctx.guild.id });

    const status = ctx.interaction.options.getBoolean('status');
    const channel = ctx.interaction.options.getChannel('channel');
    const message = ctx.interaction.options.getString('message');
    const useEmbed = ctx.interaction.options.getBoolean('embed');

    const updateData = {};
    if (status !== null) {
      updateData.leaveEnabled = status;
      await helpers.updateSettings(ctx.guild.id, { 'modules.leave': status });
    }
    if (channel !== null) updateData.leaveChannelId = channel.id;
    if (message !== null) updateData.leaveMessage = message;
    if (useEmbed !== null) {
      updateData.leaveEmbed = { ...welcome.leaveEmbed, enabled: useEmbed };
    }

    await WelcomeConfig.update(updateData, { where: { guildId: ctx.guild.id } });
    await ctx.sendSuccess('Konfigurasi leave message berhasil diperbarui!');
  },

  /**
   * Mengatur Auto Role via Slash
   */
  async executeAutoRole(ctx) {
    await ctx.deferReply();
    
    let welcome = await WelcomeConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!welcome) welcome = await WelcomeConfig.create({ guildId: ctx.guild.id });

    const humanRole = ctx.interaction.options.getRole('human_role');
    const botRole = ctx.interaction.options.getRole('bot_role');
    const clear = ctx.interaction.options.getBoolean('clear');

    if (clear) {
      await WelcomeConfig.update({
        autoRoles: { humanRoles: [], botRoles: [] }
      }, { where: { guildId: ctx.guild.id } });
      return await ctx.sendSuccess('Semua konfigurasi Auto Role berhasil dihapus!');
    }

    const currentRoles = welcome.autoRoles || { humanRoles: [], botRoles: [] };

    if (humanRole) {
      if (!currentRoles.humanRoles.includes(humanRole.id)) {
        currentRoles.humanRoles.push(humanRole.id);
      }
    }

    if (botRole) {
      if (!currentRoles.botRoles.includes(botRole.id)) {
        currentRoles.botRoles.push(botRole.id);
      }
    }

    await WelcomeConfig.update({ autoRoles: currentRoles }, { where: { guildId: ctx.guild.id } });
    await ctx.sendSuccess('Konfigurasi Auto Role berhasil diperbarui!');
  },

  /**
   * Mengatur Log Channels via Slash
   */
  async executeLogs(ctx) {
    await ctx.deferReply();
    const modLog = ctx.interaction.options.getChannel('mod_log');
    const serverLog = ctx.interaction.options.getChannel('server_log');

    const updateData = {};
    if (modLog) updateData.modLogChannelId = modLog.id;
    if (serverLog) updateData.serverLogChannelId = serverLog.id;

    if (Object.keys(updateData).length === 0) {
      return await ctx.sendError('Pilihlah minimal satu opsi channel log untuk dikonfigurasi!');
    }

    await helpers.updateSettings(ctx.guild.id, updateData);
    await ctx.sendSuccess('Konfigurasi channel log server berhasil diperbarui!');
  },

  /**
   * Mengatur Music Config via Slash
   */
  async executeMusic(ctx) {
    await ctx.deferReply();
    let music = await MusicConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!music) music = await MusicConfig.create({ guildId: ctx.guild.id });

    const channel = ctx.interaction.options.getChannel('channel');
    const djRole = ctx.interaction.options.getRole('dj_role');
    const clearDj = ctx.interaction.options.getBoolean('clear_dj');
    const clearChannel = ctx.interaction.options.getBoolean('clear_channel');

    const updateData = {};
    if (clearDj) {
      updateData.djRoleId = null;
    } else if (djRole) {
      updateData.djRoleId = djRole.id;
    }

    if (clearChannel) {
      updateData.musicChannelId = null;
    } else if (channel) {
      updateData.musicChannelId = channel.id;
    }

    if (Object.keys(updateData).length === 0) {
      return await ctx.sendError('Pilihlah minimal satu opsi musik untuk dikonfigurasi!');
    }

    await MusicConfig.update(updateData, { where: { guildId: ctx.guild.id } });
    await ctx.sendSuccess('Konfigurasi musik server berhasil diperbarui!');
  },

  // ─── LEGACY PREFIX COMMAND IMPLEMENTATIONS ────────────────────────────────
  async executeWelcomeLegacy(ctx) {
    const subOption = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const val = ctx.args.slice(2).join(' ');

    let welcome = await WelcomeConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!welcome) welcome = await WelcomeConfig.create({ guildId: ctx.guild.id });

    if (subOption === 'status') {
      const bool = val === 'true';
      await WelcomeConfig.update({ welcomeEnabled: bool }, { where: { guildId: ctx.guild.id } });
      await helpers.updateSettings(ctx.guild.id, { 'modules.welcome': bool });
      return ctx.sendSuccess(`Welcome status diset ke: **${bool}**`);
    } else if (subOption === 'channel') {
      const channel = ctx.message.mentions.channels.first();
      if (!channel) return ctx.sendError('Mention channel teks yang valid!');
      await WelcomeConfig.update({ welcomeChannelId: channel.id }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Welcome channel diset ke: ${channel}`);
    } else if (subOption === 'message') {
      if (!val) return ctx.sendError('Masukkan isi pesan welcome!');
      await WelcomeConfig.update({ welcomeMessage: val }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess('Pesan welcome berhasil diperbarui!');
    } else if (subOption === 'embed') {
      const bool = val === 'true';
      await WelcomeConfig.update({ welcomeEmbed: { ...welcome.welcomeEmbed, enabled: bool } }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Welcome format embed diset ke: **${bool}**`);
    } else if (subOption === 'dm') {
      const bool = val === 'true';
      await WelcomeConfig.update({ dmWelcome: bool }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`DM welcome status diset ke: **${bool}**`);
    } else if (subOption === 'dmmessage') {
      if (!val) return ctx.sendError('Masukkan isi pesan DM welcome!');
      await WelcomeConfig.update({ dmMessage: val }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess('Pesan DM welcome berhasil diperbarui!');
    } else {
      return ctx.sendError('Opsi tidak valid! Gunakan: `status`, `channel`, `message`, `embed`, `dm`, atau `dmmessage`.');
    }
  },

  async executeLeaveLegacy(ctx) {
    const subOption = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const val = ctx.args.slice(2).join(' ');

    let welcome = await WelcomeConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!welcome) welcome = await WelcomeConfig.create({ guildId: ctx.guild.id });

    if (subOption === 'status') {
      const bool = val === 'true';
      await WelcomeConfig.update({ leaveEnabled: bool }, { where: { guildId: ctx.guild.id } });
      await helpers.updateSettings(ctx.guild.id, { 'modules.leave': bool });
      return ctx.sendSuccess(`Leave status diset ke: **${bool}**`);
    } else if (subOption === 'channel') {
      const channel = ctx.message.mentions.channels.first();
      if (!channel) return ctx.sendError('Mention channel teks yang valid!');
      await WelcomeConfig.update({ leaveChannelId: channel.id }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Leave channel diset ke: ${channel}`);
    } else if (subOption === 'message') {
      if (!val) return ctx.sendError('Masukkan isi pesan leave!');
      await WelcomeConfig.update({ leaveMessage: val }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess('Pesan leave berhasil diperbarui!');
    } else if (subOption === 'embed') {
      const bool = val === 'true';
      await WelcomeConfig.update({ leaveEmbed: { ...welcome.leaveEmbed, enabled: bool } }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Leave format embed diset ke: **${bool}**`);
    } else {
      return ctx.sendError('Opsi tidak valid! Gunakan: `status`, `channel`, `message`, atau `embed`.');
    }
  },

  async executeAutoRoleLegacy(ctx) {
    const subOption = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    
    let welcome = await WelcomeConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!welcome) welcome = await WelcomeConfig.create({ guildId: ctx.guild.id });

    if (subOption === 'clear') {
      await WelcomeConfig.update({ autoRoles: { humanRoles: [], botRoles: [] } }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess('Semua konfigurasi Auto Role berhasil dihapus!');
    }

    const role = ctx.message.mentions.roles.first();
    if (!role) return ctx.sendError('Mention role yang valid! (Contoh: `!config autorole human @RoleMember`)');

    const currentRoles = welcome.autoRoles || { humanRoles: [], botRoles: [] };

    if (subOption === 'human') {
      if (!currentRoles.humanRoles.includes(role.id)) {
        currentRoles.humanRoles.push(role.id);
      }
      await WelcomeConfig.update({ autoRoles: currentRoles }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Role ${role} ditambahkan ke Auto Role Human!`);
    } else if (subOption === 'bot') {
      if (!currentRoles.botRoles.includes(role.id)) {
        currentRoles.botRoles.push(role.id);
      }
      await WelcomeConfig.update({ autoRoles: currentRoles }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Role ${role} ditambahkan ke Auto Role Bot!`);
    } else {
      return ctx.sendError('Gunakan opsi: `human`, `bot`, atau `clear`.');
    }
  },

  async executeLogsLegacy(ctx) {
    const subOption = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const channel = ctx.message.mentions.channels.first();

    if (!channel) return ctx.sendError('Mention channel teks yang valid!');

    if (subOption === 'mod') {
      await helpers.updateSettings(ctx.guild.id, { modLogChannelId: channel.id });
      return ctx.sendSuccess(`Channel mod log diset ke: ${channel}`);
    } else if (subOption === 'server') {
      await helpers.updateSettings(ctx.guild.id, { serverLogChannelId: channel.id });
      return ctx.sendSuccess(`Channel server log diset ke: ${channel}`);
    } else {
      return ctx.sendError('Gunakan opsi: `mod` atau `server`.');
    }
  },

  async executeMusicLegacy(ctx) {
    const subOption = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    
    let music = await MusicConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!music) music = await MusicConfig.create({ guildId: ctx.guild.id });

    if (subOption === 'clear-dj') {
      await MusicConfig.update({ djRoleId: null }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess('Batasan DJ Role berhasil dihapus (semua member kini bisa mengontrol musik).');
    } else if (subOption === 'clear-channel') {
      await MusicConfig.update({ musicChannelId: null }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess('Batasan channel musik berhasil dihapus.');
    }

    if (subOption === 'dj') {
      const role = ctx.message.mentions.roles.first();
      if (!role) return ctx.sendError('Mention role khusus DJ! (Contoh: `!config music dj @DJRole`)');
      await MusicConfig.update({ djRoleId: role.id }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`DJ Role khusus berhasil diset ke: ${role}`);
    } else if (subOption === 'channel') {
      const channel = ctx.message.mentions.channels.first();
      if (!channel) return ctx.sendError('Mention channel teks khusus musik! (Contoh: `!config music channel #music-bot`)');
      await MusicConfig.update({ musicChannelId: channel.id }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Channel khusus musik diset ke: ${channel}`);
    } else {
      return ctx.sendError('Opsi tidak valid! Gunakan: `dj`, `channel`, `clear-dj`, atau `clear-channel`.');
    }
  },

  async executeTicket(ctx) {
    await ctx.deferReply();
    let ticketConfig = await TicketConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!ticketConfig) ticketConfig = await TicketConfig.create({ guildId: ctx.guild.id });

    const status = ctx.interaction.options.getBoolean('status');
    const logChannel = ctx.interaction.options.getChannel('log_channel');
    const transcriptChannel = ctx.interaction.options.getChannel('transcript_channel');
    const archiveCategory = ctx.interaction.options.getChannel('archive_category');
    const confirmation = ctx.interaction.options.getBoolean('confirmation');

    const updateData = {};
    if (status !== null) {
      updateData.enabled = status;
      await helpers.updateSettings(ctx.guild.id, { 'modules.ticket': status });
    }
    if (logChannel !== null) updateData.logChannelId = logChannel.id;
    if (transcriptChannel !== null) updateData.transcriptChannelId = transcriptChannel.id;
    if (archiveCategory !== null) updateData.archiveCategoryId = archiveCategory.id;
    if (confirmation !== null) updateData.closeConfirmation = confirmation;

    if (Object.keys(updateData).length === 0) {
      return await ctx.sendError('Pilihlah minimal satu opsi ticket untuk dikonfigurasi!');
    }

    await TicketConfig.update(updateData, { where: { guildId: ctx.guild.id } });
    await ctx.sendSuccess('Konfigurasi sistem ticket berhasil diperbarui!');
  },

  async executeTicketCategory(ctx) {
    await ctx.deferReply();
    let ticketConfig = await TicketConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!ticketConfig) ticketConfig = await TicketConfig.create({ guildId: ctx.guild.id });

    const action = ctx.interaction.options.getString('action');
    const name = ctx.interaction.options.getString('name');
    const emoji = ctx.interaction.options.getString('emoji') || '🎫';
    const description = ctx.interaction.options.getString('description') || '';
    const staffRole = ctx.interaction.options.getRole('staff_role');
    const channelCategory = ctx.interaction.options.getChannel('channel_category');
    const welcomeMsg = ctx.interaction.options.getString('welcome_msg') || '';

    let categories = ticketConfig.categories || [];

    if (action === 'add') {
      const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return await ctx.sendError(`Kategori ticket dengan nama \`${name}\` sudah ada!`);
      }

      const newCategory = {
        id: `cat_${Date.now()}`,
        name,
        emoji,
        description,
        staffRoles: staffRole ? [staffRole.id] : [],
        categoryId: channelCategory ? channelCategory.id : null,
        pingStaff: staffRole ? true : false,
        welcomeMessage: welcomeMsg || 'Silakan sampaikan masalah Anda di sini. Staff kami akan segera membantu Anda.'
      };

      categories.push(newCategory);
      await TicketConfig.update({ categories }, { where: { guildId: ctx.guild.id } });
      await ctx.sendSuccess(`Kategori ticket \`${name}\` berhasil ditambahkan!`);
    } else if (action === 'remove') {
      const index = categories.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
      if (index === -1) {
        return await ctx.sendError(`Kategori ticket dengan nama \`${name}\` tidak ditemukan!`);
      }

      categories.splice(index, 1);
      await TicketConfig.update({ categories }, { where: { guildId: ctx.guild.id } });
      await ctx.sendSuccess(`Kategori ticket \`${name}\` berhasil dihapus!`);
    }
  },

  async executeTicketLegacy(ctx) {
    const subOption = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const val = ctx.args.slice(2).join(' ');

    let ticketConfig = await TicketConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!ticketConfig) ticketConfig = await TicketConfig.create({ guildId: ctx.guild.id });

    if (subOption === 'status') {
      const bool = val === 'true';
      await TicketConfig.update({ enabled: bool }, { where: { guildId: ctx.guild.id } });
      await helpers.updateSettings(ctx.guild.id, { 'modules.ticket': bool });
      return ctx.sendSuccess(`Ticket system status diset ke: **${bool}**`);
    } else if (subOption === 'log') {
      const channel = ctx.message.mentions.channels.first();
      if (!channel) return ctx.sendError('Mention channel teks log yang valid!');
      await TicketConfig.update({ logChannelId: channel.id }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Ticket log channel diset ke: ${channel}`);
    } else if (subOption === 'transcript') {
      const channel = ctx.message.mentions.channels.first();
      if (!channel) return ctx.sendError('Mention channel teks transcript yang valid!');
      await TicketConfig.update({ transcriptChannelId: channel.id }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Ticket transcript channel diset ke: ${channel}`);
    } else if (subOption === 'archive') {
      const categoryId = ctx.args[2];
      if (!categoryId) return ctx.sendError('Masukkan ID category arsip yang valid!');
      await TicketConfig.update({ archiveCategoryId: categoryId }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Ticket archive category diset ke: \`${categoryId}\``);
    } else if (subOption === 'confirmation') {
      const bool = val === 'true';
      await TicketConfig.update({ closeConfirmation: bool }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Ticket close confirmation diset ke: **${bool}**`);
    } else {
      return ctx.sendError('Opsi tidak valid! Gunakan: `status`, `log`, `transcript`, `archive`, atau `confirmation`.');
    }
  },

  async executeTicketCategoryLegacy(ctx) {
    const action = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    if (action !== 'add' && action !== 'remove') {
      return ctx.sendError('Format salah! Gunakan: `!config ticket_category add <nama>` atau `!config ticket_category remove <nama>`');
    }

    let ticketConfig = await TicketConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!ticketConfig) ticketConfig = await TicketConfig.create({ guildId: ctx.guild.id });

    let categories = ticketConfig.categories || [];
    const name = ctx.args.slice(2).join(' ');
    if (!name) return ctx.sendError('Masukkan nama kategori!');

    if (action === 'add') {
      const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return ctx.sendError(`Kategori ticket dengan nama \`${name}\` sudah ada!`);
      }

      const newCategory = {
        id: `cat_${Date.now()}`,
        name,
        emoji: '🎫',
        description: 'Bantuan ticket',
        staffRoles: [],
        categoryId: null,
        pingStaff: false,
        welcomeMessage: 'Silakan sampaikan masalah Anda di sini. Staff kami akan segera membantu Anda.'
      };

      categories.push(newCategory);
      await TicketConfig.update({ categories }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Kategori ticket \`${name}\` berhasil ditambahkan!`);
    } else if (action === 'remove') {
      const index = categories.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
      if (index === -1) {
        return ctx.sendError(`Kategori ticket dengan nama \`${name}\` tidak ditemukan!`);
      }

      categories.splice(index, 1);
      await TicketConfig.update({ categories }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Kategori ticket \`${name}\` berhasil dihapus!`);
    }
  },

  async executeAutoMod(ctx) {
    await ctx.deferReply();
    let automodConfig = await AutoModConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!automodConfig) automodConfig = await AutoModConfig.create({ guildId: ctx.guild.id });

    const status = ctx.interaction.options.getBoolean('status');
    const spam = ctx.interaction.options.getBoolean('spam');
    const spamMax = ctx.interaction.options.getInteger('spam_max');
    const spamPunishment = ctx.interaction.options.getString('spam_punishment');
    const link = ctx.interaction.options.getBoolean('link');
    const linkWhitelist = ctx.interaction.options.getString('link_whitelist');
    const badwords = ctx.interaction.options.getBoolean('badwords');
    const badwordsAdd = ctx.interaction.options.getString('badwords_add');
    const mention = ctx.interaction.options.getBoolean('mention');
    const mentionMax = ctx.interaction.options.getInteger('mention_max');
    const caps = ctx.interaction.options.getBoolean('caps');
    const capsThreshold = ctx.interaction.options.getInteger('caps_threshold');

    const updateData = {};

    if (status !== null) {
      await helpers.updateSettings(ctx.guild.id, { 'modules.automod': status });
    }

    if (spam !== null || spamMax !== null || spamPunishment !== null) {
      updateData.antiSpam = {
        ...automodConfig.antiSpam,
        ...(spam !== null && { enabled: spam }),
        ...(spamMax !== null && { maxMessages: spamMax }),
        ...(spamPunishment !== null && { punishment: spamPunishment })
      };
    }

    if (link !== null || linkWhitelist !== null) {
      let whitelist = automodConfig.antiLink?.whitelist || [];
      if (linkWhitelist) {
        const domains = linkWhitelist.split(',').map(d => d.trim()).filter(d => d.length > 0);
        whitelist = [...new Set([...whitelist, ...domains])];
      }
      updateData.antiLink = {
        ...automodConfig.antiLink,
        ...(link !== null && { enabled: link }),
        whitelist
      };
    }

    if (badwords !== null || badwordsAdd !== null) {
      let words = automodConfig.badWords?.words || [];
      if (badwordsAdd) {
        const newWords = badwordsAdd.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
        words = [...new Set([...words, ...newWords])];
      }
      updateData.badWords = {
        ...automodConfig.badWords,
        ...(badwords !== null && { enabled: badwords }),
        words
      };
    }

    if (mention !== null || mentionMax !== null) {
      updateData.antiMention = {
        ...automodConfig.antiMention,
        ...(mention !== null && { enabled: mention }),
        ...(mentionMax !== null && { maxMentions: mentionMax })
      };
    }

    if (caps !== null || capsThreshold !== null) {
      updateData.antiCaps = {
        ...automodConfig.antiCaps,
        ...(caps !== null && { enabled: caps }),
        ...(capsThreshold !== null && { threshold: capsThreshold })
      };
    }

    if (Object.keys(updateData).length === 0 && status === null) {
      return await ctx.sendError('Pilihlah minimal satu opsi AutoMod untuk dikonfigurasi!');
    }

    if (Object.keys(updateData).length > 0) {
      await AutoModConfig.update(updateData, { where: { guildId: ctx.guild.id } });
    }

    await ctx.sendSuccess('Konfigurasi AutoMod berhasil diperbarui!');
  },

  async executeAutoModLegacy(ctx) {
    const subOption = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const val = ctx.args.slice(2).join(' ');

    let automodConfig = await AutoModConfig.findOne({ where: { guildId: ctx.guild.id } });
    if (!automodConfig) automodConfig = await AutoModConfig.create({ guildId: ctx.guild.id });

    if (subOption === 'status') {
      const bool = val === 'true';
      await helpers.updateSettings(ctx.guild.id, { 'modules.automod': bool });
      return ctx.sendSuccess(`AutoMod system status diset ke: **${bool}**`);
    } else if (subOption === 'spam') {
      const bool = ctx.args[2] === 'true';
      const max = parseInt(ctx.args[3]) || 5;
      const punishment = ctx.args[4] || 'delete';
      await AutoModConfig.update({
        antiSpam: { enabled: bool, maxMessages: max, interval: 5000, punishment }
      }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Anti-Spam diset ke: **${bool}** (Max: ${max}, Hukuman: ${punishment})`);
    } else if (subOption === 'link') {
      const bool = ctx.args[2] === 'true';
      let whitelist = automodConfig.antiLink?.whitelist || [];
      if (ctx.args[3]) {
        whitelist = ctx.args[3].split(',').map(d => d.trim());
      }
      await AutoModConfig.update({
        antiLink: { enabled: bool, whitelist, punishment: 'delete' }
      }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Anti-Link diset ke: **${bool}** (Whitelist: ${whitelist.join(', ')})`);
    } else if (subOption === 'badwords') {
      const bool = ctx.args[2] === 'true';
      let words = automodConfig.badWords?.words || [];
      if (ctx.args[3]) {
        words = ctx.args[3].split(',').map(w => w.trim().toLowerCase());
      }
      await AutoModConfig.update({
        badWords: { enabled: bool, words, wildcardMatch: false, punishment: 'delete' }
      }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Bad-Words diset ke: **${bool}** (Jumlah kata: ${words.length})`);
    } else if (subOption === 'mention') {
      const bool = ctx.args[2] === 'true';
      const max = parseInt(ctx.args[3]) || 5;
      await AutoModConfig.update({
        antiMention: { enabled: bool, maxMentions: max, punishment: 'delete' }
      }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Anti-Mention diset ke: **${bool}** (Max: ${max})`);
    } else if (subOption === 'caps') {
      const bool = ctx.args[2] === 'true';
      const threshold = parseInt(ctx.args[3]) || 70;
      await AutoModConfig.update({
        antiCaps: { enabled: bool, threshold, minLength: 10, punishment: 'delete' }
      }, { where: { guildId: ctx.guild.id } });
      return ctx.sendSuccess(`Anti-Caps diset ke: **${bool}** (Threshold: ${threshold}%)`);
    } else {
      return ctx.sendError('Opsi tidak valid! Gunakan: `status`, `spam`, `link`, `badwords`, `mention`, atau `caps`.');
    }
  },

  async executeReactionRole(ctx) {
    await ctx.deferReply();
    const channel = ctx.interaction.options.getChannel('channel');
    const title = ctx.interaction.options.getString('title');
    const type = ctx.interaction.options.getString('type');
    const rolesData = ctx.interaction.options.getString('roles_data');

    const getRoleId = (str) => {
      const match = str.match(/\d+/);
      return match ? match[0] : null;
    };

    const pairs = rolesData.split(',').map(p => p.trim());
    const parsedReactions = [];

    for (const pair of pairs) {
      const parts = pair.split(':');
      if (parts.length < 2) continue;
      const emoji = parts[0].trim();
      const roleStr = parts[1].trim();
      const roleId = getRoleId(roleStr);

      if (emoji && roleId) {
        const role = ctx.guild.roles.cache.get(roleId);
        if (role) {
          parsedReactions.push({ emoji, roleId, description: role.name });
        }
      }
    }

    if (parsedReactions.length === 0) {
      return await ctx.sendError('Format data role/emoji tidak valid atau role tidak ditemukan di server ini!');
    }

    try {
      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(title)
        .setDescription(parsedReactions.map(r => `${r.emoji} — <@&${r.roleId}>`).join('\n'))
        .setFooter({ text: `Mode: ${type === 'unique' ? 'Satu Role' : type === 'verify' ? 'Verifikasi Sekali Klik' : 'Multi Role'}` })
        .setTimestamp();

      const panelMsg = await channel.send({ embeds: [embed] });

      for (const r of parsedReactions) {
        await panelMsg.react(r.emoji).catch(() => {});
      }

      await ReactionRole.create({
        guildId: ctx.guild.id,
        channelId: channel.id,
        messageId: panelMsg.id,
        title: title,
        type: type,
        reactions: parsedReactions
      });

      await ctx.sendSuccess(`Panel reaction role berhasil dibuat di <#${channel.id}>!`);
    } catch (error) {
      ctx.client.logger.error('Error saat membuat reaction role panel:', error);
      await ctx.sendError('Gagal membuat panel reaction role.');
    }
  },

  async executeReactionRoleLegacy(ctx) {
    // Legacy: !config reactionrole <#channel> <title> | <type> | <emoji:role,emoji:role...>
    const channel = ctx.message.mentions.channels.first();
    if (!channel) return ctx.sendError('Format salah! Gunakan: `!config reactionrole <#channel> <title> | <type> | <emoji:role,...>`');

    const rest = ctx.args.slice(2).join(' ').split('|');
    const title = rest[0]?.trim() || 'Pilih Role Anda';
    const type = rest[1]?.trim().toLowerCase() || 'normal';
    const rolesData = rest[2]?.trim();

    if (!rolesData) return ctx.sendError('Format data role/emoji salah!');

    if (!['normal', 'unique', 'verify'].includes(type)) {
      return ctx.sendError('Tipe tidak valid! Gunakan: `normal`, `unique`, atau `verify`.');
    }

    const getRoleId = (str) => {
      const match = str.match(/\d+/);
      return match ? match[0] : null;
    };

    const pairs = rolesData.split(',').map(p => p.trim());
    const parsedReactions = [];

    for (const pair of pairs) {
      const parts = pair.split(':');
      if (parts.length < 2) continue;
      const emoji = parts[0].trim();
      const roleStr = parts[1].trim();
      const roleId = getRoleId(roleStr);

      if (emoji && roleId) {
        const role = ctx.guild.roles.cache.get(roleId);
        if (role) {
          parsedReactions.push({ emoji, roleId, description: role.name });
        }
      }
    }

    if (parsedReactions.length === 0) {
      return ctx.sendError('Format data role/emoji tidak valid atau role tidak ditemukan!');
    }

    try {
      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle(title)
        .setDescription(parsedReactions.map(r => `${r.emoji} — <@&${r.roleId}>`).join('\n'))
        .setFooter({ text: `Mode: ${type === 'unique' ? 'Satu Role' : type === 'verify' ? 'Verifikasi Sekali Klik' : 'Multi Role'}` })
        .setTimestamp();

      const panelMsg = await channel.send({ embeds: [embed] });

      for (const r of parsedReactions) {
        await panelMsg.react(r.emoji).catch(() => {});
      }

      await ReactionRole.create({
        guildId: ctx.guild.id,
        channelId: channel.id,
        messageId: panelMsg.id,
        title: title,
        type: type,
        reactions: parsedReactions
      });

      return ctx.sendSuccess(`Panel reaction role berhasil dibuat di <#${channel.id}>!`);
    } catch (error) {
      ctx.client.logger.error('Error saat membuat reaction role panel legacy:', error);
      return ctx.sendError('Gagal membuat panel reaction role.');
    }
  },

  async executeTempVC(ctx) {
    await ctx.deferReply();
    const [config] = await TempVCConfig.findOrCreate({ where: { guildId: ctx.guild.id } });

    const status = ctx.interaction.options.getBoolean('status');
    const triggerChannel = ctx.interaction.options.getChannel('trigger_channel');
    const category = ctx.interaction.options.getChannel('category');
    const nameTemplate = ctx.interaction.options.getString('name_template');
    const userLimit = ctx.interaction.options.getInteger('user_limit');
    const bitrate = ctx.interaction.options.getInteger('bitrate');

    const updateData = {};
    if (status !== null) {
      updateData.enabled = status;
      await helpers.updateSettings(ctx.guild.id, { 'modules.tempvc': status });
    }
    if (triggerChannel !== null) updateData.triggerChannelId = triggerChannel.id;
    if (category !== null) updateData.categoryId = category.id;
    if (nameTemplate !== null) updateData.nameTemplate = nameTemplate;
    if (userLimit !== null) updateData.userLimit = userLimit;
    if (bitrate !== null) updateData.bitrate = bitrate;

    if (Object.keys(updateData).length === 0) {
      return await ctx.sendError('Pilihlah minimal satu opsi TempVC untuk dikonfigurasi!');
    }

    await config.update(updateData);
    await ctx.sendSuccess('Konfigurasi Temporary Voice Channel berhasil diperbarui!');
  },

  async executeTempVCLegacy(ctx) {
    const subOption = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const val = ctx.args.slice(2).join(' ');

    const [config] = await TempVCConfig.findOrCreate({ where: { guildId: ctx.guild.id } });

    if (subOption === 'status') {
      const bool = val === 'true';
      await config.update({ enabled: bool });
      await helpers.updateSettings(ctx.guild.id, { 'modules.tempvc': bool });
      return ctx.sendSuccess(`TempVC status diset ke: **${bool}**`);
    } else if (subOption === 'trigger') {
      const channel = ctx.message.mentions.channels.first() || ctx.guild.channels.cache.get(val);
      if (!channel || channel.type !== ChannelType.GuildVoice) return ctx.sendError('Tentukan voice channel pemicu yang valid!');
      await config.update({ triggerChannelId: channel.id });
      return ctx.sendSuccess(`TempVC trigger channel diset ke: ${channel}`);
    } else if (subOption === 'category') {
      const category = ctx.guild.channels.cache.get(val);
      if (!category || category.type !== ChannelType.GuildCategory) return ctx.sendError('Tentukan ID category channel yang valid!');
      await config.update({ categoryId: category.id });
      return ctx.sendSuccess(`TempVC category diset ke: \`${category.name}\``);
    } else if (subOption === 'template') {
      if (!val) return ctx.sendError('Masukkan template nama room!');
      await config.update({ nameTemplate: val });
      return ctx.sendSuccess(`TempVC name template diset ke: \`${val}\``);
    } else {
      return ctx.sendError('Opsi tidak valid! Gunakan: `status`, `trigger`, `category`, atau `template`.');
    }
  },

  async executeAutoresponder(ctx) {
    await ctx.deferReply();
    const action = ctx.interaction.options.getString('action');
    const [config] = await Autoresponder.findOrCreate({ where: { guildId: ctx.guild.id } });

    let triggers = config.triggers || [];

    if (action === 'add') {
      const trigger = ctx.interaction.options.getString('trigger');
      const response = ctx.interaction.options.getString('response');
      const matchType = ctx.interaction.options.getString('match_type') || 'exact';

      if (!trigger || !response) {
        return await ctx.sendError('Pemicu (trigger) dan respon harus ditentukan untuk menambah autoresponder!');
      }

      const id = `ar_${Date.now()}`;
      triggers.push({
        id,
        trigger: trigger.toLowerCase(),
        response,
        matchType,
        caseSensitive: false,
        cooldown: 5,
        lastTriggered: null,
        deleteOriginal: false,
        replyDM: false
      });

      await config.update({ triggers });
      await helpers.updateSettings(ctx.guild.id, { 'modules.autoresponder': true });
      await ctx.sendSuccess(`Autoresponder berhasil ditambahkan!\n• Trigger: \`${trigger}\`\n• Match Type: \`${matchType}\`\n• ID: \`${id}\``);

    } else if (action === 'remove') {
      const id = ctx.interaction.options.getString('id');
      if (!id) return await ctx.sendError('Harap tentukan ID trigger yang ingin dihapus!');

      const exists = triggers.find(t => t.id === id);
      if (!exists) return await ctx.sendError(`Trigger dengan ID \`${id}\` tidak ditemukan.`);

      triggers = triggers.filter(t => t.id !== id);
      await config.update({ triggers });
      
      if (triggers.length === 0) {
        await helpers.updateSettings(ctx.guild.id, { 'modules.autoresponder': false });
      }

      await ctx.sendSuccess(`Trigger dengan ID \`${id}\` berhasil dihapus.`);

    } else if (action === 'list') {
      if (triggers.length === 0) {
        return await ctx.reply('Tidak ada autoresponder yang dikonfigurasi di server ini.');
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('📣 Daftar Autoresponder Server')
        .setDescription(triggers.map(t => `• **ID:** \`${t.id}\` | Trigger: \`${t.trigger}\` | Tipe: \`${t.matchType}\`\n  Respon: ${t.response.substring(0, 50)}${t.response.length > 50 ? '...' : ''}`).join('\n\n'))
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });
    }
  },

  async executeAutoresponderLegacy(ctx) {
    const action = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const [config] = await Autoresponder.findOrCreate({ where: { guildId: ctx.guild.id } });

    let triggers = config.triggers || [];

    if (action === 'add') {
      const rest = ctx.args.slice(2).join(' ').split('|');
      const trigger = rest[0]?.trim();
      const response = rest[1]?.trim();
      const matchType = rest[2]?.trim().toLowerCase() || 'exact';

      if (!trigger || !response) {
        return ctx.sendError('Format salah! Gunakan: `!config autoresponder add <trigger> | <response> | [match_type]`');
      }

      const id = `ar_${Date.now()}`;
      triggers.push({
        id,
        trigger: trigger.toLowerCase(),
        response,
        matchType,
        caseSensitive: false,
        cooldown: 5,
        lastTriggered: null,
        deleteOriginal: false,
        replyDM: false
      });

      await config.update({ triggers });
      await helpers.updateSettings(ctx.guild.id, { 'modules.autoresponder': true });
      return ctx.sendSuccess(`Autoresponder berhasil ditambahkan!\n• Trigger: \`${trigger}\`\n• ID: \`${id}\``);

    } else if (action === 'remove') {
      const id = ctx.args[2];
      if (!id) return ctx.sendError('Tentukan ID trigger yang ingin dihapus!');

      const exists = triggers.find(t => t.id === id);
      if (!exists) return ctx.sendError('ID trigger tidak ditemukan.');

      triggers = triggers.filter(t => t.id !== id);
      await config.update({ triggers });

      if (triggers.length === 0) {
        await helpers.updateSettings(ctx.guild.id, { 'modules.autoresponder': false });
      }

      return ctx.sendSuccess(`Trigger dengan ID \`${id}\` berhasil dihapus.`);

    } else if (action === 'list') {
      if (triggers.length === 0) {
        return ctx.reply('Tidak ada autoresponder yang dikonfigurasi di server ini.');
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('📣 Daftar Autoresponder Server')
        .setDescription(triggers.map(t => `• **ID:** \`${t.id}\` | Trigger: \`${t.trigger}\` | Tipe: \`${t.matchType}\`\n  Respon: ${t.response}`).join('\n\n'))
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    } else {
      return ctx.sendError('Format salah! Gunakan `add`, `remove`, atau `list`.');
    }
  },

  async executeStats(ctx) {
    await ctx.deferReply();
    const action = ctx.interaction.options.getString('action');
    const [config] = await StatsConfig.findOrCreate({ where: { guildId: ctx.guild.id } });

    let channels = config.channels || [];

    if (action === 'add') {
      const type = ctx.interaction.options.getString('type');
      const template = ctx.interaction.options.getString('template');
      let targetChannel = ctx.interaction.options.getChannel('channel');

      if (!type || !template) {
        return await ctx.sendError('Tipe stat dan template nama harus ditentukan!');
      }

      if (!targetChannel) {
        // Buat voice channel baru jika tidak ditentukan
        try {
          targetChannel = await ctx.guild.channels.create({
            name: template.replace('{value}', '...'),
            type: ChannelType.GuildVoice,
            permissionOverwrites: [
              {
                id: ctx.guild.roles.everyone.id,
                deny: [PermissionFlagsBits.Connect] // Agar member biasa tidak masuk
              }
            ]
          });
        } catch (err) {
          logger.error('Gagal membuat voice channel untuk stats:', err);
          return await ctx.sendError('Gagal membuat voice channel baru untuk stats.');
        }
      }

      const id = `stat_${Date.now()}`;
      channels.push({
        id,
        channelId: targetChannel.id,
        type,
        template
      });

      await config.update({ channels });
      await helpers.updateSettings(ctx.guild.id, { 'modules.stats': true });
      await ctx.sendSuccess(`Stats channel berhasil ditambahkan!\n• Tipe: \`${type}\`\n• Channel: <#${targetChannel.id}>\n• ID: \`${id}\``);

      // Trigger update langsung
      try {
        const statsUpdater = require('../../modules/stats/statsUpdater');
        if (statsUpdater && typeof statsUpdater.updateStats === 'function') {
          await statsUpdater.updateStats(ctx.client, ctx.guild.id);
        }
      } catch (e) {
        logger.error('Gagal memicu update langsung stats:', e);
      }

    } else if (action === 'remove') {
      const id = ctx.interaction.options.getString('id');
      if (!id) return await ctx.sendError('Harap tentukan ID stats yang ingin dihapus!');

      const exists = channels.find(c => c.id === id);
      if (!exists) return await ctx.sendError(`Stats channel dengan ID \`${id}\` tidak ditemukan.`);

      // Hapus channel Discord
      const chan = ctx.guild.channels.cache.get(exists.channelId);
      if (chan) {
        await chan.delete('Menghapus stats channel.').catch(() => {});
      }

      channels = channels.filter(c => c.id !== id);
      await config.update({ channels });

      if (channels.length === 0) {
        await helpers.updateSettings(ctx.guild.id, { 'modules.stats': false });
      }

      await ctx.sendSuccess(`Stats channel dengan ID \`${id}\` berhasil dihapus.`);

    } else if (action === 'list') {
      if (channels.length === 0) {
        return await ctx.reply('Tidak ada stats channel yang dikonfigurasi di server ini.');
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('📈 Daftar Stats Channels Server')
        .setDescription(channels.map(c => `• **ID:** \`${c.id}\` | Tipe: \`${c.type}\` | Channel: <#${c.channelId}>\n  Template: \`${c.template}\``).join('\n\n'))
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });
    }
  },

  async executeStatsLegacy(ctx) {
    const action = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const [config] = await StatsConfig.findOrCreate({ where: { guildId: ctx.guild.id } });

    let channels = config.channels || [];

    if (action === 'add') {
      const rest = ctx.args.slice(2).join(' ').split('|');
      const type = rest[0]?.trim();
      const template = rest[1]?.trim();
      const channelId = rest[2]?.trim();

      if (!type || !template) {
        return ctx.sendError('Format salah! Gunakan: `!config stats add <type> | <template> | [channel_id]`');
      }

      const validTypes = ['totalMembers', 'onlineMembers', 'bots', 'humans', 'boosts', 'channels', 'roles'];
      if (!validTypes.includes(type)) {
        return ctx.sendError(`Tipe tidak valid! Pilihlah dari: ${validTypes.join(', ')}`);
      }

      let targetChannel = null;
      if (channelId) {
        targetChannel = ctx.guild.channels.cache.get(channelId);
      }

      if (!targetChannel) {
        try {
          targetChannel = await ctx.guild.channels.create({
            name: template.replace('{value}', '...'),
            type: ChannelType.GuildVoice,
            permissionOverwrites: [
              {
                id: ctx.guild.roles.everyone.id,
                deny: [PermissionFlagsBits.Connect]
              }
            ]
          });
        } catch (err) {
          logger.error('Gagal membuat channel voice stats legacy:', err);
          return ctx.sendError('Gagal membuat channel voice baru.');
        }
      }

      const id = `stat_${Date.now()}`;
      channels.push({
        id,
        channelId: targetChannel.id,
        type,
        template
      });

      await config.update({ channels });
      await helpers.updateSettings(ctx.guild.id, { 'modules.stats': true });
      
      // Trigger update langsung
      try {
        const statsUpdater = require('../../modules/stats/statsUpdater');
        if (statsUpdater && typeof statsUpdater.updateStats === 'function') {
          await statsUpdater.updateStats(ctx.client, ctx.guild.id);
        }
      } catch (e) {}

      return ctx.sendSuccess(`Stats channel berhasil ditambahkan!\n• Channel: <#${targetChannel.id}>\n• ID: \`${id}\``);

    } else if (action === 'remove') {
      const id = ctx.args[2];
      if (!id) return ctx.sendError('Tentukan ID stats yang ingin dihapus!');

      const exists = channels.find(c => c.id === id);
      if (!exists) return ctx.sendError('ID stats tidak ditemukan.');

      const chan = ctx.guild.channels.cache.get(exists.channelId);
      if (chan) {
        await chan.delete().catch(() => {});
      }

      channels = channels.filter(c => c.id !== id);
      await config.update({ channels });

      if (channels.length === 0) {
        await helpers.updateSettings(ctx.guild.id, { 'modules.stats': false });
      }

      return ctx.sendSuccess(`Stats channel dengan ID \`${id}\` berhasil dihapus.`);

    } else if (action === 'list') {
      if (channels.length === 0) {
        return ctx.reply('Tidak ada stats channel yang dikonfigurasi di server ini.');
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('📈 Daftar Stats Channels Server')
        .setDescription(channels.map(c => `• **ID:** \`${c.id}\` | Tipe: \`${c.type}\` | Channel: <#${c.channelId}>\n  Template: \`${c.template}\``).join('\n\n'))
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    } else {
      return ctx.sendError('Gunakan opsi `add`, `remove`, atau `list`.');
    }
  },

  async executeManagers(ctx) {
    // Hanya Server Administrator atau Bot Owner yang bisa mengelola managers
    const isOwner = permissions.isBotOwner(ctx.user);
    const isAdmin = ctx.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isOwner && !isAdmin) {
      return await ctx.sendError('Hanya Server Administrator yang boleh mengelola Bot Manager!');
    }

    await ctx.deferReply();
    const action = ctx.interaction.options.getString('action');
    const type = ctx.interaction.options.getString('type');
    const role = ctx.interaction.options.getRole('role');
    const user = ctx.interaction.options.getUser('user');

    const settings = await helpers.getSettings(ctx.guild.id);
    let managerRoles = settings.managerRoles || [];
    let managerUsers = settings.managerUsers || [];

    if (action === 'add') {
      if (!type) return await ctx.sendError('Tentukan tipe manager yang ingin ditambahkan (role atau user)!');

      if (type === 'role') {
        if (!role) return await ctx.sendError('Tentukan role yang ingin ditambahkan!');
        if (managerRoles.includes(role.id)) return await ctx.sendError('Role tersebut sudah terdaftar sebagai Bot Manager.');
        managerRoles.push(role.id);
        await helpers.updateSettings(ctx.guild.id, { managerRoles });
        await ctx.sendSuccess(`Role <@&${role.id}> berhasil ditambahkan sebagai Bot Manager!`);
      } else {
        if (!user) return await ctx.sendError('Tentukan user yang ingin ditambahkan!');
        if (managerUsers.includes(user.id)) return await ctx.sendError('User tersebut sudah terdaftar sebagai Bot Manager.');
        managerUsers.push(user.id);
        await helpers.updateSettings(ctx.guild.id, { managerUsers });
        await ctx.sendSuccess(`User <@${user.id}> berhasil ditambahkan sebagai Bot Manager!`);
      }

    } else if (action === 'remove') {
      if (!type) return await ctx.sendError('Tentukan tipe manager yang ingin dihapus (role atau user)!');

      if (type === 'role') {
        if (!role) return await ctx.sendError('Tentukan role yang ingin dihapus!');
        if (!managerRoles.includes(role.id)) return await ctx.sendError('Role tersebut tidak terdaftar sebagai Bot Manager.');
        managerRoles = managerRoles.filter(id => id !== role.id);
        await helpers.updateSettings(ctx.guild.id, { managerRoles });
        await ctx.sendSuccess(`Role <@&${role.id}> berhasil dihapus dari Bot Manager.`);
      } else {
        if (!user) return await ctx.sendError('Tentukan user yang ingin dihapus!');
        if (!managerUsers.includes(user.id)) return await ctx.sendError('User tersebut tidak terdaftar sebagai Bot Manager.');
        managerUsers = managerUsers.filter(id => id !== user.id);
        await helpers.updateSettings(ctx.guild.id, { managerUsers });
        await ctx.sendSuccess(`User <@${user.id}> berhasil dihapus dari Bot Manager.`);
      }

    } else if (action === 'list') {
      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('🔑 Daftar Bot Managers Server')
        .addFields(
          { name: 'Roles', value: managerRoles.map(id => `<@&${id}>`).join(', ') || '*Tidak ada*', inline: false },
          { name: 'Users', value: managerUsers.map(id => `<@${id}>`).join(', ') || '*Tidak ada*', inline: false }
        )
        .setFooter({ text: 'SERVER ADMINISTRATOR selalu dapat menggunakan perintah /config' })
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });
    }
  },

  async executeManagersLegacy(ctx) {
    const isOwner = permissions.isBotOwner(ctx.user);
    const isAdmin = ctx.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isOwner && !isAdmin) {
      return ctx.sendError('Hanya Server Administrator yang boleh mengelola Bot Manager!');
    }

    const action = ctx.args[1] ? ctx.args[1].toLowerCase() : '';
    const type = ctx.args[2] ? ctx.args[2].toLowerCase() : '';

    const settings = await helpers.getSettings(ctx.guild.id);
    let managerRoles = settings.managerRoles || [];
    let managerUsers = settings.managerUsers || [];

    if (action === 'add') {
      if (type === 'role') {
        const role = ctx.message.mentions.roles.first();
        if (!role) return ctx.sendError('Mention role yang ingin ditambahkan! Format: `!config managers add role @Role`');
        if (managerRoles.includes(role.id)) return ctx.sendError('Role sudah terdaftar sebagai Bot Manager.');
        managerRoles.push(role.id);
        await helpers.updateSettings(ctx.guild.id, { managerRoles });
        return ctx.sendSuccess(`Role ${role} ditambahkan sebagai Bot Manager!`);
      } else if (type === 'user') {
        const user = ctx.message.mentions.users.first();
        if (!user) return ctx.sendError('Mention user yang ingin ditambahkan! Format: `!config managers add user @User`');
        if (managerUsers.includes(user.id)) return ctx.sendError('User sudah terdaftar sebagai Bot Manager.');
        managerUsers.push(user.id);
        await helpers.updateSettings(ctx.guild.id, { managerUsers });
        return ctx.sendSuccess(`User ${user} ditambahkan sebagai Bot Manager!`);
      } else {
        return ctx.sendError('Format salah! Gunakan: `!config managers add [role/user] <mention>`');
      }

    } else if (action === 'remove') {
      if (type === 'role') {
        const role = ctx.message.mentions.roles.first();
        if (!role) return ctx.sendError('Mention role yang ingin dihapus! Format: `!config managers remove role @Role`');
        if (!managerRoles.includes(role.id)) return ctx.sendError('Role tidak terdaftar sebagai Bot Manager.');
        managerRoles = managerRoles.filter(id => id !== role.id);
        await helpers.updateSettings(ctx.guild.id, { managerRoles });
        return ctx.sendSuccess(`Role ${role} dihapus dari Bot Manager.`);
      } else if (type === 'user') {
        const user = ctx.message.mentions.users.first();
        if (!user) return ctx.sendError('Mention user yang ingin dihapus! Format: `!config managers remove user @User`');
        if (!managerUsers.includes(user.id)) return ctx.sendError('User tidak terdaftar sebagai Bot Manager.');
        managerUsers = managerUsers.filter(id => id !== user.id);
        await helpers.updateSettings(ctx.guild.id, { managerUsers });
        return ctx.sendSuccess(`User ${user} dihapus dari Bot Manager.`);
      } else {
        return ctx.sendError('Format salah! Gunakan: `!config managers remove [role/user] <mention>`');
      }

    } else if (action === 'list') {
      const embed = new EmbedBuilder()
        .setColor(COLORS.DEFAULT)
        .setTitle('🔑 Daftar Bot Managers Server')
        .addFields(
          { name: 'Roles', value: managerRoles.map(id => `<@&${id}>`).join(', ') || '*Tidak ada*', inline: false },
          { name: 'Users', value: managerUsers.map(id => `<@${id}>`).join(', ') || '*Tidak ada*', inline: false }
        )
        .setFooter({ text: 'SERVER ADMINISTRATOR selalu dapat menggunakan perintah /config' })
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    } else {
      return ctx.sendError('Gunakan aksi: `add`, `remove`, atau `list`.');
    }
  },

  async executeReset(ctx) {
    const isOwner = permissions.isBotOwner(ctx.user);
    const isAdmin = ctx.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isOwner && !isAdmin) {
      return await ctx.sendError('Hanya Server Administrator yang boleh mereset konfigurasi server!');
    }

    await ctx.deferReply();

    try {
      // Hapus data / reset ke default
      const defaultModules = {
        welcome: true,
        leave: true,
        automod: false,
        leveling: false,
        music: true,
        ticket: false,
        giveaway: true,
        autoresponder: false,
        stats: false
      };
      
      const defaultAllowedChannels = {
        music: [],
        commands: [],
        leveling: []
      };

      await helpers.updateSettings(ctx.guild.id, {
        prefix: '!',
        language: 'id',
        modules: defaultModules,
        allowedChannels: defaultAllowedChannels,
        ignoredChannels: [],
        managerRoles: [],
        managerUsers: [],
        modLogChannelId: null,
        serverLogChannelId: null
      });

      // Hapus atau reset model konfigurasi terkait
      await WelcomeConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await MusicConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await TicketConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await AutoModConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await TempVCConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await Autoresponder.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await StatsConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});

      await ctx.sendSuccess('Seluruh konfigurasi server berhasil di-reset ke nilai default bawaan bot.');
    } catch (err) {
      ctx.client.logger.error('Gagal mereset guild config:', err);
      await ctx.sendError('Gagal mereset konfigurasi server.');
    }
  },

  async executeResetLegacy(ctx) {
    const isOwner = permissions.isBotOwner(ctx.user);
    const isAdmin = ctx.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isOwner && !isAdmin) {
      return ctx.sendError('Hanya Server Administrator yang boleh mereset konfigurasi server!');
    }

    try {
      const defaultModules = {
        welcome: true,
        leave: true,
        automod: false,
        leveling: false,
        music: true,
        ticket: false,
        giveaway: true,
        autoresponder: false,
        stats: false
      };
      
      const defaultAllowedChannels = {
        music: [],
        commands: [],
        leveling: []
      };

      await helpers.updateSettings(ctx.guild.id, {
        prefix: '!',
        language: 'id',
        modules: defaultModules,
        allowedChannels: defaultAllowedChannels,
        ignoredChannels: [],
        managerRoles: [],
        managerUsers: [],
        modLogChannelId: null,
        serverLogChannelId: null
      });

      await WelcomeConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await MusicConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await TicketConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await AutoModConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await TempVCConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await Autoresponder.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});
      await StatsConfig.destroy({ where: { guildId: ctx.guild.id } }).catch(() => {});

      return ctx.sendSuccess('Seluruh konfigurasi server berhasil di-reset ke nilai default bawaan bot.');
    } catch (err) {
      return ctx.sendError('Gagal mereset konfigurasi server.');
    }
  }
};
