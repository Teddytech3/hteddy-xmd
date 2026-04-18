const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "speed",
    alias: ["sp"],
    desc: "Check bot response speed (Compact Version)",
    category: "main",
    filename: __filename
}, async (conn, m, mek, { from, sender, reply }) => {
    try {
        const start = Date.now();
        
        // Quick reaction
        await conn.sendMessage(from, { react: { text: "⚡", key: mek.key } });
        
        const end = Date.now();
        const latency = end - start;

        // Compact vCard (Popkid Ke)
        const fakevCard = {
            key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
            message: {
                contactMessage: {
                    displayName: "𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃\nORG:𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃;\nTEL;type=CELL;type=VOICE;waid=254799963583:+254799963583\nEND:VCARD`
                }
            }
        };

        // Minimalist Newsletter Context (No image/preview)
        const minimalistContext = {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363421104812135@newsletter',
                newsletterName: config.OWNER_NAME || 'TEDDY-XMD',
                serverMessageId: 1
            }
        };

        // Clean Text output
        const speedMessage = `🚀 *Response:* ${latency}ms\n🛸 *Lag:* ${(latency / 12).toFixed(2)}ms\n\n> © 𝚃𝙴𝙳𝙳𝚈-𝚇𝙼𝙳`;

        // Send message without the large thumbnail
        await conn.sendMessage(from, { 
            text: speedMessage, 
            contextInfo: minimalistContext 
        }, { quoted: fakevCard });

    } catch (err) {
        console.error("SPEED ERROR:", err);
        reply("❌ *Error.*");
    }
});
