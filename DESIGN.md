# 🤖 MonoHex — Discord Bot Design Document

> **Versi Dokumen:** 1.1.0  
> **Status:** Draft  
> **Bot Name:** MonoHex  
> **Target:** Multi-guild, fully configurable Discord bot

---

## 📋 Daftar Isi

1. [Overview](#1-overview)
2. [Rekomendasi Tech Stack](#2-rekomendasi-tech-stack)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Struktur Folder](#4-struktur-folder)
5. [Environment Variables](#5-environment-variables)
6. [Database Schemas](#6-database-schemas)
7. [Fitur Lengkap](#7-fitur-lengkap)
8. [Daftar Commands](#8-daftar-commands)
9. [Daftar Events](#9-daftar-events)
10. [Sistem Konfigurasi In-Discord](#10-sistem-konfigurasi-in-discord)
11. [Permission & Role System](#11-permission--role-system)
12. [Deployment Guide (Gratis)](#12-deployment-guide-gratis)
13. [Roadmap Pengembangan](#13-roadmap-pengembangan)

> **Changelog v1.1.0:** Tambah fitur Bot Manager Role System (7.14), Ticket System revamp dengan alur archive (7.5), dan Temporary Voice Channel (7.15).

---

## 1. Overview

**MonoHex** adalah Discord bot multi-fungsi yang dirancang untuk menjadi solusi lengkap bagi server Discord. Bot ini mendukung konfigurasi mandiri langsung dari Discord (tanpa perlu edit file), memiliki sistem modular agar mudah dikelola, dan mendukung hybrid commands (slash + prefix).

### Filosofi Desain

- **Modular:** Setiap fitur adalah modul terpisah yang bisa di-enable/disable per guild
- **Configurable:** Semua pengaturan bisa dilakukan via Discord (slash commands + modal/select menu)
- **Scalable:** Mendukung banyak guild secara bersamaan dengan data tersimpan per guild
- **Reliable:** Error handling menyeluruh, logging internal, dan auto-reconnect

---

## 2. Rekomendasi Tech Stack

| Layer                | Teknologi                 | Alasan                                                     |
| -------------------- | ------------------------- | ---------------------------------------------------------- |
| **Runtime**          | Node.js v18+ (LTS)        | Ekosistem terbesar, paling banyak dukungan library Discord |
| **Discord Library**  | discord.js v14            | Paling up-to-date, support Slash Commands & Threads        |
| **Database**         | PostgreSQL v18.4          | PostgreSQL database engine                                 |
| **ORM**              | Sequelize                 | Object-Relational Mapping (ORM) untuk PostgreSQL           |
| **Music Engine**     | discord-player v6         | All-in-one: YouTube, Spotify, SoundCloud, queue, filter    |
| **Music Extractors** | @discord-player/extractor | Plugin resmi untuk YouTube & Spotify di discord-player     |
| **Spotify API**      | spotify-web-api-node      | Ambil metadata playlist/track Spotify                      |
| **HTTP Client**      | axios                     | Untuk request ke API eksternal                             |
| **Logger**           | winston                   | Logging dengan level & file output                         |
| **Scheduler**        | node-cron                 | Giveaway countdown, stat channel update, dll               |
| **Config**           | dotenv                    | Management environment variables                           |
| **Dev Tools**        | nodemon                   | Auto-restart saat development                              |
| **Hosting**          | Railway.app / Discloud    | Free tier, support Node.js, mudah deploy                   |

### Mengapa discord-player v6 untuk musik?

discord-player v6 menangani seluruh kompleksitas musik: stream dari YouTube, resolusi Spotify (ambil metadata → cari di YouTube → stream), queue management, filter audio (bass boost, nightcore, dll), dan loop mode. Jauh lebih efisien daripada membangun sendiri dari nol.

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    Discord Gateway                       │
│                  (WebSocket Events)                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   MonoHex Client                         │
│              (Extended Discord.Client)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Command      │ │ Event        │ │ Component        │ │
│  │ Handler      │ │ Handler      │ │ Handler          │ │
│  │ (/ & prefix) │ │ (on events)  │ │ (buttons/modals) │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
└──────────┬────────────────┬────────────────┬────────────┘
           │                │                │
     ┌─────▼──────┐  ┌──────▼─────┐  ┌──────▼──────┐
     │  Commands  │  │  Modules   │  │  Utilities  │
     │  /music    │  │  automod   │  │  embeds     │
     │  /config   │  │  leveling  │  │  logger     │
     │  /mod      │  │  welcome   │  │  helpers    │
     │  /ticket   │  │  giveaway  │  │  perms      │
     └────────────┘  └────────────┘  └─────────────┘
                           │
                     ┌──────▼──────┐
                     │ PostgreSQL  │
                     │  Database   │
                     │  (per guild │
                     │   config)   │
                     └─────────────┘
```

### Pola Komunikasi

- **Client → Discord:** REST API (send messages, edit, delete)
- **Discord → Client:** WebSocket Events (message, interaction, memberJoin, dll)
- **Client → PostgreSQL:** Sequelize queries (CRUD per guild)
- **Command Handler:** Otomatis load semua file di `/commands/**/*.js`
- **Event Handler:** Otomatis load semua file di `/events/**/*.js`

---

## 4. Struktur Folder

```
monohex/
├── src/
│   ├── index.js                    # Entry point, inisialisasi client
│   ├── client.js                   # Custom Client class (extend Discord.Client)
│   │
│   ├── handlers/                   # Core handler system
│   │   ├── commandHandler.js       # Load & register slash + prefix commands
│   │   ├── eventHandler.js         # Load semua event listeners
│   │   ├── componentHandler.js     # Handle buttons, select menus, modals
│   │   └── cooldownHandler.js      # Manage command cooldowns per user/guild
│   │
│   ├── commands/                   # Semua commands, dikelompokkan per kategori
│   │   ├── config/                 # Konfigurasi bot per server
│   │   │   ├── config-welcome.js
│   │   │   ├── config-leave.js
│   │   │   ├── config-autorole.js
│   │   │   ├── config-reactionrole.js
│   │   │   ├── config-music.js
│   │   │   ├── config-ticket.js
│   │   │   ├── config-automod.js
│   │   │   ├── config-logs.js
│   │   │   ├── config-leveling.js
│   │   │   ├── config-stats.js
│   │   │   ├── config-channels.js  # Atur channel mana yang bisa pakai fitur apa
│   │   │   └── config-prefix.js
│   │   │
│   │   ├── music/
│   │   │   ├── play.js
│   │   │   ├── pause.js
│   │   │   ├── resume.js
│   │   │   ├── skip.js
│   │   │   ├── stop.js
│   │   │   ├── queue.js
│   │   │   ├── nowplaying.js
│   │   │   ├── volume.js
│   │   │   ├── loop.js
│   │   │   ├── shuffle.js
│   │   │   ├── remove.js
│   │   │   ├── move.js
│   │   │   ├── seek.js
│   │   │   ├── filter.js
│   │   │   ├── lyrics.js
│   │   │   └── 247.js
│   │   │
│   │   ├── moderation/
│   │   │   ├── ban.js
│   │   │   ├── kick.js
│   │   │   ├── timeout.js
│   │   │   ├── warn.js
│   │   │   ├── unwarn.js
│   │   │   ├── warnings.js
│   │   │   ├── unban.js
│   │   │   ├── softban.js
│   │   │   ├── mute.js
│   │   │   ├── unmute.js
│   │   │   ├── purge.js
│   │   │   ├── slowmode.js
│   │   │   ├── lock.js
│   │   │   ├── unlock.js
│   │   │   └── case.js
│   │   │
│   │   ├── ticket/
│   │   │   ├── ticket-setup.js     # Buat panel ticket
│   │   │   ├── ticket-close.js
│   │   │   ├── ticket-claim.js
│   │   │   ├── ticket-add.js
│   │   │   ├── ticket-remove.js
│   │   │   └── ticket-transcript.js
│   │   │
│   │   ├── leveling/
│   │   │   ├── rank.js
│   │   │   ├── leaderboard.js
│   │   │   ├── setxp.js
│   │   │   └── resetxp.js
│   │   │
│   │   ├── giveaway/
│   │   │   ├── giveaway-create.js
│   │   │   ├── giveaway-end.js
│   │   │   └── giveaway-reroll.js
│   │   │
│   │   ├── utility/
│   │   │   ├── serverinfo.js
│   │   │   ├── userinfo.js
│   │   │   ├── roleinfo.js
│   │   │   ├── channelinfo.js
│   │   │   ├── avatar.js
│   │   │   ├── banner.js
│   │   │   ├── poll.js
│   │   │   ├── embed.js
│   │   │   ├── reminder.js
│   │   │   ├── calculate.js
│   │   │   ├── translate.js
│   │   │   └── botinfo.js
│   │   │
│   │   └── fun/
│   │       ├── 8ball.js
│   │       ├── meme.js
│   │       ├── joke.js
│   │       ├── coinflip.js
│   │       ├── dice.js
│   │       └── trivia.js
│   │
│   ├── commands/tempvc/            # Temp Voice Channel commands
│   │   ├── vc-rename.js
│   │   ├── vc-limit.js
│   │   ├── vc-lock.js
│   │   ├── vc-unlock.js
│   │   ├── vc-kick.js
│   │   ├── vc-transfer.js
│   │   └── vc-info.js
│   │
│   ├── events/                     # Event listeners
│   │   ├── discord/
│   │   │   ├── ready.js            # Bot online
│   │   │   ├── guildMemberAdd.js   # Welcome + auto role
│   │   │   ├── guildMemberRemove.js# Leave message
│   │   │   ├── messageCreate.js    # Prefix commands + automod + leveling
│   │   │   ├── messageDelete.js    # Log pesan dihapus
│   │   │   ├── messageUpdate.js    # Log pesan diedit
│   │   │   ├── interactionCreate.js# Slash commands + components
│   │   │   ├── messageReactionAdd.js   # Reaction roles (add)
│   │   │   ├── messageReactionRemove.js# Reaction roles (remove)
│   │   │   ├── guildBanAdd.js      # Log ban
│   │   │   ├── guildBanRemove.js   # Log unban
│   │   │   ├── guildMemberUpdate.js# Log role/nickname change
│   │   │   ├── channelCreate.js    # Log channel dibuat
│   │   │   ├── channelDelete.js    # Log channel dihapus
│   │   │   ├── roleCreate.js       # Log role dibuat
│   │   │   ├── roleDelete.js       # Log role dihapus
│   │   │   ├── voiceStateUpdate.js # Log voice activity
│   │   │   └── guildCreate.js      # Setup default config saat bot join server baru
│   │   │
│   │   └── player/                 # discord-player events
│   │       ├── playerStart.js      # Notif lagu mulai
│   │       ├── playerFinish.js     # Notif lagu selesai
│   │       ├── playerError.js      # Handle error musik
│   │       ├── playerEmpty.js      # Queue habis
│   │       └── playerSkip.js       # Notif lagu di-skip
│   │
│   ├── modules/                    # Logika bisnis per fitur
│   │   ├── automod/
│   │   │   ├── index.js            # Entry & orchestrator automod
│   │   │   ├── antiSpam.js         # Rate limit pesan
│   │   │   ├── antiRaid.js         # Mass join detection
│   │   │   ├── antiLink.js         # Filter link
│   │   │   ├── badWords.js         # Filter kata kasar
│   │   │   ├── antiMention.js      # Anti mass mention
│   │   │   ├── antiCaps.js         # Anti huruf kapital berlebihan
│   │   │   ├── antiDuplicate.js    # Anti pesan duplikat
│   │   │   └── punishment.js       # Eskalasi hukuman otomatis
│   │   │
│   │   ├── welcome/
│   │   │   ├── sendWelcome.js
│   │   │   └── sendLeave.js
│   │   │
│   │   ├── leveling/
│   │   │   ├── xpManager.js        # Tambah XP, hitung level
│   │   │   ├── levelUpHandler.js   # Kirim notif naik level
│   │   │   └── rankCard.js         # Generate rank card image (Canvas)
│   │   │
│   │   ├── ticket/
│   │   │   ├── createTicket.js
│   │   │   ├── closeTicket.js
│   │   │   └── generateTranscript.js
│   │   │
│   │   ├── giveaway/
│   │   │   ├── giveawayManager.js
│   │   │   └── giveawayScheduler.js
│   │   │
│   │   └── stats/
│   │       └── statsUpdater.js     # Update voice channel stats setiap interval
│   │
│   ├── modules/tempvc/             # Temporary Voice Channel module
│   │   ├── createTempVC.js         # Buat voice channel saat user join trigger
│   │   ├── deleteTempVC.js         # Hapus channel saat kosong
│   │   └── transferOwnership.js    # Transfer owner saat owner keluar
│   │
│   ├── models/                     # Sequelize models
│   │   ├── GuildConfig.js
│   │   ├── WelcomeConfig.js
│   │   ├── ReactionRole.js
│   │   ├── MusicConfig.js
│   │   ├── TicketConfig.js
│   │   ├── Ticket.js
│   │   ├── AutoModConfig.js
│   │   ├── UserXP.js
│   │   ├── Warning.js
│   │   ├── Giveaway.js
│   │   ├── Autoresponder.js
│   │   ├── StatsConfig.js
│   │   ├── TempVCConfig.js         # Konfigurasi TempVC per guild
│   │   └── TempVC.js               # Tracking active temp voice channels
│   │
│   └── utils/
│       ├── embeds.js               # Builder embed standar (sukses, error, info)
│       ├── permissions.js          # Cek permission user & channel whitelist
│       ├── logger.js               # winston logger
│       ├── helpers.js              # Fungsi utilitas umum
│       ├── formatTime.js           # Format durasi musik
│       └── constants.js            # Konstanta global (warna, emoji, dll)
│
├── .env                            # Environment variables (jangan di-commit!)
├── .env.example                    # Template env untuk deployment
├── .gitignore
├── package.json
└── README.md
```

---

## 5. Environment Variables

```env
# ─── Discord ─────────────────────────────────
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
GUILD_ID=your_dev_guild_id          # Untuk slash command dev mode

# ─── Database ────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/monohex

# ─── Spotify API ─────────────────────────────
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# ─── Bot Settings ────────────────────────────
DEFAULT_PREFIX=!
DEFAULT_LANGUAGE=id                 # id = Bahasa Indonesia, en = English
BOT_OWNERS=owner_id1,owner_id2      # ID owner untuk akses bot-owner commands

# ─── Optional APIs ───────────────────────────
GENIUS_TOKEN=your_genius_token      # Untuk fitur /lyrics
```

---

## 6. Database Schemas

### 6.1 GuildConfig — Konfigurasi utama per server

```js
{
  guildId: String (unique, required),
  prefix: { type: String, default: "!" },
  language: { type: String, default: "id" },
  modules: {
    welcome:      { type: Boolean, default: true },
    leave:        { type: Boolean, default: true },
    automod:      { type: Boolean, default: false },
    leveling:     { type: Boolean, default: false },
    music:        { type: Boolean, default: true },
    ticket:       { type: Boolean, default: false },
    giveaway:     { type: Boolean, default: true },
    autoresponder:{ type: Boolean, default: false },
    stats:        { type: Boolean, default: false }
  },
  // Whitelist channel per fitur (kosong = semua channel)
  allowedChannels: {
    music:        [String],   // Channel ID untuk commands musik
    commands:     [String],   // Channel ID untuk commands umum
    leveling:     [String],   // Channel ID yang dihitung XP-nya
  },
  // Blacklist channel (tidak bisa pakai bot)
  ignoredChannels: [String],
  // Bot Manager (bisa akses /config tanpa harus ADMINISTRATOR)
  managerRoles:  [String],    // Role ID yang boleh mengkonfigurasi bot
  managerUsers:  [String],    // User ID spesifik yang boleh mengkonfigurasi bot
  createdAt: Date,
  updatedAt: Date
}
```

### 6.2 WelcomeConfig

```js
{
  guildId: String (unique),
  // Welcome
  welcomeEnabled: Boolean,
  welcomeChannelId: String,
  welcomeMessage: String,           // Support variabel: {user}, {server}, {count}
  welcomeEmbed: {
    enabled: Boolean,
    color: String,
    title: String,
    description: String,
    footer: String,
    thumbnail: Boolean,             // Tampilkan avatar user
    showMemberCount: Boolean
  },
  dmWelcome: Boolean,               // Kirim welcome ke DM user
  dmMessage: String,
  // Leave
  leaveEnabled: Boolean,
  leaveChannelId: String,
  leaveMessage: String,
  leaveEmbed: { /* sama seperti welcomeEmbed */ }
}
```

### 6.3 ReactionRole

```js
{
  guildId: String,
  channelId: String,
  messageId: String (unique),
  title: String,                    // Judul panel reaction role
  type: { type: String, enum: ['normal', 'unique', 'verify'] },
  // normal  = bisa ambil banyak role
  // unique  = hanya bisa 1 role dalam panel ini
  // verify  = satu kali klik, tidak bisa di-remove
  reactions: [{
    emoji: String,                  // Emoji ID atau unicode
    roleId: String,
    description: String             // Deskripsi opsional
  }]
}
```

### 6.4 MusicConfig

```js
{
  guildId: String (unique),
  musicChannelId: String,           // Channel khusus musik (null = semua channel)
  djRoleId: String,                 // Role DJ (null = semua bisa pakai)
  defaultVolume: { type: Number, default: 80 },
  mode247: { type: Boolean, default: false },
  autoplay: { type: Boolean, default: false },
  allowFilters: { type: Boolean, default: true },
  maxQueueSize: { type: Number, default: 100 },
  maxSongDuration: Number           // Detik, 0 = unlimited
}
```

### 6.5 TicketConfig

```js
{
  guildId: String (unique),
  enabled: Boolean,
  categories: [{
    id: String,                     // UUID untuk identifikasi
    name: String,                   // Misal: "Support", "Bug Report"
    emoji: String,
    description: String,
    staffRoles: [String],           // Role ID yang bisa lihat ticket ini
    categoryId: String,             // Discord category channel untuk ticket baru
    pingStaff: Boolean,             // Auto ping staff saat ticket dibuat
    welcomeMessage: String          // Pesan pertama saat ticket dibuat
  }],
  logChannelId: String,             // Channel log semua aktivitas ticket
  transcriptChannelId: String,      // Channel untuk transcript selesai
  archiveCategoryId: String,        // Category tempat channel ticket di-archive setelah close
  ticketCounter: { type: Number, default: 0 },
  closeConfirmation: { type: Boolean, default: true },
  archiveOnClose: { type: Boolean, default: true }
}
```

### 6.6 Ticket (Instance per ticket)

```js
{
  ticketId: String,                   // Format: ticket-0001
  guildId: String,
  userId: String,                     // Pembuat ticket
  channelId: String,                  // Channel aktif saat ticket open
  categoryName: String,
  claimedBy: String,                  // Staff yang claim (null jika belum)
  status: {
    type: String,
    enum: ['open', 'claimed', 'done'],
    // open   = baru dibuat, belum di-claim
    // claimed= sudah di-claim oleh staff
    // done   = selesai, channel sudah di-archive, user tidak bisa melihat lagi
  },
  participants: [String],             // User tambahan yang ditambahkan
  createdAt: Date,
  closedAt: Date,
  closedBy: String,
  reason: String,
  // Saat status = 'done':
  //   ① Permission VIEW_CHANNEL user asli di-remove  → invisible bagi user
  //   ② Channel di-rename: "ticket-0001" → "done-0001"
  //   ③ Channel dipindah ke archiveCategoryId (category arsip admin)
  //   ④ Hanya admin & staff role yang masih bisa melihat channel
  //   ⑤ Log dikirim ke logChannelId dengan embed status "Done"
}
```

### 6.7 AutoModConfig

```js
{
  guildId: String (unique),
  // Anti Spam
  antiSpam: {
    enabled: Boolean,
    maxMessages: { type: Number, default: 5 },
    interval: { type: Number, default: 5000 },  // ms
    punishment: { type: String, enum: ['delete', 'warn', 'mute', 'kick', 'ban'] }
  },
  // Anti Raid
  antiRaid: {
    enabled: Boolean,
    joinThreshold: { type: Number, default: 10 }, // X join dalam Y detik
    joinInterval: { type: Number, default: 10000 },
    action: { type: String, enum: ['kick', 'ban', 'lockdown'] }
  },
  // Anti Link
  antiLink: {
    enabled: Boolean,
    whitelist: [String],            // Domain yang diizinkan
    punishment: String
  },
  // Bad Words
  badWords: {
    enabled: Boolean,
    words: [String],
    wildcardMatch: Boolean,         // Cocokkan substring juga
    punishment: String
  },
  // Anti Mass Mention
  antiMention: {
    enabled: Boolean,
    maxMentions: { type: Number, default: 5 },
    punishment: String
  },
  // Anti Caps
  antiCaps: {
    enabled: Boolean,
    threshold: { type: Number, default: 70 }, // Persentase kapital
    minLength: { type: Number, default: 10 },
    punishment: String
  },
  // Whitelist (tidak terkena automod)
  ignoredRoles: [String],
  ignoredChannels: [String],
  // Eskalasi hukuman otomatis
  punishmentEscalation: {
    enabled: Boolean,
    levels: [{
      warnings: Number,             // Setelah X peringatan
      action: String,               // Aksi yang diambil
      duration: Number              // Durasi dalam menit (untuk mute/timeout)
    }]
  }
}
```

### 6.8 UserXP

```js
{
  userId: String,
  guildId: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  lastXpGain: Date,                 // Untuk cooldown XP
  // Index compound: userId + guildId (unique)
}
```

### 6.9 Warning

```js
{
  warnId: String,                   // UUID
  guildId: String,
  userId: String,
  moderatorId: String,
  reason: String,
  active: { type: Boolean, default: true },
  createdAt: Date
}
```

### 6.10 Giveaway

```js
{
  messageId: String (unique),
  guildId: String,
  channelId: String,
  hostedBy: String,
  prize: String,
  winnerCount: Number,
  endTime: Date,
  ended: { type: Boolean, default: false },
  winners: [String],
  participants: [String],
  requirements: {
    minLevel: Number,               // Min level leveling bot
    roleId: String,                 // Harus punya role ini
    serverBooster: Boolean          // Harus server booster
  }
}
```

### 6.11 Autoresponder

```js
{
  guildId: String,
  triggers: [{
    id: String,
    trigger: String,
    response: String,
    matchType: { type: String, enum: ['exact', 'contains', 'startsWith', 'endsWith', 'regex'] },
    caseSensitive: Boolean,
    channels: [String],             // Kosong = semua channel
    cooldown: Number,               // Detik
    lastTriggered: Date,
    deleteOriginal: Boolean,        // Hapus pesan asli
    replyDM: Boolean                // Balas via DM
  }]
}
```

### 6.12 StatsConfig

```js
{
  guildId: String (unique),
  channels: [{
    channelId: String,              // Voice channel yang dijadikan stat display
    type: { type: String, enum: ['totalMembers', 'onlineMembers', 'bots', 'humans', 'boosts', 'channels', 'roles'] },
    template: String                // Misal: "👥 Members: {value}"
  }],
  updateInterval: { type: Number, default: 10 } // Menit
}
```

### 6.13 BotManagerConfig

```js
// Siapa saja yang boleh mengakses /config (selain ADMINISTRATOR bawaan Discord)
{
  guildId: String (unique),
  managerRoles: [String],           // Role ID yang bisa akses semua /config
  managerUsers: [String],           // User ID spesifik yang bisa akses semua /config
  // Catatan: SERVER ADMINISTRATOR selalu bisa akses /config tanpa perlu diset di sini
  // Prioritas cek: Bot Owner > ADMINISTRATOR > managerUsers > managerRoles > tolak
}
```

### 6.14 TempVCConfig

```js
// Konfigurasi Temporary Voice Channel per guild
{
  guildId: String (unique),
  enabled: Boolean,
  triggerChannelId: String,         // ID voice channel "➕ Buat Channel" yang jika dimasuki akan trigger pembuatan TempVC
  categoryId: String,               // Category Discord tempat TempVC dibuat
  nameTemplate: String,             // Template nama: default "🎙️ {username}'s Channel"
  userLimit: { type: Number, default: 0 },  // 0 = unlimited
  bitrate: { type: Number, default: 64000 },
  allowUserRename: { type: Boolean, default: true },   // Owner bisa rename channelnya sendiri
  allowUserLimit: { type: Boolean, default: true },    // Owner bisa ubah user limit
  allowUserLock: { type: Boolean, default: true },     // Owner bisa lock channel (private)
  deleteDelay: { type: Number, default: 0 }            // Detik delay sebelum delete (0 = instant)
}
```

### 6.15 TempVC (Active Temporary Channels)

```js
// Tracking voice channel temporary yang sedang aktif
{
  channelId: String (unique),       // ID voice channel sementara
  guildId: String,
  ownerId: String,                  // User yang membuat (dan bisa manage) channel ini
  createdAt: Date,
  // Channel ini otomatis dihapus dari DB saat voice channel Discord-nya didelete
}
```

---

## 7. Fitur Lengkap

### 7.1 🎉 Welcome & Leave System

**Welcome Message:**

- Kirim embed/pesan ke channel yang ditentukan saat member baru join
- Variabel yang tersedia: `{user}`, `{username}`, `{tag}`, `{server}`, `{memberCount}`, `{memberOrdinal}` (misal: "ke-100")
- Tampilkan avatar member sebagai thumbnail embed
- Opsi kirim DM sambutan ke member baru
- Custom warna, judul, deskripsi, footer embed

**Leave Message:**

- Kirim notifikasi saat member keluar/di-kick/di-ban
- Variabel: `{username}`, `{tag}`, `{server}`, `{memberCount}`

---

### 7.2 🎭 Auto Role & Reaction Role

**Auto Role (On Join):**

- Berikan 1 atau lebih role secara otomatis saat member baru join
- Role terpisah untuk manusia dan bot

**Reaction Role:**

- Buat panel dengan embed yang berisi daftar emoji → role
- 3 mode panel:
  - `normal`: bisa ambil banyak role sekaligus
  - `unique`: hanya bisa memilih 1 role dari panel (remove role lama)
  - `verify`: tap sekali untuk verifikasi, tidak bisa di-remove
- Setup via `/config reactionrole` dengan UI interaktif (modal + select menu)
- Mendukung custom emoji server maupun emoji unicode

---

### 7.3 🎵 Music System

**Sumber Musik yang Didukung:**

- YouTube: link video, link playlist, pencarian teks
- Spotify: link track, link album, link playlist (diconvert ke YouTube)
- SoundCloud: link track & playlist (via discord-player extractor)

**Fitur Queue:**

- Queue dengan pagination (per 10 lagu)
- Tampilkan durasi total queue
- Drag & drop posisi lagu di queue
- Hapus lagu tertentu dari queue

**Kontrol Playback:**

- Play, Pause, Resume, Stop, Skip (ke lagu ke-N)
- Loop mode: off / lagu ini / seluruh queue
- Shuffle queue
- Volume 1–100
- Seek ke timestamp tertentu (contoh: `!seek 1:30`)

**Fitur Tambahan:**

- Now Playing embed dengan progress bar berbasis karakter
- Lirik lagu via Genius API (`/lyrics`)
- Audio filters: bass boost, nightcore, vaporwave, 8D, karaoke, treble
- Mode 24/7 (bot tetap di voice channel walau queue kosong)
- DJ Role: hanya role tertentu yang bisa kontrol musik

---

### 7.4 🛡️ AutoMod & Spam Detection

**Modul Deteksi:**
| Modul | Deskripsi |
|---|---|
| Anti Spam | Hapus pesan jika kirim terlalu cepat (X pesan dalam Y detik) |
| Anti Raid | Deteksi mass join, bisa auto-lockdown server |
| Anti Link | Blokir link selain whitelist |
| Bad Words | Filter kata yang dilarang (exact + wildcard) |
| Anti Mass Mention | Blokir jika mention terlalu banyak user/role |
| Anti Caps | Blokir jika lebih dari X% huruf kapital |
| Anti Duplicate | Blokir pesan yang sama dikirim berulang |

**Sistem Hukuman:**

- Per modul bisa diset punishment berbeda: delete / warn / mute / kick / ban
- **Eskalasi otomatis:** setelah N warn → auto mute, setelah M warn → auto kick, dst.
- Semua aksi automod dikirim ke log channel
- Whitelist role & channel (misal: admin tidak terkena automod)

---

### 7.5 🎫 Ticket System

**Konsep Utama:**
Ticket dikelola dari **satu channel khusus** berisi embed + tombol. Ketika user klik tombol, bot membuat channel private. Saat selesai, channel _hilang dari pandangan user_ tetapi **tetap ada untuk admin** sebagai arsip dengan status "Done".

**Alur Lengkap:**

```
SETUP (sekali oleh Admin):
  /ticket setup
    └── Bot buat embed di channel yang ditentukan:
        ┌─────────────────────────────────────┐
        │  📬 MonoHex Support                 │
        │  Pilih kategori bantuan di bawah:   │
        │                                     │
        │  [🛠️ Support] [🐛 Bug] [🤝 Partner] │
        └─────────────────────────────────────┘

USER BUAT TICKET:
  User klik tombol "🛠️ Support"
    └── [Modal] Muncul form singkat:
        - Judul masalah
        - Deskripsi singkat
    └── User submit modal
    └── Bot buat text channel baru: #ticket-0001
        Permission channel:
          @everyone        → ❌ VIEW_CHANNEL (invisible untuk semua)
          User (pembuat)   → ✅ VIEW_CHANNEL, ✅ SEND_MESSAGES, ✅ ATTACH_FILES
          Staff Role       → ✅ VIEW_CHANNEL, ✅ SEND_MESSAGES, ✅ MANAGE_MESSAGES
          Bot              → ✅ Semua permission
    └── Bot kirim embed pertama di #ticket-0001:
        - Info user, kategori, deskripsi
        - Tombol: [🔒 Close] [👤 Claim] [➕ Add User] [📄 Transcript]
    └── Bot balas ke user di channel asal: "Ticket kamu sudah dibuat di #ticket-0001"

STAFF KELOLA TICKET:
  Claim  → Nama channel diupdate jadi "#⚡-ticket-0001 (StaffName)"
  Add    → User lain ditambahkan ke permission VIEW_CHANNEL channel
  Remove → Permission VIEW_CHANNEL user tersebut dicabut

ADMIN/STAFF CLOSE TICKET (status → Done):
  Klik tombol [🔒 Close]
    └── [Konfirmasi] "Yakin ingin menutup ticket ini?"
        [✅ Ya, Tutup] [❌ Batal]
    └── Jika konfirmasi:
        ① Permission VIEW_CHANNEL user pembuat → ❌ DICABUT
           (channel langsung hilang dari daftar channel user)
        ② Channel di-rename: "ticket-0001" → "done-0001"
        ③ Channel dipindah ke Category "📁 Ticket Archive" (archiveCategoryId)
        ④ Status di DB diubah → "done"
        ⑤ Log embed dikirim ke #ticket-log:
           ┌─────────────────────────────────┐
           │ 🎫 Ticket #0001 — DONE          │
           │ User    : @Username             │
           │ Kategori: Support               │
           │ Ditutup : @StaffName            │
           │ Durasi  : 2 jam 15 menit        │
           │ Channel : #done-0001            │
           └─────────────────────────────────┘
        ⑥ Transcript HTML dikirim ke #ticket-transcript (opsional)
        ⑦ DM ke user: "Ticket kamu (#0001) telah diselesaikan."

ADMIN LIHAT ARSIP:
  Category "📁 Ticket Archive" berisi semua channel "done-XXXX"
  Setiap channel bisa dilihat riwayat percakapannya oleh admin/staff
  Bisa di-delete manual atau via perintah /ticket purge-archive
```

**Fitur Detail:**

- **Satu panel, multi-kategori:** Tombol berbeda per kategori, masing-masing dengan staff role dan kategori Discord channel tersendiri
- **Auto-numbering:** ticket-0001, ticket-0002, ... (counter tidak reset)
- **Claim system:** Satu staff ambil ownership ticket, menghindari double-handling
- **Invisible setelah close:** User tidak lagi bisa melihat channel, tidak perlu delete channel
- **Archive tetap ada:** Admin/staff tetap bisa mengakses riwayat ticket kapan saja
- **Transcript HTML:** Rekam semua percakapan dalam format HTML yang rapi sebelum close
- **DM notification:** Beritahu user via DM saat ticket dibuka & ditutup
- **Cooldown buat ticket:** Cegah spam ticket dari satu user

---

### 7.6 📊 Leveling System

**Cara Kerja:**

- User mendapat XP setiap kirim pesan (default: 15–25 XP acak) dengan cooldown 60 detik
- Rumus naik level: `Level * 100 XP` (bisa dikonfigurasi)
- Pengumuman naik level di channel yang ditentukan atau channel tempat pesan dikirim

**Fitur:**

- Rank card dengan kanvas (avatar, username, XP bar, level badge)
- Leaderboard server (top 10 dengan pagination)
- Level roles: otomatis beri/ambil role saat capai level tertentu
- Set XP manual (admin), reset XP user
- Exclude channel tertentu dari hitungan XP

---

### 7.7 🔨 Moderation System

| Command     | Fungsi                                              |
| ----------- | --------------------------------------------------- |
| `/ban`      | Ban user, opsional hapus pesan N hari               |
| `/kick`     | Kick user dari server                               |
| `/timeout`  | Timeout user selama durasi tertentu                 |
| `/softban`  | Ban + unban untuk hapus pesan, tapi user bisa balik |
| `/unban`    | Cabut ban user                                      |
| `/warn`     | Beri peringatan ke user                             |
| `/unwarn`   | Hapus peringatan tertentu                           |
| `/warnings` | Lihat daftar warning user                           |
| `/mute`     | Mute dengan role muted                              |
| `/unmute`   | Unmute user                                         |
| `/purge`    | Hapus bulk pesan (1–100)                            |
| `/slowmode` | Atur slowmode channel                               |
| `/lock`     | Kunci channel (non-staff tidak bisa kirim pesan)    |
| `/unlock`   | Buka kunci channel                                  |
| `/case`     | Lihat detail kasus moderasi berdasarkan ID          |

Semua aksi moderasi dicatat dengan mod log ke channel yang ditentukan.

---

### 7.8 📝 Log System

**Event yang Dilog:**

- Pesan dihapus / diedit (dengan konten asli)
- Member join / leave / ban / unban
- Perubahan role, nickname member
- Channel dibuat / dihapus / diedit
- Role dibuat / dihapus / diedit
- Voice: join, leave, move channel
- Semua aksi moderasi (dari ModLog)
- Invite dibuat / dihapus

**Setup:**

- Satu channel bisa untuk semua log, atau pisah per kategori (misal: mod-log, server-log, message-log)
- Setiap event tampil sebagai embed berwarna sesuai jenis (merah = delete, kuning = update, hijau = create)

---

### 7.9 🎁 Giveaway System

- Buat giveaway dengan prize, durasi, jumlah winner
- Requirement opsional: punya role tertentu, server booster, atau level minimum
- Countdown otomatis, auto-pick winner saat waktu habis
- `/giveaway reroll` untuk pilih winner baru jika winner tidak klaim
- Embed giveaway auto-update saat selesai

---

### 7.10 📣 Auto-Responder

- Tambah trigger kata → respon otomatis
- Tipe pencocokan: exact, contains, startsWith, endsWith, regex
- Opsional: balas di channel yang sama, balas via DM, atau hapus pesan asli
- Bisa dibatasi ke channel tertentu
- Cooldown per trigger agar tidak spam

---

### 7.11 📊 Server Stats Channels

- Tampilkan statistik server di nama voice channel (auto-update setiap N menit)
- Tipe stat: Total Members, Humans, Bots, Online, Boosts, Channels, Roles
- Template nama channel: `👥 Total Members: {value}`

---

### 7.12 🛠️ Utility Commands

| Command                  | Fungsi                                                      |
| ------------------------ | ----------------------------------------------------------- |
| `/serverinfo`            | Info lengkap server (owner, members, boosts, channels, dll) |
| `/userinfo [user]`       | Info user (join date, roles, badges, dll)                   |
| `/roleinfo [role]`       | Info role (warna, permissions, member count)                |
| `/channelinfo [channel]` | Info channel                                                |
| `/avatar [user]`         | Tampilkan avatar ukuran besar                               |
| `/banner [user]`         | Tampilkan banner profil user                                |
| `/poll`                  | Buat polling dengan opsi pilihan (max 10 pilihan)           |
| `/embed`                 | Builder embed interaktif langsung di Discord                |
| `/reminder`              | Set pengingat personal                                      |
| `/calculate`             | Kalkulator matematika                                       |
| `/botinfo`               | Info bot (uptime, ping, guild count, dll)                   |
| `/translate`             | Terjemahkan teks ke bahasa lain                             |

---

### 7.13 🎮 Fun Commands

| Command               | Fungsi                           |
| --------------------- | -------------------------------- |
| `/8ball [pertanyaan]` | Magic 8-ball menjawab pertanyaan |
| `/meme`               | Random meme dari Reddit          |
| `/joke`               | Random joke                      |
| `/coinflip`           | Lempar koin (heads/tails)        |
| `/dice [sisi]`        | Lempar dadu                      |
| `/trivia`             | Soal trivia dengan timer         |

---

### 7.14 🔑 Bot Manager Role System

**Masalah yang Diselesaikan:**
Secara default, hanya member dengan permission `ADMINISTRATOR` yang bisa mengakses `/config`. Fitur ini memungkinkan server memberikan hak konfigurasi bot kepada role/user tertentu **tanpa harus memberi ADMINISTRATOR** kepada mereka.

**Konsep:**

```
Hirarki cek permission untuk /config:

  1. Bot Owner (.env BOT_OWNERS)         → ✅ Selalu bisa
  2. Server ADMINISTRATOR                → ✅ Selalu bisa
  3. managerUsers (ID spesifik)          → ✅ Bisa jika terdaftar
  4. managerRoles (role tertentu)        → ✅ Bisa jika punya role
  5. Semua lainnya                       → ❌ Ditolak
```

**Fitur:**

- Tambah/hapus role sebagai "Bot Manager" via `/config managers`
- Tambah/hapus user spesifik sebagai "Bot Manager" via `/config managers`
- Bot Manager bisa akses **semua** perintah `/config` (welcome, automod, ticket, musik, dll)
- Bot Manager **tidak bisa** mengakses perintah owner-only (eval, shutdown, dll)
- Daftar manager bisa dilihat kapan saja via `/config managers list`

**Alur Setup:**

```
Admin: /config managers add role @ModeratorRole
Bot:   ✅ Role @ModeratorRole ditambahkan sebagai Bot Manager.
       Mereka kini bisa mengakses semua perintah /config.

Admin: /config managers add user @Budi
Bot:   ✅ @Budi ditambahkan sebagai Bot Manager.

Admin: /config managers list
Bot:   [Embed]
       🔑 Bot Managers — ServerName
       ────────────────────────────
       Roles : @ModeratorRole, @HeadAdmin
       Users : @Budi, @Siti
       ────────────────────────────
       💡 Semua member SERVER ADMINISTRATOR selalu bisa akses /config.
```

---

### 7.15 🎙️ Temporary Voice Channel (TempVC)

**Konsep:**
Server menyediakan satu voice channel "trigger" bernama misalnya `➕ Buat Channel`. Ketika user masuk ke channel tersebut, bot **otomatis membuat voice channel baru** dengan nama sesuai username mereka, lalu memindahkan user ke sana. Ketika channel kosong (semua user keluar), bot **otomatis menghapus** channel tersebut.

**Alur Lengkap:**

```
SETUP (Admin):
  /config tempvc setup
    └── Set trigger channel: #➕ Buat Channel
    └── Set category tujuan: 🎙️ Voice Rooms
    └── Template nama: "🎙️ {username}'s Room"

USER PAKAI:
  User "Budi" masuk ke voice channel "➕ Buat Channel"
    └── Bot deteksi via voiceStateUpdate
    └── Bot buat voice channel baru di category "🎙️ Voice Rooms":
        Nama: "🎙️ Budi's Room"
        Owner: Budi (punya permission MANAGE_CHANNEL di channel ini)
    └── Bot pindahkan Budi ke "🎙️ Budi's Room"
    └── Budi bisa invite teman, lock channel, rename, set user limit

USER LAIN JOIN:
  User lain bisa join "🎙️ Budi's Room" (jika tidak di-lock)

CHANNEL KOSONG:
  Semua user keluar dari "🎙️ Budi's Room"
    └── Bot deteksi channel kosong via voiceStateUpdate
    └── Bot hapus voice channel "🎙️ Budi's Room"
    └── DB record dihapus
```

**Kontrol untuk Owner Channel:**
Owner channel (yang membuat) bisa mengelola channel mereka sendiri:

| Command               | Fungsi                                                    |
| --------------------- | --------------------------------------------------------- |
| `/vc rename <nama>`   | Ganti nama voice channel (hanya owner)                    |
| `/vc limit <angka>`   | Set batas jumlah user (0 = unlimited)                     |
| `/vc lock`            | Lock channel → hanya orang yang di-invite yang bisa masuk |
| `/vc unlock`          | Buka kembali channel agar publik                          |
| `/vc kick <user>`     | Keluarkan user dari voice channel                         |
| `/vc transfer <user>` | Pindahkan ownership channel ke user lain                  |
| `/vc info`            | Lihat info channel (owner, jumlah member, status lock)    |

**Fitur Tambahan:**

- Nama channel otomatis menggunakan username Discord user
- Template nama bisa dikustomisasi: `{username}`, `{discriminator}`, `{displayName}`
- Channel bisa di-lock agar tidak bisa dimasuki sembarang orang
- Admin tetap bisa lihat dan masuk ke semua TempVC
- Jika owner keluar dari channel (tanpa ada member lain), channel tetap ada hingga benar-benar kosong
- Jika owner keluar tapi ada member lain → ownership otomatis pindah ke member pertama yang masih ada

---

## 8. Daftar Commands

### Prefix: `/` (Slash) dan `!` (Prefix, bisa diubah per server)

#### ⚙️ Config Category

```
/config welcome       — Setup pesan welcome
/config leave         — Setup pesan leave
/config autorole      — Setup auto role saat join
/config reactionrole  — Buat/kelola panel reaction role
/config music         — Channel musik & DJ role
/config ticket        — Konfigurasi sistem ticket
/config automod       — Konfigurasi automod per modul
/config logs          — Setup log channels
/config leveling      — Konfigurasi XP & level roles
/config stats         — Setup stat channels
/config channels      — Atur whitelist/blacklist channel per fitur
/config prefix        — Ubah prefix bot
/config tempvc        — Konfigurasi Temporary Voice Channel
/config managers      — Kelola siapa yang bisa akses /config
/config view          — Lihat semua konfigurasi server saat ini
/config reset         — Reset konfigurasi ke default
```

#### 🎵 Music Category

```
/play <query|url>           — Play lagu atau tambah ke queue
/pause                      — Pause lagu
/resume                     — Resume lagu
/skip [posisi]              — Skip 1 lagu atau skip ke posisi tertentu
/stop                       — Stop musik & kosongkan queue
/queue [halaman]            — Tampilkan queue
/nowplaying                 — Info lagu yang sedang diputar
/volume <1-100>             — Atur volume
/loop [off|track|queue]     — Mode loop
/shuffle                    — Acak urutan queue
/remove <posisi>            — Hapus lagu dari queue
/move <dari> <ke>           — Pindah posisi lagu di queue
/seek <waktu>               — Lompat ke timestamp (contoh: 1:30)
/filter [nama_filter]       — Terapkan audio filter
/lyrics [judul_lagu]        — Tampilkan lirik lagu
/247                        — Toggle mode 24/7
```

#### 🔨 Moderation Category

```
/ban <user> [alasan] [hapus_pesan]
/kick <user> [alasan]
/timeout <user> <durasi> [alasan]
/softban <user> [alasan]
/unban <user_id> [alasan]
/warn <user> <alasan>
/unwarn <warn_id>
/warnings <user>
/mute <user> [durasi] [alasan]
/unmute <user>
/purge <jumlah> [filter]      — Filter: all, bots, humans, user
/slowmode <detik>
/lock [channel]
/unlock [channel]
/case <id>
```

#### 🎫 Ticket Category

```
/ticket setup          — Buat panel ticket (hanya admin)
/ticket close          — Tutup ticket
/ticket claim          — Klaim ticket (staff)
/ticket add <user>     — Tambah user ke ticket
/ticket remove <user>  — Hapus user dari ticket
/ticket transcript     — Generate transcript manual
```

#### 📊 Leveling Category

```
/rank [user]                — Lihat rank card
/leaderboard [halaman]      — Leaderboard server
/setxp <user> <jumlah>      — Set XP user (admin)
/addxp <user> <jumlah>      — Tambah XP user (admin)
/resetxp [user]             — Reset XP user atau semua (admin)
```

#### 🎁 Giveaway Category

```
/giveaway create     — Buat giveaway baru
/giveaway end        — Akhiri giveaway lebih awal
/giveaway reroll     — Pilih ulang winner
```

#### 🛠️ Utility Category

```
/serverinfo
/userinfo [user]
/roleinfo [role]
/channelinfo [channel]
/avatar [user]
/banner [user]
/poll <pertanyaan>
/embed
/reminder <waktu> <pesan>
/calculate <ekspresi>
/translate <bahasa> <teks>
/botinfo
```

#### 🎮 Fun Category

```
/8ball <pertanyaan>
/meme
/joke
/coinflip
/dice [sisi]
/trivia
```

#### 🔑 Bot Manager Category

```
/config managers add role <role>    — Tambah role sebagai Bot Manager
/config managers add user <user>    — Tambah user sebagai Bot Manager
/config managers remove role <role> — Hapus role dari Bot Manager
/config managers remove user <user> — Hapus user dari Bot Manager
/config managers list               — Lihat daftar semua Bot Manager
```

#### 🎙️ Temp Voice Channel Category

```
/vc rename <nama>        — Ganti nama voice channel milikmu
/vc limit <angka>        — Set batas jumlah user (0 = unlimited)
/vc lock                 — Lock channel (hanya invite yang bisa masuk)
/vc unlock               — Buka kembali channel ke publik
/vc kick <user>          — Keluarkan user dari voice channel
/vc transfer <user>      — Pindahkan ownership ke user lain
/vc info                 — Lihat info channel saat ini
```

---

## 9. Daftar Events

| Event                   | Handler                  | Fungsi                                                      |
| ----------------------- | ------------------------ | ----------------------------------------------------------- |
| `ready`                 | ready.js                 | Log bot online, set presence, start schedulers              |
| `guildMemberAdd`        | guildMemberAdd.js        | Welcome message, auto role                                  |
| `guildMemberRemove`     | guildMemberRemove.js     | Leave message                                               |
| `messageCreate`         | messageCreate.js         | Prefix commands, automod, XP leveling, autoresponder        |
| `messageDelete`         | messageDelete.js         | Log pesan dihapus                                           |
| `messageUpdate`         | messageUpdate.js         | Log pesan diedit                                            |
| `interactionCreate`     | interactionCreate.js     | Slash commands, buttons, select menus, modals               |
| `messageReactionAdd`    | messageReactionAdd.js    | Tambah role dari reaction role                              |
| `messageReactionRemove` | messageReactionRemove.js | Cabut role dari reaction role                               |
| `guildBanAdd`           | guildBanAdd.js           | Log ban                                                     |
| `guildBanRemove`        | guildBanRemove.js        | Log unban                                                   |
| `guildMemberUpdate`     | guildMemberUpdate.js     | Log role/nickname change                                    |
| `channelCreate/Delete`  | channelCreate/Delete.js  | Log perubahan channel                                       |
| `roleCreate/Delete`     | roleCreate/Delete.js     | Log perubahan role                                          |
| `voiceStateUpdate`      | voiceStateUpdate.js      | Log voice, anti-raid voice, **TempVC create & auto-delete** |
| `guildCreate`           | guildCreate.js           | Inisialisasi default config saat bot join guild baru        |

**Detail voiceStateUpdate untuk TempVC:**

```
Skenario yang ditangani:
  A. User join trigger channel         → buat TempVC baru, pindahkan user
  B. User leave TempVC (channel kosong)→ hapus TempVC dari Discord & DB
  C. User leave TempVC (masih ada member) → transfer ownership jika owner yang keluar
  D. User pindah dari trigger channel ke channel lain → tidak trigger pembuatan
```

---

## 10. Sistem Konfigurasi In-Discord

Semua konfigurasi dilakukan **langsung dari Discord** tanpa perlu mengedit file apapun.

### Alur Konfigurasi `/config welcome`

```
User: /config welcome
Bot:  [Embed] "Konfigurasi Welcome Message"
      [Tombol] ✏️ Set Channel | 📝 Set Pesan | 🎨 Set Embed | 💬 Toggle DM | ✅ Enable | ❌ Disable

User: Klik "Set Channel"
Bot:  "Silakan mention channel welcome!"
User: #welcome-channel
Bot:  [✅] Channel welcome berhasil diset ke #welcome-channel!

User: Klik "Set Embed"
Bot:  [Modal] Form dengan field:
      - Judul embed
      - Deskripsi (support variabel)
      - Warna (hex)
      - Footer text
      [Submit]
```

### Variabel Pesan (Support di Welcome, Leave, AutoResponder)

| Variabel          | Output                |
| ----------------- | --------------------- |
| `{user}`          | Mention user          |
| `{username}`      | Username tanpa tag    |
| `{tag}`           | Username#1234         |
| `{server}`        | Nama server           |
| `{memberCount}`   | Total member saat ini |
| `{memberOrdinal}` | Anggota ke-N          |

### Alur Konfigurasi `/config automod`

```
User: /config automod
Bot:  [Select Menu] Pilih modul yang ingin dikonfigurasi:
      - Anti Spam
      - Anti Raid
      - Anti Link
      - Bad Words
      - Anti Mention
      - Anti Caps

User: Pilih "Anti Spam"
Bot:  [Embed] Status: ❌ Disabled
      Maks pesan: 5 per 5 detik
      Punishment: Delete
      [Tombol] ✅ Enable | ⚙️ Konfigurasi | ❌ Disable

User: Klik "Konfigurasi"
Bot:  [Modal]
      - Maks pesan: [input]
      - Interval (ms): [input]
      - Punishment: [select: delete/warn/mute/kick/ban]
```

### Alur Konfigurasi `/config managers`

```
Admin: /config managers
Bot:   [Embed] 🔑 Bot Manager Configuration
       Roles  : (belum ada)
       Users  : (belum ada)
       [Tombol] ➕ Add Role | ➕ Add User | ➖ Remove Role | ➖ Remove User | 📋 List

Admin: Klik "➕ Add Role"
Bot:   "Mention role yang ingin dijadikan Bot Manager:"
Admin: @ModeratorRole
Bot:   ✅ @ModeratorRole berhasil ditambahkan sebagai Bot Manager!
       Mereka kini bisa mengakses semua perintah /config.

Admin: /config managers list
Bot:   [Embed]
       🔑 Bot Managers — ServerName
       ──────────────────────────────────────
       📌 Roles (2): @ModeratorRole, @HeadAdmin
       👤 Users (1): @Budi#1234
       ──────────────────────────────────────
       ℹ️ SERVER ADMINISTRATOR selalu bisa akses /config.
```

### Alur Konfigurasi `/config tempvc`

```
Admin: /config tempvc
Bot:   [Embed] 🎙️ Temp Voice Channel Setup
       Status         : ❌ Disabled
       Trigger Channel: (belum diset)
       Category       : (belum diset)
       Template Nama  : 🎙️ {username}'s Room
       [Tombol] ✅ Enable | 📌 Set Trigger | 📁 Set Category | ✏️ Set Template | ⚙️ Advanced

Admin: Klik "📌 Set Trigger"
Bot:   "Mention atau klik voice channel yang akan jadi trigger TempVC:"
Admin: #➕-buat-channel
Bot:   ✅ Trigger channel berhasil diset ke "➕-buat-channel"!
       Setiap user yang masuk channel ini akan mendapat voice channel sementara.

Admin: Klik "✅ Enable"
Bot:   ✅ Fitur Temporary Voice Channel aktif!
```

---

## 11. Permission & Role System

### Hirarki Permission

```
BOT OWNER (via .env BOT_OWNERS)
  └── Akses penuh: eval, shutdown, global config, semua /config

SERVER ADMINISTRATOR (ADMINISTRATOR permission Discord)
  └── Akses semua /config dan semua command moderasi
  └── Bisa mengelola daftar Bot Manager

BOT MANAGER ROLE / USER (via /config managers)
  └── Akses semua /config (welcome, music, ticket, automod, dll)
  └── Tidak bisa: eval, shutdown, ubah daftar Bot Manager
  └── Berguna untuk: Head Moderator, Pengelola Server non-ADMIN

MODERATOR (role yang punya MANAGE_MESSAGES / KICK_MEMBERS)
  └── Akses command moderasi standar (warn, mute, kick)

DJ ROLE (dikonfigurasi via /config music)
  └── Akses kontrol penuh musik

STAFF TICKET (dikonfigurasi per kategori ticket)
  └── Lihat & kelola ticket kategori tersebut
  └── Bisa: claim, close, add/remove user, transcript

MEMBER BIASA
  └── Command music (jika tidak ada DJ role), utility, fun, leveling
  └── Bisa membuat TempVC (join trigger channel)
  └── Owner TempVC bisa: rename, lock, kick, transfer
```

### Channel Permission System

Setiap fitur bisa dibatasi ke channel tertentu:

```
/config channels music      #music-bot        — Musik hanya di channel ini
/config channels commands   #bot-commands     — Commands umum hanya di sini
/config channels ignore     #staff-chat       — Bot tidak merespons di channel ini
```

Jika whitelist kosong → fitur berlaku di semua channel (kecuali yang di-ignore).

---

## 12. Deployment Guide (Gratis)

### Stack Gratis yang Direkomendasikan

```
Neon / Supabase  →  PostgreSQL Database (Free Tier)
Railway.app      →  Hosting bot Node.js ($5 free credit/bulan ≈ 500 jam)
```

### Langkah-langkah Deploy

#### Step 1: Setup PostgreSQL Database

1. Buat akun di [neon.tech](https://neon.tech) atau [supabase.com](https://supabase.com)
2. Buat project baru → pilih database PostgreSQL gratis
3. Buat database user dan salin connection string
4. Copy **Connection String** → masukkan ke `DATABASE_URL` di `.env`

#### Step 2: Buat Discord Bot

1. Buka [discord.com/developers/applications](https://discord.com/developers/applications)
2. New Application → beri nama "MonoHex"
3. Bot tab → Reset Token → copy `DISCORD_TOKEN`
4. Aktifkan: **Presence Intent**, **Server Members Intent**, **Message Content Intent**
5. OAuth2 → URL Generator: scope `bot + applications.commands`, permission yang dibutuhkan
6. Copy invite link → invite bot ke server

#### Step 3: Setup Spotify API

1. Buka [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create App → copy `Client ID` dan `Client Secret`
3. Masukkan ke `.env`

#### Step 4: Deploy ke Railway

```bash
# 1. Push kode ke GitHub
git init && git add . && git commit -m "initial commit"
git remote add origin https://github.com/username/monohex
git push -u origin main

# 2. Di railway.app:
#    → New Project → Deploy from GitHub repo
#    → Pilih repo monohex
#    → Variables → tambahkan semua env variables
#    → Deploy!
```

#### Step 5: Pertama Kali Jalankan

```bash
# Register slash commands ke Discord (jalankan sekali)
node src/deploy-commands.js

# Atau jalankan dengan flag
node src/index.js --deploy
```

### Alternatif Hosting Gratis

| Platform                     | Kelebihan                                             | Kekurangan                            |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------- |
| **Railway.app**              | Mudah deploy dari GitHub, tidak tidur, $5 kredit free | Kredit habis ~akhir bulan             |
| **Discloud**                 | Khusus Discord bot, tidak tidur, 256MB free           | Lebih teknis                          |
| **Render.com**               | Mudah setup                                           | Free tier tidur setelah 15 menit idle |
| **Oracle Cloud Always Free** | Benar-benar gratis selamanya                          | Setup cukup rumit                     |

---

## 13. Roadmap Pengembangan

### Phase 1 — Core Foundation (Week 1–2)

- [ ] Setup project structure & dependency install
- [ ] Command handler & event handler (auto-load)
- [ ] MongoDB connection & GuildConfig schema
- [ ] Basic embed utilities & error handler
- [ ] Hybrid command system (slash + prefix)
- [ ] **Bot Manager permission checker** (cek managerRoles & managerUsers di setiap /config)
- [ ] Deploy commands script

### Phase 2 — Welcome & Moderation (Week 3)

- [ ] Welcome & leave message system
- [ ] Auto role on join
- [ ] Moderation commands (ban, kick, timeout, warn, mute)
- [ ] Warning system dengan case ID
- [ ] Mod log channel

### Phase 3 — Music System (Week 4)

- [ ] Integrasikan discord-player v6
- [ ] YouTube play (link & search)
- [ ] Spotify integration (track, album, playlist)
- [ ] Queue management
- [ ] Now playing embed dengan progress bar
- [ ] Loop, shuffle, filter, volume

### Phase 4 — Ticket System Revamp (Week 5)

- [ ] Ticket config dengan multi-kategori & archiveCategoryId
- [ ] Panel ticket satu channel dengan tombol per kategori
- [ ] Auto-create channel dengan permission ketat (only user + staff)
- [ ] Modal form saat buat ticket
- [ ] Claim, add/remove user, close ticket
- [ ] **Close = cabut permission user, rename, pindah ke archive category**
- [ ] Status "done" di DB, log embed ke ticket-log
- [ ] HTML transcript generator

### Phase 5 — AutoMod & Reaction Role (Week 6)

- [ ] Anti spam, anti link, bad words filter
- [ ] Anti raid detection
- [ ] Punishment escalation system
- [ ] Reaction role panel (normal, unique, verify mode)

### Phase 6 — Leveling & Giveaway (Week 7)

- [ ] XP system per guild
- [ ] Rank card (Canvas)
- [ ] Leaderboard
- [ ] Level roles
- [ ] Giveaway create/end/reroll

### Phase 7 — Temporary Voice Channel (Week 8)

- [ ] TempVC config schema & /config tempvc
- [ ] voiceStateUpdate handler: deteksi trigger channel
- [ ] Auto-create voice channel saat user join trigger
- [ ] Auto-delete saat channel kosong
- [ ] /vc commands (rename, limit, lock, unlock, kick, transfer, info)
- [ ] Auto transfer ownership saat owner keluar

### Phase 8 — Bot Manager & Extras (Week 9)

- [ ] /config managers (add/remove role & user)
- [ ] Permission middleware: cek Bot Manager di setiap /config command
- [ ] Server stats channels
- [ ] Auto-responder
- [ ] Log system lengkap
- [ ] Utility commands (serverinfo, poll, embed builder, dll)
- [ ] Fun commands
- [ ] `/config view` & `/config reset`
- [ ] Help command dinamis per kategori

### Phase 9 — Testing & Deployment

- [ ] Error handling menyeluruh
- [ ] Rate limit handling
- [ ] Anti-crash & graceful shutdown
- [ ] Deploy ke Railway
- [ ] Dokumentasi README lengkap
- [ ] Invite link & support server

---

## 📦 Dependencies Utama (package.json)

```json
{
  "name": "monohex",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "deploy": "node src/index.js --deploy"
  },
  "dependencies": {
    "discord.js": "^14.x",
    "@discordjs/voice": "^0.17.x",
    "@discordjs/opus": "^0.9.x",
    "discord-player": "^6.x",
    "@discord-player/extractor": "^4.x",
    "sequelize": "^6.37.3",
    "pg": "^8.12.0",
    "pg-hstore": "^2.3.4",
    "spotify-web-api-node": "^5.x",
    "axios": "^1.x",
    "dotenv": "^16.x",
    "winston": "^3.x",
    "node-cron": "^3.x",
    "@napi-rs/canvas": "^0.1.x",
    "ffmpeg-static": "^5.x",
    "sodium-native": "^4.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

---

> **Catatan:** Dokumen ini adalah blueprint arsitektur. Setiap section bisa dikembangkan lebih detail saat mulai implementasi. Mulai dari **Phase 1** dan kerjakan secara berurutan agar fondasi solid sebelum menambah fitur kompleks.

---

_MonoHex Bot — Design Document v1.1.0_  
_Dibuat sebagai panduan pengembangan lengkap_
