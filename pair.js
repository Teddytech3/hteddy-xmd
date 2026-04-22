'use strict';
console.log('=== BOOTING TEDDY-XMD ===');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack || err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpegPath = ffmpegInstaller.path;
process.env.FFMPEG_PATH = ffmpegPath;

const ffmpeg = require('fluent-ffmpeg');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const pino = require('pino');
const axios = require('axios');
const FormData = require('form-data');
const os = require('os');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Jimp = require('jimp');
const crypto = require('crypto');
const FileType = require('file-type');
const yts = require('yt-search');
const TelegramBot = require('node-telegram-bot-api');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const l = console.log;
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const StickersTypes = require('wa-sticker-formatter');
const util = require('util');
const { sms, downloadMediaMessage, AntiDelete } = require('./lib');
const { fromBuffer } = require('file-type');
const bodyparser = require('body-parser');
const Crypto = require('crypto');
const express = require("express");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// HARDCODED VALUES YOU REQUESTED
const NEWSLETTER_JID = '120363421104812135@newsletter';
const GROUP_INVITE_CODE = 'CLClgqJIC59GrcI4sRzLu8';

const defaultConfig = {
  AUTO_VIEW_STATUS: 'true',
  AUTO_LIKE_STATUS: 'true',
  AUTO_RECORDING: 'false',
  AUTO_LIKE_EMOJI: ['🖤', '🍬', '💫', '🎈', '💚', '🎶', '❤️', '🧫', '⚽'],
  PREFIX: config.PREFIX || '.',
  BOT_FOOTER: '> © MADE BY TEDDY TECH',
  MAX_RETRIES: 3,
  GROUP_INVITE_LINK: 'https://chat.whatsapp.com/CLClgqJIC59GrcI4sRzLu8',
  ADMIN_LIST_PATH: './admin.json',
  IMAGE_PATH: 'https://files.catbox.moe/13nyhx.jpg',
  NEWSLETTER_JID: NEWSLETTER_JID,
  NEWSLETTER_MESSAGE_ID: '428',
  OTP_EXPIRY: 300000,
  OWNER_NUMBER: '254799963583',
  DEV_MODE: 'false',
  CHANNEL_LINK: 'https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n',
  WORK_TYPE: "public",
  ANTI_CAL: "off",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '7214172448:AAHGqSgaw-zGVPZWvl8msDOVDhln-9kExas',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '7825445776',
  AUTO_REACT: config.AUTO_REACT || 'true',
  AUTO_STATUS_SEEN: config.AUTO_STATUS_SEEN || "true",
  AUTO_STATUS_REACT: config.AUTO_STATUS_REACT || "true",
  AUTO_STATUS_REPLY: config.AUTO_STATUS_REPLY || "false",
  AUTO_STATUS_MSG: config.AUTO_STATUS_MSG || "",
  READ_MESSAGE: config.READ_MESSAGE || 'true',
  CUSTOM_REACT: config.CUSTOM_REACT || 'false',
  CUSTOM_REACT_EMOJIS: config.CUSTOM_REACT_EMOJIS || '🏐,🧳,❤️,😍,💗',
  MODE: config.MODE || "public"
};

const telegramBot = new TelegramBot(defaultConfig.TELEGRAM_BOT_TOKEN, { polling: false });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kaviduinduwara:kavidu2008@cluster0.bqmspdf.mongodb.net/soloBot?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  autoReconnectFromMongoDB(); // Auto reconnect all bots from DB on startup
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

const sessionSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  creds: { type: Object, required: true },
  config: { type: Object, default: defaultConfig },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const numberSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const otpSchema = new mongoose.Schema({
  number: { type: String, required: true },
  otp: { type: String, required: true },
  newConfig: { type: Object },
  expiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);
const BotNumber = mongoose.model('BotNumber', numberSchema);
const OTP = mongoose.model('OTP', otpSchema);

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = './sessions_multi';
const otpStore = new Map();
const cleanupLocks = new Set();

const welcomeSettings = new Map();
const antilinkSettings = new Map();

if (!fs.existsSync(SESSION_BASE_PATH)) {
  fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

async function saveSessionToMongoDB(number, creds, userConfig = null) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const existingSession = await Session.findOne({ number: sanitizedNumber });

    if (existingSession) {
      await Session.findOneAndUpdate(
        { number: sanitizedNumber },
        {
          creds: creds,
          updatedAt: new Date()
        }
      );
      console.log(`🔄 Session credentials updated for ${sanitizedNumber}`);
    } else {
      const sessionData = {
        number: sanitizedNumber,
        creds: creds,
        config: userConfig || defaultConfig,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await Session.findOneAndUpdate(
        { number: sanitizedNumber },
        sessionData,
        { upsert: true, new: true }
      );
      console.log(`✅ NEW Session saved to MongoDB for ${sanitizedNumber}`);
    }
  } catch (error) {
    console.error('❌ Failed to save/update session in MongoDB:', error);
    throw error;
  }
}

async function getSessionFromMongoDB(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const session = await Session.findOne({ number: sanitizedNumber });
    return session? session.creds : null;
  } catch (error) {
    console.error('❌ Failed to get session from MongoDB:', error);
    return null;
  }
}

async function getUserConfigFromMongoDB(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const session = await Session.findOne({ number: sanitizedNumber });
    return session? session.config : {...defaultConfig };
  } catch (error) {
    console.error('❌ Failed to get user config from MongoDB:', error);
    return {...defaultConfig };
  }
}

async function updateUserConfigInMongoDB(number, newConfig) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    await Session.findOneAndUpdate(
      { number: sanitizedNumber },
      {
        config: newConfig,
        updatedAt: new Date()
      }
    );
    console.log(`✅ Config updated in MongoDB for ${sanitizedNumber}`);
  } catch (error) {
    console.error('❌ Failed to update config in MongoDB:', error);
    throw error;
  }
}

async function deleteSessionFromMongoDB(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    await Promise.all([
      Session.findOneAndDelete({ number: sanitizedNumber }),
      BotNumber.findOneAndDelete({ number: sanitizedNumber }),
      OTP.findOneAndDelete({ number: sanitizedNumber })
    ]);
    console.log(`✅ Session completely deleted from MongoDB for ${sanitizedNumber}`);
  } catch (error) {
    console.error('❌ Failed to delete session from MongoDB:', error);
    throw error;
  }
}

async function addNumberToMongoDB(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    await BotNumber.findOneAndUpdate(
      { number: sanitizedNumber },
      { number: sanitizedNumber, active: true },
      { upsert: true }
    );
    console.log(`✅ Number ${sanitizedNumber} added to MongoDB`);
  } catch (error) {
    console.error('❌ Failed to add number to MongoDB:', error);
    throw error;
  }
}

async function getAllNumbersFromMongoDB() {
  try {
    const numbers = await BotNumber.find({ active: true });
    return numbers.map(n => n.number);
  } catch (error) {
    console.error('❌ Failed to get numbers from MongoDB:', error);
    return [];
  }
}

async function saveOTPToMongoDB(number, otp, newConfig) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const expiry = new Date(Date.now() + defaultConfig.OTP_EXPIRY);
    await OTP.findOneAndUpdate(
      { number: sanitizedNumber },
      {
        number: sanitizedNumber,
        otp: otp,
        newConfig: newConfig,
        expiry: expiry
      },
      { upsert: true }
    );
    console.log(`✅ OTP saved to MongoDB for ${sanitizedNumber}`);
  } catch (error) {
    console.error('❌ Failed to save OTP to MongoDB:', error);
    throw error;
  }
}

