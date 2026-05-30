/**
 * Mengubah durasi dalam milidetik menjadi format string HH:MM:SS atau MM:SS
 * @param {number} ms 
 * @returns {string}
 */
module.exports = (ms) => {
  if (isNaN(ms) || ms < 0) return '00:00';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  const pad = (num) => num.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  
  return `${pad(minutes)}:${pad(seconds)}`;
};
