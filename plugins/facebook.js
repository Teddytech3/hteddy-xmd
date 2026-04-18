const { cmd } = require("../command");
const getFBInfo = require("@xaviabot/fb-downloader");
const config = require("../config");
const { sendButtons } = require('gifted-btns');

cmd({
    pattern: "fb",
    alias: ["facebook", "facebook1", "fb1"],
    desc: "Download FB videos (Multi-button support)",
    category: "download",
    react: "📽️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, botFooter, botPic }) => {
    try {
        const fbUrl = q && q.trim();
        if (!fbUrl) return reply("Please provide a Facebook link!");
        
        const videoData = await getFBInfo(fbUrl);
        if (!videoData || !videoData.sd) return reply("❌ Link invalid or private.");

        const uniqueId = Math.random().toString(36).substring(7);

        const fancyCaption = `
✨ *𝐓𝐄𝐃𝐃𝐘-𝐗𝐌𝐃 𝐅𝐁 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* ✨

📝 *𝐓𝐢𝐭𝐥𝐞:* ${videoData.title || 'Facebook Video'}
🚀 *𝐒𝐞𝐥𝐞𝐜𝐭 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐅𝐨𝐫𝐦𝐚𝐭:*
_You can select multiple options!_
`.trim();

        await sendButtons(conn, from, {
            title: `ꜰᴀᴄᴇʙᴏᴏᴋ ᴠɪᴅᴇᴏ ᴇɴɢɪɴᴇ`,
            text: fancyCaption,
            footer: botFooter || '𝚃𝙴𝙳𝙳𝚈-𝚇𝙼𝙳 ᴋᴇɴʏᴀ 🇰🇪',
            image: videoData.thumbnail || botPic,
            buttons: [
                { id: `fbsd_${uniqueId}`, text: "📽️ 𝐒𝐃 𝐕𝐢𝐝𝐞𝐨" },
                { id: `fbhd_${uniqueId}`, text: "🎥 𝐇𝐃 𝐕𝐢𝐝𝐞𝐨" },
                { id: `fbaud_${uniqueId}`, text: "🎵 𝐀𝐮𝐝𝐢𝐨 (𝐌𝐏𝟑)" }
            ],
        });

        // ==================== MULTI-CLICK HANDLER ====================
        const handleFbResponse = async (update) => {
            const messageData = update.messages[0];
            if (!messageData.message) return;

            const selectedButtonId = messageData.message?.templateButtonReplyMessage?.selectedId || 
                                     messageData.message?.buttonsResponseMessage?.selectedButtonId;
            
            // Validate the click belongs to THIS specific menu
            if (!selectedButtonId || !selectedButtonId.endsWith(uniqueId)) return;

            // REMOVED conn.ev.off here to allow multiple clicks!
            await conn.sendMessage(from, { react: { text: "📥", key: messageData.key } });

            try {
                const type = selectedButtonId.split("_")[0];
                const downloadUrl = type === "fbhd" ? (videoData.hd || videoData.sd) : videoData.sd;

                if (type === "fbaud") {
                    await conn.sendMessage(from, { 
                        audio: { url: downloadUrl }, 
                        mimetype: "audio/mpeg" 
                    }, { quoted: messageData });
                } else {
                    await conn.sendMessage(from, { 
                        video: { url: downloadUrl }, 
                        caption: `*${videoData.title || 'FB Video'}*\nQuality: ${type === "fbhd" ? "HD" : "SD"}` 
                    }, { quoted: messageData });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: messageData.key } });
            } catch (err) {
                console.error("Button Error:", err);
            }
        };

        conn.ev.on("messages.upsert", handleFbResponse);

        // This is the ONLY place the listener dies, after 5 minutes of inactivity
        setTimeout(() => {
            conn.ev.off("messages.upsert", handleFbResponse);
        }, 300000);

    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});
