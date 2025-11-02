// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.symbolicator = {
  shouldProcess: (stack) => {
    try {
      return stack.some((f) => f.file && !f.file.includes('<anonymous>'));
    } catch {
      return true;
    }
  },
  customizeFrame: (frame) => {
    if (frame.file && frame.file.includes('<anonymous>')) {
      return { ...frame, collapse: true };
    }
    return frame;
  },
};

module.exports = config;
