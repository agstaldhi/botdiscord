const GuildConfig = require('./GuildConfig');
const WelcomeConfig = require('./WelcomeConfig');
const Warning = require('./Warning');
const MusicConfig = require('./MusicConfig');
const TicketConfig = require('./TicketConfig');
const Ticket = require('./Ticket');
const AutoModConfig = require('./AutoModConfig');
const ReactionRole = require('./ReactionRole');
const UserXP = require('./UserXP');
const Giveaway = require('./Giveaway');
const LevelingConfig = require('./LevelingConfig');
const TempVCConfig = require('./TempVCConfig');
const TempVC = require('./TempVC');
const Autoresponder = require('./Autoresponder');
const StatsConfig = require('./StatsConfig');

// Kumpulan relasi (Relationships/Associations) di masa depan dapat didefinisikan di sini
// Contoh: Warning.belongsTo(GuildConfig, { foreignKey: 'guildId' });

module.exports = {
  GuildConfig,
  WelcomeConfig,
  Warning,
  MusicConfig,
  TicketConfig,
  Ticket,
  AutoModConfig,
  ReactionRole,
  UserXP,
  Giveaway,
  LevelingConfig,
  TempVCConfig,
  TempVC,
  Autoresponder,
  StatsConfig
};
