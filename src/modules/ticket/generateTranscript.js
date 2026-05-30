const { AttachmentBuilder } = require('discord.js');
const logger = require('../../utils/logger');

/**
 * Membuat transcript HTML dari sebuah channel
 * @param {import('discord.js').TextChannel} channel 
 * @param {number} limit Maksimal pesan yang diambil
 * @returns {Promise<AttachmentBuilder>}
 */
async function generateTranscript(channel, limit = 500) {
  try {
    let allMessages = [];
    let lastId = null;

    // Fetch messages in batches of 100
    while (allMessages.length < limit) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;

      const messages = await channel.messages.fetch(options);
      if (messages.size === 0) break;

      allMessages.push(...messages.values());
      lastId = messages.last().id;

      if (messages.size < 100) break;
    }

    // Sort messages old to new
    allMessages.reverse();
    if (allMessages.length > limit) {
      allMessages = allMessages.slice(allMessages.length - limit);
    }

    // Generate HTML content
    let html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Transcript - ${channel.name}</title>
      <style>
        body {
          background-color: #36393f;
          color: #dcddde;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 15px;
          margin: 0;
          padding: 20px;
        }
        .header {
          border-bottom: 1px solid #4f545c;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .guild-name {
          font-size: 24px;
          font-weight: bold;
          color: #fff;
        }
        .channel-name {
          font-size: 18px;
          color: #8e9297;
        }
        .message-count {
          font-size: 14px;
          color: #72767d;
          margin-top: 5px;
        }
        .message {
          display: flex;
          margin-bottom: 16px;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 16px;
          background-color: #2f3136;
        }
        .message-content {
          display: flex;
          flex-direction: column;
        }
        .message-header {
          display: flex;
          align-items: baseline;
          margin-bottom: 4px;
        }
        .author {
          font-weight: 500;
          color: #fff;
          margin-right: 8px;
          font-size: 16px;
        }
        .author.bot {
          background-color: #5865F2;
          color: #fff;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          margin-right: 8px;
          text-transform: uppercase;
          font-weight: bold;
        }
        .timestamp {
          font-size: 12px;
          color: #72767d;
        }
        .body {
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.4;
        }
        .embed {
          background-color: #2f3136;
          border-left: 4px solid #5865F2;
          border-radius: 4px;
          padding: 12px;
          margin-top: 8px;
          max-width: 520px;
        }
        .embed-title {
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }
        .embed-desc {
          font-size: 14px;
          color: #dcddde;
        }
        .embed-field {
          margin-top: 8px;
        }
        .embed-field-name {
          font-weight: 600;
          font-size: 13px;
          color: #fff;
        }
        .embed-field-value {
          font-size: 13px;
          color: #dcddde;
          margin-top: 2px;
        }
        .attachment {
          margin-top: 8px;
          color: #00b0f4;
          text-decoration: none;
        }
        .attachment:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="guild-name">${channel.guild.name}</div>
        <div class="channel-name">Saluran: #${channel.name}</div>
        <div class="message-count">Total Pesan: ${allMessages.length}</div>
      </div>
      <div class="messages">
    `;

    allMessages.forEach(msg => {
      const avatarUrl = msg.author.displayAvatarURL({ dynamic: false, size: 64, extension: 'png' });
      const timeStr = msg.createdAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const isBot = msg.author.bot;

      html += `
        <div class="message">
          <img class="avatar" src="${avatarUrl}" alt="Avatar">
          <div class="message-content">
            <div class="message-header">
              <span class="author">${msg.author.tag}</span>
              ${isBot ? '<span class="author bot">BOT</span>' : ''}
              <span class="timestamp">${timeStr}</span>
            </div>
            <div class="body">${escapeHtml(msg.content)}</div>
      `;

      // Render Embeds
      if (msg.embeds && msg.embeds.length > 0) {
        msg.embeds.forEach(embed => {
          const borderColor = embed.hexColor || '#5865F2';
          html += `<div class="embed" style="border-left-color: ${borderColor}">`;
          if (embed.title) {
            html += `<div class="embed-title">${escapeHtml(embed.title)}</div>`;
          }
          if (embed.description) {
            html += `<div class="embed-desc">${escapeHtml(embed.description)}</div>`;
          }
          if (embed.fields && embed.fields.length > 0) {
            embed.fields.forEach(field => {
              html += `
                <div class="embed-field">
                  <div class="embed-field-name">${escapeHtml(field.name)}</div>
                  <div class="embed-field-value">${escapeHtml(field.value)}</div>
                </div>
              `;
            });
          }
          html += `</div>`;
        });
      }

      // Render Attachments
      if (msg.attachments && msg.attachments.size > 0) {
        msg.attachments.forEach(attachment => {
          html += `
            <a class="attachment" href="${attachment.url}" target="_blank">
              Attachment: ${escapeHtml(attachment.name)}
            </a>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `
      </div>
    </body>
    </html>
    `;

    const buffer = Buffer.from(html, 'utf-8');
    return new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.html` });
  } catch (error) {
    logger.error('Gagal membuat transcript ticket:', error);
    throw error;
  }
}

/**
 * Escapes HTML characters
 * @param {string} text 
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { generateTranscript };
