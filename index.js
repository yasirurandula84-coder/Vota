const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore, 
    jidDecode,
    proto
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const P = require("pino");
const fs = require('fs');
const path = require('path');
const FileType = require('file-type');
const { exec } = require("child_process");
const config = require("./config");

// Session ID eka folder ekakata convert kirima
if (config.session_id && !fs.existsSync('./session')) {
    console.log("Decoding Session ID...");
    const sessionData = Buffer.from(config.session_id, 'base64');
    fs.writeFileSync('./session.tar.gz', sessionData);
    exec('tar -xzf session.tar.gz', (err) => {
        if (err) console.log("Session Extract Error:", err);
        else console.log("Session Extracted Successfully!");
    });
}

const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

async function startVortex() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: [config.botName, "Chrome", "1.0.0"],
        syncFullHistory: false
    });

    store.bind(sock.ev);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log(`Device Logged Out, Please Scan Again.`);
                process.exit();
            } else {
                startVortex();
            }
        } else if (connection === 'open') {
            console.log('--- VORTEX-MD CONNECTED ---');
            console.log('Bot Name: ' + config.botName);
            console.log('Owner: ' + config.ownerName);
        }
    });

    sock.ev.on('messages.upsert', async m => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const type = Object.keys(msg.message)[0];
            const content = JSON.stringify(msg.message);
            const body = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : (type === 'imageMessage') ? msg.message.imageMessage.caption : (type === 'videoMessage') ? msg.message.videoMessage.caption : '';
            
            const isCmd = body.startsWith(config.prefix);
            const command = isCmd ? body.slice(config.prefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);

            // Commands Logic
            if (isCmd) {
                switch (command) {
                    case 'alive':
                        await sock.sendMessage(from, { 
                            text: `*VORTEX-MD IS ONLINE* 🚀\n\n_Everything is working perfectly._\n\n*Owner:* ${config.ownerName}`,
                            contextInfo: {
                                externalAdReply: {
                                    title: config.botName,
                                    body: "Created by " + config.ownerName,
                                    thumbnailUrl: "https://i.ibb.co/vYxXQ9L/vortex.jpg",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: msg });
                        break;

                    case 'ping':
                        const start = new Date().getTime();
                        await sock.sendMessage(from, { text: 'Testing Speed...' });
                        const end = new Date().getTime();
                        await sock.sendMessage(from, { text: `*Pong!* 🏓\nSpeed: ${end - start}ms` });
                        break;

                    case 'menu':
                        let menuText = `*--- ${config.botName} MENU ---*\n\n`;
                        menuText += `> .alive - Check status\n`;
                        menuText += `> .ping - Check speed\n`;
                        menuText += `> .owner - Owner info\n\n`;
                        menuText += `_VORTEX-MD: More commands coming soon!_`;
                        await sock.sendMessage(from, { text: menuText }, { quoted: msg });
                        break;

                    default:
                        // Command eka nathi unoth karanna deyak danna puluwan
                        break;
                }
            }
        } catch (e) {
            console.log("Error in Messages.upsert:", e);
        }
    });
}

startVortex();