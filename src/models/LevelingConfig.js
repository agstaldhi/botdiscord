const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let LevelingConfig;

if (sequelize) {
  LevelingConfig = sequelize.define('LevelingConfig', {
    guildId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    levelUpChannelId: {
      type: DataTypes.STRING,
      allowNull: true // null = kirim di channel tempat pesan dikirim
    },
    levelRoles: {
      type: DataTypes.JSONB,
      defaultValue: {} // Format: { "5": "roleId_5", "10": "roleId_10" }
    },
    xpMin: {
      type: DataTypes.INTEGER,
      defaultValue: 15
    },
    xpMax: {
      type: DataTypes.INTEGER,
      defaultValue: 25
    },
    xpCooldown: {
      type: DataTypes.INTEGER,
      defaultValue: 60000 // 60 detik dalam milidetik
    }
  });
} else {
  // Mock model fallback
  LevelingConfig = {
    findOne: async () => null,
    create: async (data) => ({
      ...data,
      levelUpChannelId: null,
      levelRoles: {},
      xpMin: 15,
      xpMax: 25,
      xpCooldown: 60000,
      toJSON: function() { return this; }
    }),
    findOrCreate: async ({ where }) => {
      const mockObj = {
        guildId: where.guildId,
        levelUpChannelId: null,
        levelRoles: {},
        xpMin: 15,
        xpMax: 25,
        xpCooldown: 60000,
        toJSON: function() { return this; }
      };
      return [mockObj, true];
    },
    update: async () => [0]
  };
}

module.exports = LevelingConfig;
