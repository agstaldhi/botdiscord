const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const UserXP = require('../../models/UserXP');
const logger = require('../../utils/logger');

/**
 * Membuat kartu peringkat (Rank Card) untuk seorang member
 * @param {import('discord.js').User} user 
 * @param {Object} userXP Record user XP dari database
 * @param {string} guildId ID server
 * @returns {Promise<AttachmentBuilder>}
 */
async function generateRankCard(user, userXP, guildId) {
  try {
    // 1. Hitung Rank (posisi di leaderboard)
    const allUsers = await UserXP.findAll({
      where: { guildId },
      order: [
        ['level', 'DESC'],
        ['xp', 'DESC']
      ]
    });
    const rank = allUsers.findIndex(u => u.userId === user.id) + 1 || 1;

    const xpNeeded = (userXP.level + 1) * 100;
    const progress = Math.min(userXP.xp / xpNeeded, 1);

    // 2. Inisialisasi Canvas (800 x 200 - Ideal & Ringan)
    const canvas = createCanvas(800, 200);
    const ctx = canvas.getContext('2d');

    // A. Menggambar Background Card (Dark Mode Minimalis)
    const bgGradient = ctx.createLinearGradient(0, 0, 800, 0);
    bgGradient.addColorStop(0, '#1e1f22'); // Discord dark background
    bgGradient.addColorStop(1, '#2b2d31');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 800, 200);

    // Menambahkan aksen blurple di pinggir kiri card
    ctx.fillStyle = '#5865F2';
    ctx.fillRect(0, 0, 10, 200);

    // B. Menggambar Avatar User (Circle)
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
    let avatarImg;
    try {
      const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      avatarImg = await loadImage(Buffer.from(response.data));
    } catch {
      // Fallback ke default avatar
      const defaultAvatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
      const response = await axios.get(defaultAvatarUrl, { responseType: 'arraybuffer' });
      avatarImg = await loadImage(Buffer.from(response.data));
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(110, 100, 60, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, 50, 40, 120, 120);
    ctx.restore();

    // Menggambar ring di sekeliling avatar
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(110, 100, 62, 0, Math.PI * 2, true);
    ctx.stroke();

    // C. Menulis Username & Tag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial, sans-serif';
    const nameText = user.username;
    ctx.fillText(nameText, 200, 80);

    // Menghitung lebar nama untuk meletakkan tag/discriminator jika ada
    ctx.fillStyle = '#b5bac1';
    ctx.font = '20px Arial, sans-serif';
    const userTag = user.discriminator !== '0' ? `#${user.discriminator}` : '';
    const nameWidth = ctx.measureText(nameText).width;
    // Tulis tag di samping nama
    ctx.fillText(userTag, 200 + nameWidth + 10, 80);

    // D. Menulis Level & Rank (di sebelah kanan atas)
    ctx.fillStyle = '#5865F2';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`RANK #${rank}`, 750, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(`LEVEL ${userXP.level}`, 750, 95);

    // E. Menulis Info XP
    ctx.fillStyle = '#b5bac1';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${userXP.xp} / ${xpNeeded} XP`, 750, 135);

    // F. Menggambar Progress Bar
    ctx.textAlign = 'left'; // Reset alignment

    // Background Bar
    ctx.fillStyle = '#4e5058';
    ctx.beginPath();
    ctx.roundRect(200, 145, 550, 20, 10);
    ctx.fill();

    // Progress Bar Fill (Gradasi warna modern)
    if (progress > 0) {
      const barGradient = ctx.createLinearGradient(200, 0, 750, 0);
      barGradient.addColorStop(0, '#5865F2'); // Blurple
      barGradient.addColorStop(1, '#00b0f4'); // Cyan
      ctx.fillStyle = barGradient;
      ctx.beginPath();
      ctx.roundRect(200, 145, 550 * progress, 20, 10);
      ctx.fill();
    }

    // 3. Ekspor ke buffer dan kemas sebagai attachment
    const buffer = canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: `rank-${user.username}.png` });

  } catch (error) {
    logger.error('Error saat men-generate rank card:', error);
    throw error;
  }
}

module.exports = { generateRankCard };
