const fs = require('fs');
const path = require('path');

/**
 * Loader untuk memuat semua command secara dinamis
 * @param {import('../client')} client 
 */
module.exports = (client) => {
  const commandsPath = path.join(__dirname, '../commands');
  
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
  }

  // Fungsi rekursif untuk mencari semua file .js di dalam folder commands
  const loadCommands = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        loadCommands(filePath);
      } else if (file.endsWith('.js')) {
        try {
          const command = require(filePath);
          
          if (!command.name) {
            client.logger.warn(`Command di ${filePath} tidak memiliki properti 'name'.`);
            continue;
          }
          
          // Tentukan kategori berdasarkan folder induk jika tidak diset secara eksplisit
          if (!command.category) {
            command.category = path.basename(path.dirname(filePath));
          }
          
          // Simpan ke collection utama
          client.commands.set(command.name, command);
          
          // Daftarkan aliases untuk prefix command
          if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
              client.aliases.set(alias, command.name);
            });
          }
          
          client.logger.info(`Loaded command: ${command.name} (kategori: ${command.category})`);
        } catch (error) {
          client.logger.error(`Gagal memuat command di ${filePath}:`, error);
        }
      }
    }
  };

  loadCommands(commandsPath);
  client.logger.info(`Berhasil memuat total ${client.commands.size} command.`);
};
