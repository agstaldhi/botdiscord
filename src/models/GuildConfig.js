const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let GuildConfig;

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

if (sequelize) {
  GuildConfig = sequelize.define('GuildConfig', {
    guildId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    prefix: {
      type: DataTypes.STRING,
      defaultValue: '!'
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'id'
    },
    modules: {
      type: DataTypes.JSONB,
      defaultValue: defaultModules,
      get() {
        const rawValue = this.getDataValue('modules');
        return rawValue ? { ...defaultModules, ...rawValue } : defaultModules;
      }
    },
    allowedChannels: {
      type: DataTypes.JSONB,
      defaultValue: defaultAllowedChannels,
      get() {
        const rawValue = this.getDataValue('allowedChannels');
        return rawValue ? { ...defaultAllowedChannels, ...rawValue } : defaultAllowedChannels;
      }
    },
    ignoredChannels: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    managerRoles: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    managerUsers: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    modLogChannelId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    serverLogChannelId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
} else {
  // Mock Model Fallback jika database dinonaktifkan
  GuildConfig = {
    findOne: async () => null,
    create: async (data) => ({
      ...data,
      prefix: '!',
      language: 'id',
      modules: defaultModules,
      allowedChannels: defaultAllowedChannels,
      ignoredChannels: [],
      managerRoles: [],
      managerUsers: [],
      modLogChannelId: null,
      serverLogChannelId: null,
      toObject: function() { return this; },
      toJSON: function() { return this; }
    }),
    findOrCreate: async ({ where }) => {
      const mockObj = {
        guildId: where.guildId,
        prefix: '!',
        language: 'id',
        modules: defaultModules,
        allowedChannels: defaultAllowedChannels,
        ignoredChannels: [],
        managerRoles: [],
        managerUsers: [],
        modLogChannelId: null,
        serverLogChannelId: null,
        toObject: function() { return this; },
        toJSON: function() { return this; }
      };
      return [mockObj, true];
    },
    update: async () => [0]
  };
}

module.exports = GuildConfig;
