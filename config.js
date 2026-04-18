const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

// Ajout nécessaire !
const config = process.env;

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
  AUTO_VIEW_STATUS: 'true',
  AUTO_LIKE_STATUS: 'true',
  AUTO_RECORDING: 'false',
  ANTI_CALL: 'false',
    
  AUTO_LIKE_EMOJI: ['🖤', '🍬', '💫', '🎈', '💚', '🎶', '❤️', '🧫', '⚽'],

  PREFIX: config.PREFIX || '.',

  BOT_FOOTER: '> © MADE BY BILAL',

  MAX_RETRIES: 3,

  GROUP_INVITE_LINK: 'https://chat.whatsapp.com/BwWffeDwiqe6cjDDklYJ5m?mode=gi_t',

  ADMIN_LIST_PATH: './admin.json',
  IMAGE_PATH: 'https://o.uguu.se/lVabnzAl.jpg',

  NEWSLETTER_JID: '120363296818107681@newsletter',
  NEWSLETTER_MESSAGE_ID: '428',

  OTP_EXPIRY: 300000,

  OWNER_NUMBER: '923254352974',

  DEV_MODE: 'false',

  CHANNEL_LINK: 'https://whatsapp.com/channel/0029Vaj3Xnu17EmtDxTNnQ0G',

  WORK_TYPE: "public",

  ANTI_CAL: "off",

  TELEGRAM_BOT_TOKEN: config.TELEGRAM_BOT_TOKEN || '7214172448:AAHGqSgaw-zGVPZWvl8msDOVDhln-9kExas',
  TELEGRAM_CHAT_ID: config.TELEGRAM_CHAT_ID || '7825445776',

  AUTO_REACT: config.AUTO_REACT || 'true',
  ANTI_CALL: config.ANTI_CALL || 'false',
  AUTO_STATUS_SEEN: config.AUTO_STATUS_SEEN || "true",
  AUTO_STATUS_REACT: config.AUTO_STATUS_REACT || "true",
  AUTO_STATUS_REPLY: config.AUTO_STATUS_REPLY || "false",
  AUTO_STATUS_MSG: config.AUTO_STATUS_MSG || "",

  READ_MESSAGE: config.READ_MESSAGE || 'true',

  CUSTOM_REACT: config.CUSTOM_REACT || 'false',
  CUSTOM_REACT_EMOJIS: config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔',

  MODE: config.MODE || "public",
};
