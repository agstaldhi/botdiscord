const { PermissionFlagsBits, ChannelType } = require('discord.js');
const TempVCConfig = require('../../models/TempVCConfig');
const TempVC = require('../../models/TempVC');
const logger = require('../../utils/logger');

/**
 * Membuat Temporary Voice Channel baru saat user memasuki trigger channel
 * @param {import('discord.js').GuildMember} member 
 * @param {import('discord.js').VoiceState} voiceState 
 */
async function createTempVC(member, voiceState) {
  const guild = member.guild;
  
  try {
    // Ambil konfigurasi TempVC
    const config = await TempVCConfig.findOne({ where: { guildId: guild.id } });
    if (!config || !config.enabled || !config.triggerChannelId) return;

    // 1. Tentukan nama channel dari template
    let channelName = config.nameTemplate || "🎙️ {username}'s Room";
    channelName = channelName
      .replace('{username}', member.user.username)
      .replace('{displayName}', member.displayName);

    // Pastikan panjang nama channel aman (Discord batas 100 karakter)
    if (channelName.length > 100) channelName = channelName.substring(0, 100);

    // 2. Buat Channel Voice
    const channelOptions = {
      name: channelName,
      type: ChannelType.GuildVoice,
      bitrate: config.bitrate || 64000,
      userLimit: config.userLimit || 0,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers
          ]
        }
      ]
    };

    // Set parent category jika dikonfigurasi
    if (config.categoryId) {
      const category = guild.channels.cache.get(config.categoryId);
      if (category && category.type === ChannelType.GuildCategory) {
        channelOptions.parent = config.categoryId;
      }
    }

    const newChannel = await guild.channels.create(channelOptions);

    // 3. Simpan tracking ke database
    await TempVC.create({
      channelId: newChannel.id,
      guildId: guild.id,
      ownerId: member.id
    });

    // 4. Pindahkan member ke channel baru
    await voiceState.setChannel(newChannel);

    logger.info(`TempVC dibuat: ${channelName} (${newChannel.id}) untuk owner ${member.user.tag}`);
    return newChannel;

  } catch (error) {
    logger.error('Error saat membuat TempVC:', error);
  }
}

module.exports = { createTempVC };
