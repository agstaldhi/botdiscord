const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let TempVCConfig;

if (sequelize) {
  TempVCConfig = sequelize.define('TempVCConfig', {
    guildId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    triggerChannelId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nameTemplate: {
      type: DataTypes.STRING,
      defaultValue: "🎙️ {username}'s Room"
    },
    userLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bitrate: {
      type: DataTypes.INTEGER,
      defaultValue: 64000
    },
    allowUserRename: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    allowUserLimit: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    allowUserLock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    deleteDelay: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });
} else {
  // Mock model fallback
  TempVCConfig = {
    findOne: async ({ where }) => {
      // Return a default mock config
      return {
        guildId: where.guildId,
        enabled: false,
        triggerChannelId: null,
        categoryId: null,
        nameTemplate: "🎙️ {username}'s Room",
        userLimit: 0,
        bitrate: 64000,
        allowUserRename: true,
        allowUserLimit: true,
        allowUserLock: true,
        deleteDelay: 0,
        update: async function(data) {
          Object.assign(this, data);
          return this;
        },
        toJSON: function() { return this; }
      };
    },
    findOrCreate: async ({ where }) => {
      const config = {
        guildId: where.guildId,
        enabled: false,
        triggerChannelId: null,
        categoryId: null,
        nameTemplate: "🎙️ {username}'s Room",
        userLimit: 0,
        bitrate: 64000,
        allowUserRename: true,
        allowUserLimit: true,
        allowUserLock: true,
        deleteDelay: 0,
        update: async function(data) {
          Object.assign(this, data);
          return this;
        },
        toJSON: function() { return this; }
      };
      return [config, true];
    },
    create: async (data) => ({
      ...data,
      update: async function(d) { Object.assign(this, d); return this; },
      toJSON: function() { return this; }
    }),
    update: async () => [0]
  };
}

module.exports = TempVCConfig;
