const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

const TOKEN_FILE = 'tokens.txt';
const VOICE_CHANNEL_ID = "1562748334119325726"; // ID phòng voice duy nhất theo yêu cầu

async function getTokens() {
    let tokens = [];
    if (process.env.DISCORD_TOKEN) {
        tokens = process.env.DISCORD_TOKEN.split(',').map(t => t.trim()).filter(t => t.length > 0);
    } else if (fs.existsSync(TOKEN_FILE)) {
        tokens = fs.readFileSync(TOKEN_FILE, 'utf-8').split('\n').map(t => t.trim()).filter(t => t.length > 0 && !t.startsWith('#'));
    }
    return tokens;
}

async function connectVoice(token, index, channelId) {
    const client = new Client({ checkUpdate: false });

    async function joinVoice() {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) return;

            client.ws.broadcast({
                op: 4,
                d: {
                    guild_id: channel.guild.id,
                    channel_id: channelId,
                    self_mute: true,
                    self_deaf: true,
                }
            });
            console.log(`[Voice Acc ${index + 1}] -> Treo thành công vào phòng: ${channel.name}`);
        } catch (err) {
            console.error(`[Voice Acc ${index + 1}] Lỗi kết nối voice:`, err.message);
        }
    }

    client.on('ready', () => {
        console.log(`[Voice Acc ${index + 1}] Đã đăng nhập: ${client.user.tag}`);
        joinVoice();
    });

    // Tự động kết nối lại khi mất mạng / nghẽn mạng
    client.on('shardDisconnect', () => {
        console.warn(`[Voice Acc ${index + 1}] Mất kết nối! Đang thử vào lại sau 5s...`);
        setTimeout(joinVoice, 5000);
    });

    client.on('shardReconnecting', () => {
        console.log(`[Voice Acc ${index + 1}] Đang kết nối lại Websocket...`);
    });

    client.login(token).catch(() => {
        console.error(`[Voice Acc ${index + 1}] Lỗi token hoặc kết nối.`);
    });
}

const delayTime = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const tokens = await getTokens();
    if (tokens.length === 0) {
        console.error("[Voice Manager] Không tìm thấy token nào!");
        process.exit(1);
    }

    console.log(`\n>>> Đang kết nối an toàn ${tokens.length} tài khoản vào duy nhất phòng Voice ID: ${VOICE_CHANNEL_ID}...\n`);

    for (let index = 0; index < tokens.length; index++) {
        if (index > 0) await delayTime(5000); // Giãn cách 5 giây giữa các tài khoản
        connectVoice(tokens[index], index, VOICE_CHANNEL_ID);
    }
})();
