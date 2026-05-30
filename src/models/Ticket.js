const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let Ticket;

if (sequelize) {
  Ticket = sequelize.define('Ticket', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticketId: {
      type: DataTypes.STRING, // e.g. "ticket-0001"
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
    channelId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    claimedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING, // "open", "claimed", "done"
      defaultValue: 'open'
    },
    participants: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['guildId', 'ticketId']
      },
      {
        fields: ['guildId', 'channelId']
      }
    ]
  });
} else {
  // Mock model fallback
  Ticket = {
    findOne: async () => null,
    findAll: async () => [],
    create: async (data) => ({
      ...data,
      id: Math.floor(Math.random() * 10000),
      status: 'open',
      participants: [],
      closedAt: null,
      closedBy: null,
      reason: null,
      toJSON: function() { return this; }
    }),
    update: async () => [0],
    destroy: async () => 0
  };
}

module.exports = Ticket;