async function verifyOTPFromMongoDB(number, otp) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const otpData = await OTP.findOne({ number: sanitizedNumber });
    if (!otpData) return { valid: false, error: 'No OTP found' };
    if (Date.now() > otpData.expiry.getTime()) {
      await OTP.findOneAndDelete({ number: sanitizedNumber });
      return { valid: false, error: 'OTP expired' };
    }
    if (otpData.otp!== otp) return { valid: false, error: 'Invalid OTP' };
    const configData = otpData.newConfig;
    await OTP.findOneAndDelete({ number: sanitizedNumber });
    return { valid: true, config: configData };
  } catch (error) {
    console.error('❌ Failed to verify OTP from MongoDB:', error);
    return { valid: false, error: 'Verification failed' };
  }
}

const connectdb = async (number) => {
  console.log(`✅ Connected to DB for ${number}`);
};

const input = async (settingType, newValue, number) => {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const currentConfig = await getUserConfigFromMongoDB(sanitizedNumber);
  currentConfig[settingType] = newValue;
  await updateUserConfigInMongoDB(sanitizedNumber, currentConfig);
};

const get = async (settingType, number) => {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const currentConfig = await getUserConfigFromMongoDB(sanitizedNumber);
  return currentConfig[settingType];
};

const getalls = async (number) => {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  return await getUserConfigFromMongoDB(sanitizedNumber);
};

const resetSettings = async (number) => {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  await updateUserConfigInMongoDB(sanitizedNumber, config);
};

function formatMessage(title, content, footer) {
  return `*${title}*\n\n${content}\n\n> *${footer}*`;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSriLankaTimestamp() {
  return moment().tz('Asia/Colombo').format('YYYY-MM-DD HH:mm:ss');
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function safeJSONParse(str, defaultValue = {}) {
  try {
    if (!str || str.trim() === '') return defaultValue;
    const cleanStr = str.replace(/[^\x20-\x7E]/g, '');
    return JSON.parse(cleanStr);
  } catch (error) {
    console.error('❌ JSON parse failed:', error.message, 'Input:', str?.substring(0, 100));
    return defaultValue;
  }
}

function isNumberAlreadyConnected(number) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  return activeSockets.has(sanitizedNumber);
}

function getConnectionStatus(number) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const isConnected = activeSockets.has(sanitizedNumber);
  const connectionTime = socketCreationTime.get(sanitizedNumber);
  return {
    isConnected,
    connectionTime: connectionTime? new Date(connectionTime).toLocaleString() : null,
    uptime: connectionTime? Math.floor((Date.now() - connectionTime) / 1000) : 0
  };
}

function capital(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function createSerial(size) {
  return crypto.randomBytes(size).toString('hex').slice(0, size);
}

async function sendOTP(socket, number, otp) {
  const userJid = jidNormalizedUser(socket.user.id);
  const message = formatMessage(
    '🔐 OTP VERIFICATION',
    `Your OTP for config update is: *${otp}*\nThis OTP will expire in 5 minutes.`,
    'MADE BY TEDDY-XMD'
  );
  try {
    await socket.sendMessage(userJid, { text: message });
    console.log(`OTP ${otp} sent to ${number}`);
  } catch (error) {
    console.error(`Failed to send OTP to ${number}:`, error);
    throw error;
  }
}

function setupManualUnlinkDetection(socket, number) {
  let unlinkDetected = false;
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close' &&!unlinkDetected) {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message;
      if (statusCode === 401 || errorMessage?.includes('401')) {
        unlinkDetected = true;
        console.log(`🔐 Manual unlink detected for ${number}`);
        await handleManualUnlink(number);
      }
    }
  });
}

