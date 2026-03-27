const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "mgJnxb5B#dj3obc0WGIQClT9cNFNJ4XUsq7wfihYjZZgreFI0f8s",
ALIVE_IMG: process.env.ALIVE_IMG || "https://i.ibb.co/ZRXhhYxH/db1c9ed7-6513-49da-8105-f21c73583135.png",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 VERTEX-MD Is Alive Now😍*",
BOT_OWNER: '94704421963',  // Replace with the owner's phone number
AUTO_STATUS_SEEN: 'true',
AUTO_STATUS_REACT: 'true',



};
