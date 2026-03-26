const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "X4IRADxA#c9Ha6aQk6g5IhofeAUIq6XVZ45LeTtWkJPFjka2K8YA",
ALIVE_IMG: process.env.ALIVE_IMG || "https://i.ibb.co/ZRXhhYxH/db1c9ed7-6513-49da-8105-f21c73583135.png",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 VEXTER-MD Is Alive Now😍*",
BOT_OWNER: '94704421963',  // Replace with the owner's phone number



};
