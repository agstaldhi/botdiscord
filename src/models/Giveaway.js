const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let Giveaway;

if (sequelize) {
  Giveaway = sequelize.define('Giveaway', {
    messageId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hostedBy: {
      type: DataTypes.STRING,
      allowNull: false
    },
    prize: {
      type: DataTypes.STRING,
      allowNull: false
    },
    winnerCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    ended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    winners: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    participants: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    requirements: {
      type: DataTypes.JSONB,
      defaultValue: {
        minLevel: 0,
        roleId: null,
        serverBooster: false
      }
    }
  });
} else {
  // Mock model fallback
  Giveaway = {
    findOne: async () => null,
    findAll: async () => [],
    create: async (data) => ({
      ...data,
      winners: [],
      participants: [],
      requirements: { minLevel: 0, roleId: null, serverBooster: false },
      toJSON: function() { return this; }
    }),
    update: async () => [0]
  };
}

module.exports = Giveaway;
