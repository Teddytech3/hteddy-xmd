const axios = require('axios');
const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "repo",
    alias: ["git", "sc", "script"],
    desc: "Fetch the bot repository details",
    category: "main",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply, sender }) => {
    try {
        const repoUrl = "https://github.com/Teddytech1/TEDDY-XMD";
        const apiUrl = "https://api.github.com/repos/Teddytech1/TEDDY-XMD";
        
        // Fetching real-time data from GitHub
        const response = await axios.get(apiUrl);
        const data = response.data;

        let repoMsg = `👑 *TEDDY-XMD REPO DETAILS* 👑

✨ *Repository Name:* ${data.name}
👤 *Owner:* ${data.owner.login}
⭐ *Stars:* ${data.stargazers_count}
🍴 *Forks:* ${data.forks_count}
📅 *Last Updated:* ${new Date(data.updated_at).toLocaleDateString()}

🔗 *Repo Link:* ${repoUrl}

> *Created by 𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃* 👨‍💻`;

        // Define the fakevCard (Popkid Ke)
        const fakevCard = {
            key: {
                fromMe: false,
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: "𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃\nORG:𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃;\nTEL;type=CELL;type=VOICE;waid=254799963583:+254799963583\nEND:VCARD`
                }
            }
        };

        // Clean context info (Removed externalAdReply)
        const newsletterContextInfo = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363421104812135@newsletter',
                newsletterName: config.OWNER_NAME || '𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃',
                serverMessageId: 1
            }
        };

        // Sending image with caption and context, but no ad reply
        await conn.sendMessage(from, {
            image: { url: `https://files.catbox.moe/13nyhx.jpg` },
            caption: repoMsg,
            contextInfo: newsletterContextInfo
        }, { quoted: fakevCard });

    } catch (e) {
        console.log(e);
        reply("❌ Error fetching repository details. Please try again later.");
    }
});
