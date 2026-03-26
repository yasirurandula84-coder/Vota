const axios = require('axios');
const cheerio = require('cheerio');
const { cmd } = require('../command'); // ඔයාගේ බොට් එකේ Command Handler එක අනුව මෙය වෙනස් කරන්න

cmd({
    pattern: "movie",
    alias: ["film", "sinhalasub"],
    desc: "Search movies from Sinhalasub.lk",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("කරුණාකර සොයන චිත්‍රපටයේ නම ලබා දෙන්න. (උදා: .movie Avatar)");

        await reply("🔎 සෙවුම් කරමින් පවතී, කරුණාකර රැඳී සිටින්න...");

        // 1. Search Results ලබා ගැනීම
        const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(q)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);
        const results = [];

        // පළමු ප්‍රතිඵල 5 පමණක් ලබා ගැනීම
        $('article, .result-item').get().slice(0, 5).forEach((el) => {
            const title = $(el).find('h2 a, .title a').text().trim();
            const link = $(el).find('h2 a, .title a').attr('href');
            const thumb = $(el).find('img').attr('src');
            if (link) results.push({ title, link, thumb });
        });

        if (results.length === 0) return reply("❌ කිසිදු ප්‍රතිඵලයක් හමු නොවීය.");

        // 2. පළමු ප්‍රතිඵලයට අදාළ විස්තර සහ Pixeldrain ලින්ක් එක ගැනීම
        // (මෙතනදී අපි පළමු රිසල්ට් එකේ විස්තර පෙන්වනවා)
        const moviePage = await axios.get(results[0].link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $$ = cheerio.load(moviePage.data);
        const innerHtml = moviePage.data;

        // Pixeldrain ලින්ක්ස් සෙවීම (Regex)
        const dl_links = [];
        const pdRegex = /pixeldrain\.com\/u\/([a-zA-Z0-9]+)/g;
        let match;
        while ((match = pdRegex.exec(innerHtml)) !== null) {
            const pUrl = `https://pixeldrain.com/u/${match[1]}`;
            if (!dl_links.some(l => l.url === pUrl)) {
                dl_links.push({ url: pUrl });
            }
        }

        // අවුරුද්ද සෙවීම
        const year = results[0].title.match(/\d{4}/) ? results[0].title.match(/\d{4}/)[0] : "N/A";
        const imdb = $$('.data-imdb').text().replace('IMDb:', '').trim() || "N/A";

        // 3. WhatsApp පණිවිඩය සකස් කිරීම
        let msg = `🎬 *${results[0].title.replace(' - Sinhala Subtitles', '').trim()}*\n\n`;
        msg += `🗓️ *Year:* ${year}\n`;
        msg += `⭐ *IMDb:* ${imdb}\n\n`;
        msg += `📥 *Download Links:* \n`;

        if (dl_links.length > 0) {
            dl_links.forEach((link, i) => {
                msg += `${i + 1}. ${link.url}\n`;
            });
        } else {
            msg += `_ඩවුන්ලෝඩ් ලින්ක්ස් හමු නොවීය. සයිට් එකට ගොස් පරීක්ෂා කරන්න._\n`;
        }

        msg += `\n🔗 *Link:* ${results[0].link}\n\n*VEXTER-MD*`;

        // පින්තූරය සමඟ පණිවිඩය යැවීම
        await conn.sendMessage(from, { 
            image: { url: results[0].thumb }, 
            caption: msg 
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("❌ දෝෂයක් සිදුවිය: " + e.message);
    }
});
