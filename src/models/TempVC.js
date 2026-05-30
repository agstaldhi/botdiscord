const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let TempVC;

if (sequelize) {
  TempVC = sequelize.define('TempVC', {
    channelId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
} else {
  // Mock model fallback
  // Use in-memory store for active Temp VCs in mock mode
  const mockTempVCs = [];
  TempVC = {
    findOne: async ({ where }) => {
      return mockTempVCs.find(vc => {
        if (where.channelId && vc.channelId !== where.channelId) return false;
        if (where.guildId && vc.guildId !== where.guildId) return false;
        if (where.ownerId && vc.ownerId !== where.ownerId) return false;
        return true;
      }) || null;
    },
    findAll: async ({ where } = {}) => {
      if (!where) return mockTempVCs;
      return mockTempVCs.filter(vc => {
        if (where.channelId && vc.channelId !== where.channelId) return false;
        if (where.guildId && vc.guildId !== where.guildId) return false;
        if (where.ownerId && vc.ownerId !== where.ownerId) return false;
        return true;
      });
    },
    create: async (data) => {
      const newVC = {
        ...data,
        destroy: async function() {
          const idx = mockTempVCs.indexOf(this);
          if (idx > -1) mockTempVCs.splice(idx, 1);
        },
        update: async function(d) {
          Object.assign(this, d);
          return this;
        },
        toJSON: function() { return this; }
      };
      mockTempVCs.push(newVC);
      return newVC;
    },
    destroy: async ({ where }) => {
      let count = 0;
      for (let i = mockTempVCs.length - 1; i >= 0; i--) {
        const vc = mockTempVCs[i];
        if (where.channelId && vc.channelId !== where.channelId) continue;
        if (where.guildId && vc.guildId !== where.guildId) continue;
        mockTempVCs.splice(i, 1);
        count++;
      }
      return count;
    },
    update: async (data, { where }) => {
      let count = 0;
      mockTempVCs.forEach(vc => {
        if (where.channelId && vc.channelId !== where.channelId) return;
        if (where.guildId && vc.guildId !== where.guildId) return;
        Object.assign(vc, data);
        count++;
      });
      return [count];
    }
  };
}

module.exports = TempVC;
