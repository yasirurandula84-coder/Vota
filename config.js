const fs = require('fs');

// config.js
const config = {
    // බෝට්ගේ නම
    botName: process.env.BOT_NAME || "VORTEX-MD",

    // අයිතිකරුගේ නම
    ownerName: process.env.OWNER_NAME || "Your Name",

    // අයිතිකරුගේ නම්බර් එක (Country code එකත් එක්ක - 94)
    ownerNumber: process.env.OWNER_NUMBER || "947xxxxxxxx",

    // Command පටන් ගන්න අකුර (උදා: . ! /)
    prefix: process.env.PREFIX || ".",

    // Session ID එක (අර Base64 string එක මෙතනට එන්න ඕනේ)
    session_id: process.env.SESSION_ID || "",

    // වැඩ කරන Mode එක (public හෝ private)
    mode: process.env.MODE || "public",

    // Auto Read Messages (true/false)
    autoRead: process.env.AUTO_READ || "false",

    // GitHub Repo Link (Famous වෙන්න නම් මේක දාන්න)
    repoUrl: "https://github.com/YourUsername/VORTEX-MD",

    // Stickers වලට වැටෙන නම
    packName: "VORTEX-MD Stickers",
    authorName: "VORTEX-TECH",

    // Images/Links (Alive message එකට වගේ ගන්න)
    logo: "https://i.ibb.co/vYxXQ9L/vortex.jpg", // මෙතනට ඔයාගේ logo එකේ link එකක් දාන්න
};

module.exports = config;