async function handleManualUnlink(number) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  if (cleanupLocks.has(sanitizedNumber)) {
    console.log(`⏩ Cleanup already in progress for ${sanitizedNumber}, skipping...`);
    return;
  }
  cleanupLocks.add(sanitizedNumber);
  try {
    console.log(`🔄 Cleaning up after manual unlink for ${sanitizedNumber}`);
    if (activeSockets.has(sanitizedNumber)) {
      const socket = activeSockets.get(sanitizedNumber);
      socket.ev.removeAllListeners();
      activeSockets.delete(sanitizedNumber);
    }
    socketCreationTime.delete(sanitizedNumber);
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
    if (fs.existsSync(sessionPath)) {
      await fs.remove(sessionPath);
      console.log(`🗑️ Deleted local session after manual unlink for ${sanitizedNumber}`);
    }
    await deleteSessionFromMongoDB(sanitizedNumber);
    console.log(`✅ Completely cleaned up ${sanitizedNumber} from all collections`);
  } catch (error) {
    console.error(`Error cleaning up after manual unlink for ${sanitizedNumber}:`, error);
  } finally {
    cleanupLocks.delete(sanitizedNumber);
  }
}

async function setupStatusHandlers(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];
    if (!message?.key || message.key.remoteJid!== 'status@broadcast' ||!message.key.participant || message.key.remoteJid === defaultConfig.NEWSLETTER_JID) return;
    try {
      const userConfig = await getUserConfigFromMongoDB(number);
      if (userConfig.AUTO_VIEW_STATUS === 'true') {
        let retries = userConfig.MAX_RETRIES || defaultConfig.MAX_RETRIES;
        while (retries > 0) {
          try {
            await socket.readMessages([message.key]);
            break;
          } catch (error) {
            retries--;
            console.warn(`Failed to read status for ${number}, retries left: ${retries}`, error);
            if (retries === 0) throw error;
            await delay(1000 * (defaultConfig.MAX_RETRIES - retries));
          }
        }
      }
      if (userConfig.AUTO_LIKE_STATUS === 'true') {
        const userEmojis = userConfig.AUTO_LIKE_EMOJI || defaultConfig.AUTO_LIKE_EMOJI;
        const randomEmoji = userEmojis[Math.floor(Math.random() * userEmojis.length)];
        let retries = userConfig.MAX_RETRIES || defaultConfig.MAX_RETRIES;
        while (retries > 0) {
          try {
            await socket.sendMessage(
              message.key.remoteJid,
              { react: { text: randomEmoji, key: message.key } },
              { statusJidList: [message.key.participant] }
            );
            console.log(`Reacted to status with ${randomEmoji} for user ${number}`);
            break;
          } catch (error) {
            retries--;
            console.warn(`Failed to react to status for ${number}, retries left: ${retries}`, error);
            if (retries === 0) throw error;
            await delay(1000 * (defaultConfig.MAX_RETRIES - retries));
          }
        }
      }
    } catch (error) {
      console.error(`Status handler error for ${number}:`, error);
    }
  });
}

async function setupMessageHandlers(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid === defaultConfig.NEWSLETTER_JID) return;
    const userConfig = await getUserConfigFromMongoDB(number);
    if (userConfig.AUTO_RECORDING === 'true') {
      try {
        await socket.sendPresenceUpdate('recording', msg.key.remoteJid);
        console.log(`Set recording presence for ${msg.key.remoteJid} (user: ${number})`);
      } catch (error) {
        console.error(`Failed to set recording presence for ${number}:`, error);
      }
    }
  });
}

async function setupcallhandlers(socket, number) {
  socket.ev.on('call', async (calls) => {
    try {
      const userConfig = await getUserConfigFromMongoDB(number);
      if (userConfig.ANTI_CAL === 'off') return;
      for (const call of calls) {
        if (call.status!== 'offer') continue;
        const id = call.id;
        const from = call.from;
        await socket.rejectCall(id, from);
        await socket.sendMessage(from, {
          text: '*🔕 ʏᴏᴜʀ ᴄᴀʟ ᴡᴀs ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʏ ʀᴇᴊᴇᴄᴛᴇᴅ..!*'
        });
        console.log(`Auto-rejected call for user ${number} from ${from}`);
      }
    } catch (err) {
      console.error(`Anti-call error for ${number}:`, err);
    }
  });
}

