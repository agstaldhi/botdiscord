const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let TicketConfig;

const defaultCategories = [];

if (sequelize) {
  TicketConfig = sequelize.define('TicketConfig', {
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
    categories: {
      type: DataTypes.JSONB,
      defaultValue: defaultCategories
    },
    logChannelId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transcriptChannelId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    archiveCategoryId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ticketCounter: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    closeConfirmation: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    archiveOnClose: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });
} else {
  // Mock model fallback
  TicketConfig = {
    findOne: async () => null,
    create: async (data) => ({
      ...data,
      enabled: false,
      categories: defaultCategories,
      logChannelId: null,
      transcriptChannelId: null,
      archiveCategoryId: null,
      ticketCounter: 0,
      closeConfirmation: true,
      archiveOnClose: true,
      toJSON: function() { return this; }
    }),
    findOrCreate: async ({ where }) => {
      const mockObj = {
        guildId: where.guildId,
        enabled: false,
        categories: defaultCategories,
        logChannelId: null,
        transcriptChannelId: null,
        archiveCategoryId: null,
        ticketCounter: 0,
        closeConfirmation: true,
        archiveOnClose: true,
        toJSON: function() { return this; }
      };
      return [mockObj, true];
    },
    update: async () => [0]
  };
}

module.exports = TicketConfig;
