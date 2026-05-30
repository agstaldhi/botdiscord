const { DataTypes } = require('sequelize');
const sequelize = require('../database');

let WelcomeConfig;

const defaultEmbed = {
  enabled: false,
  color: '#5865F2',
  title: 'Selamat Datang!',
  description: 'Selamat datang {user} di {server}!',
  footer: 'MonoHex Bot',
  thumbnail: true,
  showMemberCount: true
};

const defaultLeaveEmbed = {
  enabled: false,
  color: '#e74c3c',
  title: 'Sampai Jumpa!',
  description: '**{username}** telah meninggalkan {server}.',
  footer: 'MonoHex Bot',
  thumbnail: true,
  showMemberCount: true
};

const defaultAutoRoles = {
  humanRoles: [],
  botRoles: []
};

if (sequelize) {
  WelcomeConfig = sequelize.define('WelcomeConfig', {
    guildId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    welcomeEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    welcomeChannelId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    welcomeMessage: {
      type: DataTypes.TEXT,
      defaultValue: 'Selamat datang {user} di {server}!'
    },
    welcomeEmbed: {
      type: DataTypes.JSONB,
      defaultValue: defaultEmbed,
      get() {
        const val = this.getDataValue('welcomeEmbed');
        return val ? { ...defaultEmbed, ...val } : defaultEmbed;
      }
    },
    dmWelcome: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    dmMessage: {
      type: DataTypes.TEXT,
      defaultValue: 'Terima kasih telah bergabung di {server}!'
    },
    leaveEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    leaveChannelId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    leaveMessage: {
      type: DataTypes.TEXT,
      defaultValue: '**{username}** telah meninggalkan server.'
    },
    leaveEmbed: {
      type: DataTypes.JSONB,
      defaultValue: defaultLeaveEmbed,
      get() {
        const val = this.getDataValue('leaveEmbed');
        return val ? { ...defaultLeaveEmbed, ...val } : defaultLeaveEmbed;
      }
    },
    autoRoles: {
      type: DataTypes.JSONB,
      defaultValue: defaultAutoRoles,
      get() {
        const val = this.getDataValue('autoRoles');
        return val ? { ...defaultAutoRoles, ...val } : defaultAutoRoles;
      }
    }
  });
} else {
  // Mock model fallback
  WelcomeConfig = {
    findOne: async () => null,
    create: async (data) => ({
      ...data,
      welcomeEnabled: false,
      welcomeMessage: 'Selamat datang {user} di {server}!',
      welcomeEmbed: defaultEmbed,
      dmWelcome: false,
      dmMessage: 'Terima kasih telah bergabung di {server}!',
      leaveEnabled: false,
      leaveMessage: '**{username}** telah meninggalkan server.',
      leaveEmbed: defaultLeaveEmbed,
      autoRoles: defaultAutoRoles,
      toJSON: function() { return this; }
    }),
    update: async () => [0]
  };
}

module.exports = WelcomeConfig;
