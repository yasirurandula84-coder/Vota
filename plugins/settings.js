const { cmd } = require("../command");
const Settings = require("../lib/settings"); // Schema path eka check karන්න

cmd(
  {
    pattern: "settings",
    desc: "Change bot working mode and save to DB",
    category: "owner",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, isOwner, q, reply }) => {
    if (!isOwner) return reply("❌ *Access Denied:* Owner only.");

    if (!q) {
        // Database eken ganna puluwan current status eka
        const data = await Settings.findOne({ id: "bot_settings" }) || { workMode: "public" };
        const statusMsg = `⚙️ *VEXTER-MD SYSTEM SETTINGS* ⚙️\n\n` +
                          `*Current Mode:* ${data.workMode.toUpperCase()}\n\n` +
                          `Select a mode:\n` +
                          `1️⃣ *Public Mode*\n` +
                          `2️⃣ *Private Mode*\n` +
                          `3️⃣ *Groups Only*\n` +
                          `4️⃣ *Inbox Only*\n\n` +
                          `*Example:* .settings 1`;
        return reply(statusMsg);
    }

    let choice = q.trim();
    let newMode = "";

    if (choice === "1") newMode = "public";
    else if (choice === "2") newMode = "private";
    else if (choice === "3") newMode = "groups";
    else if (choice === "4") newMode = "inbox";
    else return reply("❌ *Invalid Selection:* Choose 1-4.");

    // Database ekata update kireema
    await Settings.findOneAndUpdate(
        { id: "bot_settings" },
        { workMode: newMode },
        { upsert: true, new: true }
    );

    return reply(`✅ *Success:* Bot mode permanently updated to *${newMode.toUpperCase()}*.`);
  }
);
