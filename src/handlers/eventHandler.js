const fs = require('fs');
const path = require('path');

/**
 * Loader untuk memuat semua event listener secara dinamis
 * @param {import('../client')} client 
 */
module.exports = (client) => {
  const eventsPath = path.join(__dirname, '../events');
  
  if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, { recursive: true });
  }

  const loadEvents = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        loadEvents(filePath);
      } else if (file.endsWith('.js')) {
        try {
          const event = require(filePath);
          const eventName = path.basename(file, '.js');
          const name = event.name || eventName;
          
          // Deteksi folder induk untuk membedakan Discord vs Player (music) events
          const parentFolder = path.basename(path.dirname(filePath));
          
          if (parentFolder === 'player') {
            // Pendaftaran event discord-player v6
            if (client.player && client.player.events) {
              client.player.events.on(name, (...args) => event.execute(client, ...args));
              client.logger.info(`Loaded Player Event: ${name}`);
            } else {
              // Jika player belum di-load, kita simpan loader ini untuk dipanggil nanti
              if (!client._tempPlayerEvents) client._tempPlayerEvents = [];
              client._tempPlayerEvents.push({ name, event });
              client.logger.info(`Queued Player Event: ${name} (menunggu inisialisasi player)`);
            }
          } else {
            // Pendaftaran event Discord Client standar
            if (event.once) {
              client.once(name, (...args) => event.execute(client, ...args));
            } else {
              client.on(name, (...args) => event.execute(client, ...args));
            }
            client.logger.info(`Loaded Discord Event: ${name}`);
          }
        } catch (error) {
          client.logger.error(`Gagal memuat event di ${filePath}:`, error);
        }
      }
    }
  };

  loadEvents(eventsPath);
};
