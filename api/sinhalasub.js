const axios = require('axios');
const cheerio = require('cheerio');

async function getMovieData(query) {
    try {
        const searchUrl = `https://sinhalasub.lk/feed/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });

        const $ = cheerio.load(data, { xmlMode: true });
        const results = [];
        const items = $('item').get().slice(0, 5);

        for (const el of items) {
            const title = $(el).find('title').text();
            const movieUrl = $(el).find('link').text();
            
            if (movieUrl) {
                try {
                    const innerRes = await axios.get(movieUrl, { 
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
                    });
                    const html = innerRes.data;
                    const $$ = cheerio.load(html);

                    const dl_links = [];

                    // --- NEW LOGIC: Pixeldrain ID extraction via String manipulation ---
                    // සයිට් එකේ Buttons වල තියෙන base64 encoded ලින්ක්ස් සෙවීම
                    const regex = /"link":"([a-zA-Z0-9+/=]+)"/g;
                    let match;
                    while ((match = regex.exec(html)) !== null) {
                        try {
                            const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
                            if (decoded.includes('pixeldrain.com/u/')) {
                                const pId = decoded.split('/u/')[1].split('?')[0];
                                const pUrl = `https://pixeldrain.com/u/${pId}`;
                                
                                if (!dl_links.some(l => l.url === pUrl)) {
                                    // Quality එක අනුමාන කිරීම (Context එක අනුව)
                                    let quality = "HD";
                                    if (html.includes(match[1])) {
                                        const segment = html.substring(html.indexOf(match[1]) - 300, html.indexOf(match[1]));
                                        if (segment.includes('720p')) quality = "720p";
                                        else if (segment.includes('1080p')) quality = "1080p";
                                        else if (segment.includes('480p')) quality = "480p";
                                    }
                                    dl_links.push({ quality, url: pUrl });
                                }
                            }
                        } catch (e) {}
                    }

                    // අවසාන විසඳුම: මුළු HTML එකේම පීරලා Pixeldrain ID එක සෙවීම
                    if (dl_links.length === 0) {
                        const directRegex = /pixeldrain\.com\/u\/([a-zA-Z0-9]+)/g;
                        let dMatch;
                        while ((dMatch = directRegex.exec(html)) !== null) {
                            const dUrl = `https://pixeldrain.com/u/${dMatch[1]}`;
                            if (!dl_links.some(l => l.url === dUrl)) {
                                dl_links.push({ quality: "HD", url: dUrl });
                            }
                        }
                    }

                    results.push({
                        title: title.replace(' - Sinhala Subtitles', '').trim(),
                        thumbnail: $$('meta[property="og:image"]').attr('content') || "",
                        year: title.match(/\d{4}/) ? title.match(/\d{4}/)[0] : "N/A",
                        dl_links: dl_links
                    });
                } catch (e) { continue; }
            }
        }
        return results;
    } catch (err) { return []; }
}

module.exports = { getMovieData };
