const axios = require('axios');
const cheerio = require('cheerio');
const { cmd } = require('../command');

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

        await reply("🔎 සෙවුම් කරමින් පවතී...");

        // 1. සෙවුම් ප්‍රතිඵල ලබා ගැනීම (Cloudflare Bypass Headers සමඟ)
        const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Referer': 'https://sinhalasub.lk/',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // සයිට් එකේ චිත්‍රපට අයිතමයන් (Articles) සොයන විදිහ
        $('article').each((i, el) => {
            const title = $(el).find('h2.entry-title a').text().trim() || $(el).find('a').attr('title');
            const link = $(el).find('h2.entry-title a').attr('href') || $(el).find('a').attr('href');
            const thumb = $(el).find('img').attr('src');
            
            if (link && link.includes('sinhalasub.lk')) {
                results.push({ title, link, thumb });
            }
        });

        if (results.length === 0) return reply("❌ කිසිදු ප්‍රතිඵලයක් හමු නොවීය. කරුණාකර නිවැරදි නම ටයිප් කරන්න.");

        // 2. පළමු ප්‍රතිඵලය සඳහා විස්තර ගැනීම
        const moviePage = await axios.get(results[0].link, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const innerHtml = moviePage.data;
        const $$ = cheerio.load(innerHtml);

        // Pixeldrain ලින්ක්ස් සෙවීම (Regex)
        const dl_links = [];
        const pdRegex = /pixeldrain\.com\/u\/([a-zA-Z0-9]+)/g;
        let match;
        while ((match = pdRegex.exec(innerHtml)) !== null) {
            const pUrl = `https://pixeldrain.com/u/${match[1]}`;
            if (!dl_links.some(l => l.url === pUrl)) {
                dl_links.push(pUrl);
            }
        }

        const imdb = $$('.data-imdb').text().replace('IMDb:', '').trim() || "N/A";
        const year = results[0].title.match(/\d{4}/) ? results[0].title.match(/\d{4}/)[0] : "N/A";

        // 3. පණිවිඩය සකස් කිරීම
        let caption = `🎬 *${results[0].title.replace(' - Sinhala Subtitles', '').trim()}*\n\n`;
        caption += `🗓️ *Year:* ${year}\n`;
        caption += `⭐ *IMDb:* ${imdb}\n\n`;
        caption += `📥 *Download Links (Pixeldrain):*\n`;

        if (dl_links.length > 0) {
            dl_links.forEach((link, i) => {
                caption += `\n🔗 ${link}`;
            });
        } else {
            caption += `\n_ලින්ක්ස් හමු නොවීය. සයිට් එකට ගොස් පරීක්ෂා කරන්න._\n`;
        }

        caption += `\n\n🔗 *Full Page:* ${results[0].link}\n\n*VEXTER-MD*`;

        await conn.sendMessage(from, { 
            image: { url: results[0].thumb }, 
            caption: caption 
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ දෝෂයක් සිදුවිය: " + e.message);
    }
});
