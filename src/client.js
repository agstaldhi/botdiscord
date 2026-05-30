const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { Player } = require('discord-player');
const logger = require('./utils/logger');
const embeds = require('./utils/embeds');

class MonoHexClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildPresences
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
      ]
    });

    // Collections
    this.commands = new Collection();
    this.prefixCommands = new Collection();
    this.aliases = new Collection();
    this.cooldowns = new Collection();
    
    // Core Utilities
    this.logger = logger;
    this.embeds = embeds;

    // Inisialisasi Discord Player v6
    this.player = new Player(this, {
      ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      }
    });
  }
}

module.exports = MonoHexClient;
