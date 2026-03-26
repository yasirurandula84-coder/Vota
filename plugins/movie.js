const { cmd, commands, replyHandlers } = require("../command");
const axios = require("axios");

// තාවකාලිකව දත්ත ගබඩා කිරීමට (Sessions)
global.movie_api_sessions = global.movie_api_sessions || {};

cmd({
    pattern: "movie",
    alias: ["film", "cinema"],
    category: "movie",
    react: "🎬",
    desc: "Search movies using VEXTER-MD API"
}, async (conn, mek, m, { from, q, reply, sender }) => {
    if (!q) return reply("🎬 කරුණාකර චිත්‍රපටයේ නම ලබා දෙන්න. (උදා: .movie Avatar)");

    try {
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // ඔයා දැන් හදපු API එකට Call කරනවා (Render එකේදී localhost පාවිච්චි කළ හැක)
        // movie.js ඇතුළත apiUrl එක මෙසේ ලියන්න:
const apiUrl = `http://localhost:${process.env.PORT || 8000}/api/movie?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || data.results.length === 0) return reply("❌ කිසිදු ප්‍රතිඵලයක් හමු නොවීය.");

        // සෙවුම් ප්‍රතිඵල Session එකට දානවා
        global.movie_api_sessions[sender] = { results: data.results, step: "selection" };

        let menuMsg = `🎬 *VEXTER-MD MOVIE SEARCH*\n\n`;
        data.results.forEach((movie, i) => {
            menuMsg += `*${i + 1}.* ${movie.title} (${movie.year})\n`;
        });
        menuMsg += `\n*Reply with the number to see details.*`;

        await reply(menuMsg);

        // --- Reply Handler එක Register කිරීම ---
        replyHandlers.push({
            filter: (text, { sender: s }) => s === sender && global.movie_api_sessions[s] && !isNaN(text),
            function: async (conn, mek, m, { body }) => {
                const session = global.movie_api_sessions[sender];
                const index = parseInt(body.trim()) - 1;
                const movie = session.results[index];

                if (session.step === "selection" && movie) {
                    let details = `🎬 *${movie.title}*\n\n`;
                    details += `⭐ *IMDb:* ${movie.imdb}\n`;
                    details += `⏱️ *Runtime:* ${movie.runtime}\n`;
                    details += `📅 *Year:* ${movie.year}\n`;
                    details += `🎭 *Genres:* ${movie.genres.join(", ")}\n\n`;
                    details += `📝 *Story:* ${movie.description.substring(0, 250)}...\n\n`;
                    details += `📍 *Cast:* ${movie.cast.join(", ")}\n\n`;
                    details += `*Download Links:*\n`;
                    
                    movie.dl_links.forEach((link, i) => {
                        details += `*${i + 1}.* ${link.quality} (${link.size})\n`;
                    });
                    details += `\n*Reply with the number to get the document.*`;

                    session.step = "download";
                    session.selectedMovie = movie;

                    await conn.sendMessage(from, { image: { url: movie.thumbnail }, caption: details }, { quoted: mek });

                } else if (session.step === "download" && movie === undefined) {
                    // Download logic (අංකය අනුව ලින්ක් එක තෝරාගැනීම)
                    const selectedLink = session.selectedMovie.dl_links[parseInt(body.trim()) - 1];
                    if (!selectedLink) return;

                    reply(`*⬇️ Uploading ${session.selectedMovie.title}...*`);
                    
                    const fileId = selectedLink.url.split('/').pop();
                    const directUrl = `https://pixeldrain.com/api/file/${fileId}?download`;

                    await conn.sendMessage(from, {
                        document: { url: directUrl },
                        mimetype: "video/mp4",
                        fileName: `${session.selectedMovie.title}.mp4`,
                        caption: `🎬 *${session.selectedMovie.title}*\n📊 Quality: ${selectedLink.quality}\n\n*POWERED BY VEXTER-MD*`
                    }, { quoted: mek });

                    delete global.movie_api_sessions[sender];
                }
            }
        });

    } catch (e) {
        console.error(e);
        reply("❌ API සම්බන්ධතාවයේ දෝෂයකි.");
    }
});