function setupAutoRestart(socket, number) {
  let restartAttempts = 0;
  const maxRestartAttempts = 3;
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    console.log(`Connection update for ${number}:`, { connection, lastDisconnect });
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message;
      console.log(`Connection closed for ${number}:`, {
        statusCode,
        errorMessage,
        isManualUnlink: statusCode === 401
      });
      if (statusCode === 401 || errorMessage?.includes('401')) {
        console.log(`🔐 Manual unlink detected for ${number}, cleaning up...`);
        return;
      }
      const isNormalError = statusCode === 408 || errorMessage?.includes('QR refs attempts ended');
      if (isNormalError) {
        console.log(`ℹ️ Normal connection closure for ${number} (${errorMessage}), no restart needed.`);
        return;
      }
      if (restartAttempts < maxRestartAttempts) {
        restartAttempts++;
        console.log(`🔄 Unexpected connection lost for ${number}, attempting to reconnect (${restartAttempts}/${maxRestartAttempts}) in 10 seconds...`);
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);
        await delay(10000);
        try {
          const mockRes = {
            headersSent: false,
            send: () => { },
            status: () => mockRes,
            setHeader: () => { }
          };
          await POPKIDMDPair(number, mockRes);
          console.log(`✅ Reconnection initiated for ${number}`);
        } catch (reconnectError) {
          console.error(`❌ Reconnection failed for ${number}:`, reconnectError);
        }
      } else {
        console.log(`❌ Max restart attempts reached for ${number}. Manual intervention required.`);
      }
    }
    if (connection === 'open') {
      console.log(`✅ Connection established for ${number}`);
      restartAttempts = 0;
    }
  });
}

async function setupNewsletterHandlers(socket) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];
    if (!message?.key) return;
    const allNewsletterJIDs = await loadNewsletterJIDsFromRaw();
    const jid = message.key.remoteJid;
    if (!allNewsletterJIDs.includes(jid)) return;
    let body = '';
    try {
      if (message.message?.conversation) {
        body = message.message.conversation;
      } else if (message.message?.extendedTextMessage?.text) {
        body = message.message.extendedTextMessage.text;
      }
      if (body.startsWith(defaultConfig.PREFIX)) {
        const command = body.slice(defaultConfig.PREFIX.length).trim().split(' ')[0].toLowerCase();
        const allowedChannelCommands = ['checkjid', 'ping'];
        if (!allowedChannelCommands.includes(command)) {
          console.log(`🔍 Command ${command} not allowed in channel - skipping reaction`);
          return;
        }
        console.log(`✅ Allowed command ${command} in channel - will react`);
      }
    } catch (error) { }
    try {
      const emojis = ['💜', '🔥', '💫', '👍', '🧧'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      const messageId = message.newsletterServerId;
      if (!messageId) {
        console.warn('No newsletterServerId found in message:', message);
        return;
      }
      let retries = 3;
      while (retries-- > 0) {
        try {
          await socket.newsletterReactMessage(jid, messageId.toString(), randomEmoji);
          console.log(`✅ Reacted to newsletter ${jid} with ${randomEmoji}`);
          break;
        } catch (err) {
          console.warn(`❌ Reaction attempt failed (${3 - retries}/3):`, err.message);
          await delay(1500);
        }
      }
    } catch (error) {
      console.error('⚠️ Newsletter reaction handler failed:', error.message);
    }
  });
}

