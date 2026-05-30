const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let UserXP;

if (sequelize) {
  UserXP = sequelize.define('UserXP', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalMessages: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastXpGain: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'guildId']
      }
    ]
  });
} else {
  // Mock model fallback
  UserXP = {
    findOne: async () => null,
    findAll: async () => [],
    findOrCreate: async ({ where }) => {
      const mockObj = {
        userId: where.userId,
        guildId: where.guildId,
        xp: 0,
        level: 0,
        totalMessages: 0,
        lastXpGain: new Date(),
        save: async function() { return this; },
        toJSON: function() { return this; }
      };
      return [mockObj, true];
    },
    update: async () => [0]
  };
}

module.exports = UserXP;
