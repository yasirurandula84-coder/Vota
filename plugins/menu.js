const { cmd, commands } = require("../command");

// මේක උඩින්ම දාන්න (Reply Handler එක Register කරන්න ඕනේ නිසා)
const replyHandlers = []; 

cmd(
  {
    pattern: "menu",
    alias: ["panel", "help"],
    desc: "Displays the main menu",
    category: "main",
    filename: __filename,
  },
  async (conn, mek, m, { from, reply }) => {
    try {
      let menuMsg = `👋 *HELLO, WELCOME TO VERTEX-MD*\n\n`;
      menuMsg += `Please reply with the *Number* to see commands:\n\n`;
      menuMsg += `*1* | Owner Menu\n`;
      menuMsg += `*2* | Logo Menu\n`;
      menuMsg += `*3* | Group Menu\n`;
      menuMsg += `*4* | Movie Menu\n`;
      menuMsg += `*5* | Download Menu\n\n`;
      menuMsg += `*POWERED BY VERTEX-MD*`;

      const sentMsg = await conn.sendMessage(from, {
        image: { url: "https://i.ibb.co/ZRXhhYxH/db1c9ed7-6513-49da-8105-f21c73583135.png" },
        caption: menuMsg
      }, { quoted: mek });

      // --- Reply Handler එක මෙතනදී Register කරනවා ---
      const handler = {
        filter: (text, { message }) => {
          // මේක අංකයක්ද සහ Menu එකට කරපු reply එකක්ද කියලා බලනවා
          const isReplyToMenu = message.message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;
          return isReplyToMenu && !isNaN(text);
        },
        function: async (conn, mek, m, { body }) => {
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

          let subMenu = `📋 *${catName.toUpperCase()} MENU*\n\n`;
          let found = false;

          for (let cmdName in commands) {
            const cmdData = commands[cmdName];
            if (cmdData.category?.toLowerCase() === catName) {
              subMenu += `📍 *.${cmdData.pattern}* : ${cmdData.desc || "No description"}\n`;
              found = true;
            }
          }

          if (found) {
            await reply(subMenu.trim());
          }
        }
      };

      // ඔයාගේ index.js එකේ තියෙන replyHandlers array එකට මේක එකතු කරන්න
      // (සටහන: මෙය global array එකක් විය යුතුය)
      global.replyHandlers = global.replyHandlers || [];
      global.replyHandlers.push(handler);

    } catch (err) {
      console.error(err);
      reply("❌ Error generating menu.");
    }
  }
);
