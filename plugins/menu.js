const { cmd, commands, replyHandlers } = require("../command");

cmd(
  {
    pattern: "menu",
    alias: ["panel", "help"],
    desc: "Displays the main menu categories",
    category: "main",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, reply }) => {
    try {
      let menuMsg = `👋 *HELLO, WELCOME TO VEXTER-MD*\n\n`;
      menuMsg += `Please reply with the *Number* to see commands:\n\n`;
      menuMsg += `*1* | Owner Menu\n`;
      menuMsg += `*2* | Logo Menu\n`;
      menuMsg += `*3* | Group Menu\n`;
      menuMsg += `*4* | Movie Menu\n`;
      menuMsg += `*5* | Download Menu\n\n`;
      menuMsg += `*POWERED BY VEXTER-MD*`;

      const sentMsg = await danuwa.sendMessage(from, {
        image: { url: "https://i.ibb.co/ZRXhhYxH/db1c9ed7-6513-49da-8105-f21c73583135.png" },
        caption: menuMsg
      }, { quoted: mek });

      // --- Reply Handler එක Register කිරීම ---
      replyHandlers.push({
        filter: (text, { message }) => {
          // මෙනු පණිවිඩයටම කරන ලද අංක සහිත reply එකක්දැයි පරීක්ෂා කරයි
          const isReplyToMenu = message.message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
          return isReplyToMenu && !isNaN(text.trim());
        },
        function: async (danuwa, mek, m, { body }) => {
          const num = body.trim();
          const categories = {
            "1": "owner",
            "2": "logo",
            "3": "group",
            "4": "movie",
            "5": "download"
          };

          const catName = categories[num];
          if (!catName) return;

          let subMenu = `📋 *${catName.toUpperCase()} COMMANDS*\n\n`;
          let found = false;

          for (let cmdName in commands) {
            const cmdData = commands[cmdName];
            // Category එක සමානදැයි බලයි
            if (cmdData.category?.toLowerCase() === catName) {
              subMenu += `📍 *.${cmdData.pattern}* : ${cmdData.desc || "No description"}\n`;
              found = true;
            }
          }

          if (found) {
            await reply(subMenu.trim());
          } else {
            await reply(`❌ No commands found in *${catName}* category.`);
          }
        }
      });

    } catch (err) {
      console.error(err);
      reply("❌ Error generating menu.");
    }
  }
);
