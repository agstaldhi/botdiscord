const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let ReactionRole;

if (sequelize) {
  ReactionRole = sequelize.define('ReactionRole', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: 'Pilih Role Anda'
    },
    type: {
      type: DataTypes.STRING, // "normal", "unique", "verify"
      defaultValue: 'normal'
    },
    reactions: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of { emoji: String, roleId: String, description: String }
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['messageId']
      },
      {
        fields: ['guildId']
      }
    ]
  });
} else {
  // Mock model fallback
  ReactionRole = {
    findOne: async () => null,
    findAll: async () => [],
    create: async (data) => ({
      ...data,
      id: Math.floor(Math.random() * 10000),
      title: 'Pilih Role Anda',
      type: 'normal',
      reactions: [],
      toJSON: function() { return this; }
    }),
    update: async () => [0],
    destroy: async () => 0
  };
}

module.exports = ReactionRole;
