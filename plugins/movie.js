const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

// Session දත්ත තබා ගැනීමට
global.movie_sessions = global.movie_sessions || {};

// 1. සෙවුම් විධානය
cmd({
    pattern: "movie",
    alias: ["films", "cinema"],
    react: "🎬",
    desc: "Search movies from Sinhalasub.lk (Updated 2026)",
    category: "movie",
    filename: __filename
}, async (conn, mek, m, { from, q, sender, reply }) => {
    try {
        if (!q) return reply("*🎬 Please provide a movie name!* (e.g., .movie Avatar)");

        reply("*🔍 Searching Sinhalasub... Please wait.*");
        
        // සයිට් එකට Request එකක් යැවීම
        const res = await axios.get(`https://sinhalasub.lk/?s=${encodeURIComponent(q)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // සයිට් එකෙන් Block නොකිරීමට
        });
        
        const $ = cheerio.load(res.data);
        const results = [];

        // සයිට් එකේ අලුත්ම HTML Structure එකට අනුව (මෙතනයි වෙනස තියෙන්නේ)
        $('article.result-item').each((i, el) => {
            if (i < 10) {
                const title = $(el).find('.details .title a').text().trim();
                const url = $(el).find('.details .title a').attr('href');
                const image = $(el).find('.image img').attr('src');
                const year = $(el).find('.details .meta span.year').text().trim();

                if (url) {
                    results.push({ title: `${title} (${year})`, url, image });
                }
            }
        });

        if (results.length === 0) return reply("❌ No movies found for your search.");

        // Session එක Save කරගැනීම
        global.movie_sessions[sender] = { results, step: "selection" };

        let msg = "🎬 *VEXTER-MD MOVIE SEARCH*\n\n";
        results.forEach((m, i) => {
            msg += `*${i + 1}.* ${m.title}\n`;
        });
        msg += "\n*Reply with the number to select the movie.*";
        
        reply(msg);
    } catch (e) {
        console.error(e);
        reply("❌ Error: Site might be down or structure changed.");
    }
});

// 2. Reply Handler (අංකයට අනුව වැඩ කරන කොටස)
const movieReplyHandler = {
    filter: (text, { sender }) => global.movie_sessions[sender] && !isNaN(text),
    function: async (conn, mek, m, { body, sender, reply, from }) => {
        const session = global.movie_sessions[sender];
        const index = parseInt(body.trim()) - 1;
        const selected = session.results[index];

        if (!selected) return;

        try {
            if (session.step === "selection") {
                reply(`*⏳ Loading details for ${selected.title}...*`);
                
                const res = await axios.get(selected.url);
                const $ = cheerio.load(res.data);
                
                const pixeldrainLinks = [];
                // Pixeldrain Download Table එක Scrape කිරීම
                $('.download-links-container table tbody tr').each((i, el) => {
                    const link = $(el).find('a[href*="pixeldrain.com"]').attr('href');
                    const quality = $(el).find('td').eq(0).text().trim(); // පළමු Column එක (Quality)
                    const size = $(el).find('td').eq(2).text().trim();    // තුන්වන Column එක (Size)
                    
                    if (link) pixeldrainLinks.push({ link, quality, size });
                });

                if (pixeldrainLinks.length === 0) return reply("❌ Sorry, no Pixeldrain links found for this movie.");

                session.links = pixeldrainLinks;
                session.step = "quality";
                session.movieTitle = selected.title;

                let qMsg = `🎬 *${selected.title}*\n\n*Select Quality to Download:*\n`;
                pixeldrainLinks.forEach((l, i) => {
                    qMsg += `*${i + 1}.* ${l.quality} - ${l.size}\n`;
                });
                qMsg += "\n*Reply with the number to get the file.*";
                
                reply(qMsg);

            } else if (session.step === "quality") {
                const linkObj = session.links[index];
                if (!linkObj) return;

                // Pixeldrain Direct Link එක හදාගැනීම
                const fileId = linkObj.link.split('/').pop();
                const directUrl = `https://pixeldrain.com/api/file/${fileId}?download`;

                reply(`*⬇️ Sending Movie: ${session.movieTitle}*\n*Quality:* ${linkObj.quality}\n\n*Please wait, this may take a few minutes...*`);

                await conn.sendMessage(from, {
                    document: { url: directUrl },
                    mimetype: "video/mp4",
                    fileName: `${session.movieTitle}.mp4`,
                    caption: `🎬 *${session.movieTitle}*\n📊 Quality: ${linkObj.quality}\n💾 Size: ${linkObj.size}\n\n*POWERED BY VEXTER-MD*`
                }, { quoted: mek });

                delete global.movie_sessions[sender]; // වැඩේ ඉවර නිසා මැකීම
            }
        } catch (e) {
            console.error(e);
            reply("❌ Error while fetching download links.");
        }
    }
};

// Reply handler එක Register කිරීම
if (global.replyHandlers) global.replyHandlers.push(movieReplyHandler);
