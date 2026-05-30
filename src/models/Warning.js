const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let Warning;

if (sequelize) {
  Warning = sequelize.define('Warning', {
    warnId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    moderatorId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      defaultValue: 'Tidak ada alasan.'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });
} else {
  // Mock model fallback
  Warning = {
    findOne: async () => null,
    findAll: async () => [],
    count: async () => 0,
    create: async (data) => ({
      warnId: 'mock-uuid-1234',
      ...data,
      active: true,
      createdAt: new Date(),
      toJSON: function() { return this; }
    }),
    update: async () => [0],
    destroy: async () => 0
  };
}

module.exports = Warning;
