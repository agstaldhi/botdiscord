const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let Autoresponder;

if (sequelize) {
  Autoresponder = sequelize.define('Autoresponder', {
    guildId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    triggers: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  });
} else {
  // Mock model fallback
  Autoresponder = {
    findOne: async ({ where }) => {
      return {
        guildId: where.guildId,
        triggers: [],
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
        triggers: [],
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

module.exports = Autoresponder;
