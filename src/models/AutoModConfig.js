const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let AutoModConfig;

const defaultAntiSpam = { enabled: false, maxMessages: 5, interval: 5000, punishment: 'delete' };
const defaultAntiRaid = { enabled: false, joinThreshold: 10, joinInterval: 10000, action: 'kick' };
const defaultAntiLink = { enabled: false, whitelist: [], punishment: 'delete' };
const defaultBadWords = { enabled: false, words: [], wildcardMatch: false, punishment: 'delete' };
const defaultAntiMention = { enabled: false, maxMentions: 5, punishment: 'delete' };
const defaultAntiCaps = { enabled: false, threshold: 70, minLength: 10, punishment: 'delete' };
const defaultPunishmentEscalation = { enabled: false, levels: [] };

if (sequelize) {
  AutoModConfig = sequelize.define('AutoModConfig', {
    guildId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    antiSpam: {
      type: DataTypes.JSONB,
      defaultValue: defaultAntiSpam
    },
    antiRaid: {
      type: DataTypes.JSONB,
      defaultValue: defaultAntiRaid
    },
    antiLink: {
      type: DataTypes.JSONB,
      defaultValue: defaultAntiLink
    },
    badWords: {
      type: DataTypes.JSONB,
      defaultValue: defaultBadWords
    },
    antiMention: {
      type: DataTypes.JSONB,
      defaultValue: defaultAntiMention
    },
    antiCaps: {
      type: DataTypes.JSONB,
      defaultValue: defaultAntiCaps
    },
    ignoredRoles: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    ignoredChannels: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    punishmentEscalation: {
      type: DataTypes.JSONB,
      defaultValue: defaultPunishmentEscalation
    }
  });
} else {
  // Mock model fallback
  AutoModConfig = {
    findOne: async () => null,
    create: async (data) => ({
      ...data,
      antiSpam: defaultAntiSpam,
      antiRaid: defaultAntiRaid,
      antiLink: defaultAntiLink,
      badWords: defaultBadWords,
      antiMention: defaultAntiMention,
      antiCaps: defaultAntiCaps,
      ignoredRoles: [],
      ignoredChannels: [],
      punishmentEscalation: defaultPunishmentEscalation,
      toJSON: function() { return this; }
    }),
    findOrCreate: async ({ where }) => {
      const mockObj = {
        guildId: where.guildId,
        antiSpam: defaultAntiSpam,
        antiRaid: defaultAntiRaid,
        antiLink: defaultAntiLink,
        badWords: defaultBadWords,
        antiMention: defaultAntiMention,
        antiCaps: defaultAntiCaps,
        ignoredRoles: [],
        ignoredChannels: [],
        punishmentEscalation: defaultPunishmentEscalation,
        toJSON: function() { return this; }
      };
      return [mockObj, true];
    },
    update: async () => [0]
  };
}

module.exports = AutoModConfig;
