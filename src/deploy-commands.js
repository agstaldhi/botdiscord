require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

/**
 * Membaca semua command di folder src/commands secara rekursif
 */
const readCommands = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      readCommands(filePath);
    } else if (file.endsWith('.js')) {
      try {
        const command = require(filePath);
        if (command.slashData) {
          const data = typeof command.slashData.toJSON === 'function'
            ? command.slashData.toJSON()
            : command.slashData;
          
          commands.push(data);
          logger.info(`Menyiapkan slash command untuk deploy: ${data.name}`);
        } else {
          logger.warn(`Command ${filePath} tidak memiliki slashData, dilewati.`);
        }
      } catch (error) {
        logger.error(`Error loading command di ${filePath} untuk deployment:`, error);
      }
    }
  }
};

readCommands(commandsPath);

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  logger.error("Error: DISCORD_TOKEN atau CLIENT_ID tidak ditemukan di file .env!");
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`Memulai refresh ${commands.length} application (/) commands...`);

    if (process.env.GUILD_ID) {
      // Dev mode: Register commands ke server spesifik secara instan
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      logger.info(`Berhasil mendaftarkan commands ke DEV GUILD: ${process.env.GUILD_ID}`);
    } else {
      // Production mode: Register secara global (butuh beberapa menit - 1 jam untuk update di client)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      logger.info('Berhasil mendaftarkan commands secara GLOBAL.');
    }
  } catch (error) {
    logger.error('Error saat mendeploy commands:', error);
  }
})();
