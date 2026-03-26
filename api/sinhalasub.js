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
                    const html = innerRes.data; // මුළු පිටුවේම HTML එක string එකක් විදිහට ගන්නවා
                    const $$ = cheerio.load(html);

                    let finalYear = "N/A";
                    const yearMatch = title.match(/\d{4}/) || html.match(/\b(19|20)\d{2}\b/);
                    if (yearMatch) finalYear = yearMatch[0];

                    const dl_links = [];

                    // --- ක්‍රමය 1: මුළු HTML එක ඇතුළේම Pixeldrain IDs සෙවීම (Regex) ---
                    // Pixeldrain ID එකක් කියන්නේ /u/ එකට පස්සේ එන අකුරු සහ ඉලක්කම් 10ක් වගේ ප්‍රමාණයක්
                    const pixeldrainRegex = /pixeldrain\.com\/u\/([a-zA-Z0-9]+)/g;
                    let match;
                    while ((match = pixeldrainRegex.exec(html)) !== null) {
                        const pixelId = match[1];
                        const fullUrl = `https://pixeldrain.com/u/${pixelId}`;

                        // එකම ලින්ක් එක ආයෙත් වැටීම වැළැක්වීම
                        if (!dl_links.some(l => l.url === fullUrl)) {
                            // ලින්ක් එක තිබුණු තැන අවට පීරලා Quality එක සෙවීම
                            const context = html.substring(match.index - 200, match.index).toLowerCase();
                            let quality = "HD";
                            if (context.includes('480')) quality = "480p";
                            else if (context.includes('720')) quality = "720p";
                            else if (context.includes('1080')) quality = "1080p";

                            dl_links.push({ quality, size: "N/A", url: fullUrl });
                        }
                    }

                    // --- ක්‍රමය 2: Base64 Redirects Decode කිරීම (කලින් ක්‍රමය) ---
                    if (dl_links.length === 0) {
                        const base64Regex = /link=([a-zA-Z0-9+/=]+)/g;
                        let b64Match;
                        while ((b64Match = base64Regex.exec(html)) !== null) {
                            try {
                                const decoded = Buffer.from(b64Match[1], 'base64').toString('utf-8');
                                if (decoded.includes('pixeldrain.com/u/')) {
                                    const pId = decoded.split('/u/')[1].split('?')[0];
                                    const pUrl = `https://pixeldrain.com/u/${pId}`;
                                    if (!dl_links.some(l => l.url === pUrl)) {
                                        dl_links.push({ quality: "HD", size: "N/A", url: pUrl });
                                    }
                                }
                            } catch (e) {}
                        }
                    }

                    results.push({
                        title: title.replace(' - Sinhala Subtitles', '').trim(),
                        thumbnail: $$('meta[property="og:image"]').attr('content') || "",
                        year: finalYear,
                        dl_links: dl_links
                    });
                } catch (e) { continue; }
            }
        }
        return results;
    } catch (err) { return []; }
}

module.exports = { getMovieData };
