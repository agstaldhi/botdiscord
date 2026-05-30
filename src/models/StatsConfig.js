const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let StatsConfig;

if (sequelize) {
  StatsConfig = sequelize.define('StatsConfig', {
    guildId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    channels: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    updateInterval: {
      type: DataTypes.INTEGER,
      defaultValue: 10 // menit
    }
  });
} else {
  // Mock model fallback
  StatsConfig = {
    findOne: async ({ where }) => {
      return {
        guildId: where.guildId,
        channels: [],
        updateInterval: 10,
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
        channels: [],
        updateInterval: 10,
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

module.exports = StatsConfig;