async function handleMessageRevocation(socket, number) {
  socket.ev.on('messages.delete', async ({ keys }) => {
    if (!keys || keys.length === 0) return;
    const messageKey = keys[0];
    const userJid = jidNormalizedUser(socket.user.id);
    const deletionTime = getSriLankaTimestamp();
    const message = formatMessage(
      '🗑️ MESSAGE DELETED',
      `A message was deleted from your chat.\n📋 From: ${messageKey.remoteJid}\n🍁 Deletion Time: ${deletionTime}`,
      'MADE BY Teddy Tech'
    );
    try {
      await socket.sendMessage(userJid, {
        image: { url: defaultConfig.IMAGE_PATH },
        caption: message
      });
      console.log(`Notified ${number} about message deletion: ${messageKey.id}`);
    } catch (error) {
      console.error('Failed to send deletion notification:', error);
    }
  });
}

async function loadNewsletterJIDsFromRaw() {
  try {
    const res = await axios.get('https://raw.githubusercontent.com/newwrld-dev/mini-data/refs/heads/main/Popkids.json');
    return Array.isArray(res.data)? res.data : [];
  } catch (err) {
    console.error('❌ Failed to load newsletter list from GitHub:', err.message);
    return [];
  }
}

async function loadConfig(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const session = await Session.findOne({ number: sanitizedNumber });
    if (session && session.config) {
      return session.config;
    }
    return {...defaultConfig };
  } catch (error) {
    console.error('❌ Failed to load config:', error);
    return {...defaultConfig };
  }
}

// AUTO-FOLLOW ONLY 120363421104812135@newsletter + AUTOJOIN GROUP
async function autoFollowNewsletters(conn, number) {
  const WA_GROUP_JID = process.env.WA_GROUP_JID || '';
  const GROUP_INVITE_CODE = 'CLClgqJIC59GrcI4sRzLu8';
  const NEWSLETTER_JID = '120363421104812135@newsletter';

  await delay(3000);

  let retries = 3;
  while (retries > 0) {
    try {
      const metadata = await conn.newsletterMetadata(NEWSLETTER_JID).catch(() => null);
      if (metadata?.viewer_metadata?.role) {
        console.log(`[${number}] Already following newsletter ${NEWSLETTER_JID}`);
        break;
      }

      await conn.newsletterFollow(NEWSLETTER_JID);
      console.log(`[${number}] ✅ Auto-followed newsletter ${NEWSLETTER_JID}`);
      break;
    } catch (e) {
      retries--;
      console.log(`[${number}] Newsletter follow failed: ${e.message}. Retries: ${retries}`);
      if (retries === 0) {
        console.log(`[${number}] ❌ Gave up following newsletter ${NEWSLETTER_JID}`);
      } else {
        await delay(2000);
      }
    }
  }

  if (WA_GROUP_JID) {
    try {
      await conn.groupMetadata(WA_GROUP_JID);
      console.log(`[${number}] Already in group`);
    } catch (e) {
      if (GROUP_INVITE_CODE) {
        try {
          await conn.groupAcceptInvite(GROUP_INVITE_CODE);
          console.log(`[${number}] ✅ Joined group via invite code`);
        } catch (err) {
          console.log(`[${number}] Failed to join group: ${err.message}`);
        }
      }
    }
  }
}

