/**
 * yt-play-video.js
 * Optimized styling for Popkid-MD
 * Requires: axios, yt-search
 */

const axios = require("axios");
const yts = require("yt-search");
const { cmd } = require("../command");
const config = require("../config");

// Exact Newsletter and Bot Info for Popkid-MD
const NEWSLETTER_JID = "120363421104812135@newsletter";
const NEWSLETTER_NAME = "TEDDY-XMD";
const BOT = "TEDDY-XMD";

const buildCaption = (video) => {
  const duration = video.timestamp || video.duration || "N/A";

  return (
    `*🎬 TEDDY-XMD VIDEO PLAYER*\n\n` +
    `╭───────────────◆\n` +
    `│ 📑 Title: ${video.title}\n` +
    `│ ⏳ Duration: ${duration}\n` +
    `╰────────────────◆\n\n` +
    `⏳ *Sending video...*`
  );
};

// Fixed to render smaller/legit thumbnails
const getContextInfo = (query = "", video = {}) => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: NEWSLETTER_NAME,
    serverMessageId: -1
  },
  externalAdReply: {
    title: video.title || BOT,
    body: "TEDDY-XMD Video Downloader",
    mediaType: 1,
    renderLargerThumbnail: false, // Set to false for standard small size
    thumbnailUrl: video.thumbnail,
    sourceUrl: video.url || "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n"
  },
  body: query ? `Requested: ${query}` : undefined,
  title: BOT
});

const BASE_URL = process.env.BASE_URL || "https://noobs-api.top";

/* ========== PLAY VIDEO ========== */
cmd({
  pattern: "video",
  alias: ["pv", "vx"],
  use: ".video <video name>",
  react: "🎬",
  desc: "Play video from YouTube",
  category: "download",
  filename: __filename
},
async (conn, mek, m, { from, args, q, quoted, isCmd, reply }) => {

  const query = q || args.join(" ");
  if (!query) return conn.sendMessage(from, { text: "Please provide a video name." }, { quoted: mek });

  try {
    const search = await yts(query);
    const video = (search && (search.videos && search.videos[0])) || (search.all && search.all[0]);
    if (!video) return conn.sendMessage(from, { text: "No results found." }, { quoted: mek });

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
    const fileName = `${safeTitle}.mp4`;
    const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId || video.url)}&format=mp4`;

    const { data } = await axios.get(apiURL);
    if (!data || !data.downloadLink) return conn.sendMessage(from, { text: "Failed to get download link." }, { quoted: mek });

    // 1. Send thumbnail + caption with renderSmallThumbnail: true
    await conn.sendMessage(from, {
      image: { url: video.thumbnail, renderSmallThumbnail: true }, //
      caption: buildCaption(video),
      contextInfo: getContextInfo(query, video)
    }, { quoted: mek });

    // 2. Send video file with matching context
    await conn.sendMessage(from, {
      video: { url: data.downloadLink },
      caption: `✅ *${video.title}* downloaded successfully!`,
      mimetype: "video/mp4",
      fileName,
      contextInfo: getContextInfo(query, video)
    }, { quoted: mek });

    // Success Reaction
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error("[PLAY VIDEO ERROR]", e);
    await conn.sendMessage(from, { text: "An error occurred while processing your request." }, { quoted: mek });
  }

});
