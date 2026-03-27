const { cmd } = require("../command");
const config = require("../config"); // Make sure this path is correct for your config file

cmd(
  {
    pattern: "settings",
    desc: "Change bot working mode (Owner only)",
    category: "owner",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, isOwner, q, reply }) => {
    // Security check: Only the owner can change settings
    if (!isOwner) return reply("❌ *Access Denied:* This command is restricted to the Bot Owner.");

    if (!q) {
      const statusMsg = `⚙️ *VEXTER-MD SYSTEM SETTINGS* ⚙️\n\n` +
                        `*Current Mode:* ${config.WORK_MODE.toUpperCase()}\n\n` +
                        `Select a mode by typing the number:\n` +
                        `1️⃣ *Public Mode* (Everyone can use)\n` +
                        `2️⃣ *Private Mode* (Only Owner can use)\n` +
                        `3️⃣ *Groups Only* (Works only in groups)\n` +
                        `4️⃣ *Inbox Only* (Works only in private DM)\n\n` +
                        `*Example:* .settings 1`;
      return reply(statusMsg);
    }

    let selectedMode = q.trim();
    let newMode = "";

    switch (selectedMode) {
      case "1":
        newMode = "public";
        break;
      case "2":
        newMode = "private";
        break;
      case "3":
        newMode = "groups";
        break;
      case "4":
        newMode = "inbox";
        break;
      default:
        return reply("❌ *Invalid Selection:* Please choose a number between 1 and 4.");
    }

    // Update the config variable in memory
    config.WORK_MODE = newMode;

    return reply(`✅ *Success:* Bot mode has been updated to *${newMode.toUpperCase()}*.`);
  }
);