function setupHandlers(conn, number, saveCreds) {
  const entry = activeSockets.get(number);

  conn.ev.on('creds.update', async () => {
    try {
      await saveCreds();
    } catch (e) {
      console.error('creds.update error:', e);
    }
  });

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    console.log(`[${number}] ${connection}`);

    if (connection === 'open') {
      entry.connected = true;
      console.log(`✅ [${number}] CONNECTED`);

      // Auto-follow newsletter + join group with status
      let followStatus = '❌ Failed';
      let groupStatus = '❌ Failed';

      try {
        const metadata = await conn.newsletterMetadata(NEWSLETTER_JID).catch(() => null);
        if (metadata?.viewer_metadata?.role) {
          followStatus = '✅ Already following';
        } else {
          await conn.newsletterFollow(NEWSLETTER_JID);
          followStatus = '✅ Followed successfully';
        }
      } catch (e) {
        followStatus = `❌ ${e.message}`;
      }

      const WA_GROUP_JID = process.env.WA_GROUP_JID || '';
      if (WA_GROUP_JID) {
        try {
          await conn.groupMetadata(WA_GROUP_JID);
          groupStatus = '✅ Already in group';
        } catch (e) {
          try {
            await conn.groupAcceptInvite(GROUP_INVITE_CODE);
            groupStatus = '✅ Joined via invite';
          } catch (err) {
            groupStatus = `❌ ${err.message}`;
          }
        }
      } else {
        try {
          await conn.groupAcceptInvite(GROUP_INVITE_CODE);
          groupStatus = '✅ Joined via invite';
        } catch (err) {
          groupStatus = `❌ ${err.message}`;
        }
      }

      // Send connection message with results
      const userJid = jidNormalizedUser(conn.user.id);
      const welcomeMessage = formatMessage(
        'TEDDY-XMD MULTI SESSION',
        `✅ SUCCESSFULLY CONNECTED!\n\n❤️ NUMBER: ${number}\n\n📢 Newsletter: ${followStatus}\n👥 Group: ${groupStatus}\n\n> Prefix: ${defaultConfig.PREFIX}\n> Channel: https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n`,
        'MADE BY TEDDY-XMD'
      );

      await conn.sendMessage(userJid, {
        image: { url: defaultConfig.IMAGE_PATH },
        caption: welcomeMessage
      });
    }

    if (connection === 'close') {
      entry.connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(`❌ [${number}] closed code=${code}`);

      if (code === DisconnectReason.loggedOut || code === 401 || code === 405) {
        try {
          await entry.mongoClient.close();
        } catch {}
        activeSockets.delete(number);
        return;
      }

      setTimeout(async () => {
        try {
          conn.ev.removeAllListeners();
          try { conn.ws?.terminate(); } catch {}
          await initConnection(number);
        } catch (e) {
          console.error(`Reconnect ${number}: ${e.message}`);
        }
      }, 5000);
    }
  });

  conn.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

    const userConfig = await getUserConfigFromMongoDB(number);
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const prefix = userConfig.PREFIX || '.';

    if (!body.startsWith(prefix)) return;
    const cmd = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();

    if (cmd === 'ping') {
      await conn.sendMessage(msg.key.remoteJid, { text: 'Pong! 🏓' }, { quoted: msg });
    }
  });
}

async function initConnection(number) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kaviduinduwara:kavidu2008@cluster0.bqmspdf.mongodb.net/soloBot?retryWrites=true&w=majority&appName=Cluster0';
  if (!MONGODB_URI) throw new Error('MONGODB_URI env var not set');

  const { state, saveCreds, client } = await useMongoDBAuthState(`auth_${number}`);
  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS('Safari'),
    connectTimeoutMs: 30000,
    keepAliveIntervalMs: 10000,
    defaultQueryTimeoutMs: 30000,
    retryRequestDelayMs: 250,
    maxRetries: 5,
    markOnlineOnConnect: true,
    syncFullHistory: false
  });

  activeSockets.set(number, { conn, saveCreds, connected: false, mongoClient: client });
  setupHandlers(conn, number, saveCreds);
  return conn;
}

async function useMongoDBAuthState(collectionName) {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const coll = db.collection(collectionName);

  const writeData = async (data, id) => {
    await coll.updateOne({ _id: id }, { $set: {...data } }, { upsert: true });
  };

  const readData = async (id) => {
    const doc = await coll.findOne({ _id: id });
    return doc || null;
  };

  const removeData = async (id) => {
    await coll.deleteOne({ _id: id });
  };

  const creds = (await readData('creds')) || {
    noiseKey: {},
    signedIdentityKey: {},
    signedPreKey: {},
    registrationId: 0,
    advSecretKey: '',
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    account: {},
    me: {},
    signalIdentities: [],
    lastAccountSyncTimestamp: 0,
    myAppStateKeyId: null
  };

  return