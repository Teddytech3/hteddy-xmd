const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "uptime",
    alias: ["runtime", "status"],
    desc: "Check how long the bot has been running.",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, sender, reply }) => {
    try {
        // Calculate uptime
        const uptimeSeconds = process.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        // iOS Style Text Formatting
        const uptimeString = `*ꜱʏꜱᴛᴇᴍ ʀᴜɴᴛɪᴍᴇ* ⏳\n\n*ᴜᴘᴛɪᴍᴇ:* ${hours}ʜ ${minutes}ᴍ ${seconds}ꜱ\n*ꜱᴛᴀᴛᴜꜱ:* Active 🟢`;

        // iOS-style vCard (Sleek & Professional)
        const iosvCard = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: " TEDDY-XMD",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:TEDDY-XMD\nTEL;type=CELL;type=VOICE;waid=254799963583:+254799963583\nEND:VCARD`
                }
            }
        };

        // iOS Newsletter Context (Clean, No Large Image)
        const iosContext = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363421104812135@newsletter',
                newsletterName: "TEDDY-XMD",
                serverMessageId: 1
            },
            externalAdReply: {
                title: " ᴘᴏᴘᴋɪᴅ ꜱʏꜱᴛᴇᴍꜱ",
                body: "ᴍᴏɴɪᴛᴏʀɪɴɢ ʟɪᴠᴇ ꜱᴇꜱꜱɪᴏɴ...",
                mediaType: 1,
                renderLargerThumbnail: false, // Removes the big black image
                thumbnailUrl: "https://files.catbox.moe/13nyhx.jpg", // Small icon style
                sourceUrl: "https://whatsapp.com/channel/0029Vb6NveDBPzjPa4vIRt3n"
            }
        };

        // Send reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Send uptime with the minimalist context and quoted vCard
        await conn.sendMessage(from, { 
            text: uptimeString, 
            contextInfo: iosContext 
        }, { quoted: iosvCard });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
