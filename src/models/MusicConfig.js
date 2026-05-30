const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let MusicConfig;

if (sequelize) {
  MusicConfig = sequelize.define('MusicConfig', {
    guildId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    musicChannelId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    djRoleId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    defaultVolume: {
      type: DataTypes.INTEGER,
      defaultValue: 80
    },
    mode247: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    autoplay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    maxQueueSize: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    }
  });
} else {
  // Mock model fallback
  MusicConfig = {
    findOne: async () => null,
    create: async (data) => ({
      ...data,
      musicChannelId: null,
      djRoleId: null,
      defaultVolume: 80,
      mode247: false,
      autoplay: false,
      maxQueueSize: 100,
      toJSON: function() { return this; }
    }),
    update: async () => [0]
  };
}

module.exports = MusicConfig;
