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

                    // 1. Year & Metadata
                    let finalYear = "N/A";
                    const yearMatch = title.match(/\d{4}/) || html.match(/\b(19|20)\d{2}\b/);
                    if (yearMatch) finalYear = yearMatch[0];

                    const dl_links = [];

                    // 2. Redirect ලින්ක්ස් අල්ලාගෙන ඒවායින් Pixeldrain ID එක Decode කිරීම
                    // සාමාන්‍යයෙන් ලින්ක් එක තියෙන්නේ ?link= හෝ base64 විදිහට
                    $$('a[href*="api.sinhalasub.lk"], a[href*="link="], a[href*="pixeldrain"]').each((i, linkTag) => {
                        const rawUrl = $$(linkTag).attr('href');
                        let pixelId = "";

                        if (rawUrl.includes('pixeldrain.com/u/')) {
                            pixelId = rawUrl.split('/u/')[1].split('?')[0];
                        } else if (rawUrl.includes('link=')) {
                            // Redirect URL එක ඇතුළේ තියෙන එක Decode කිරීම
                            const encoded = rawUrl.split('link=')[1].split('&')[0];
                            try {
                                const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
                                if (decoded.includes('pixeldrain.com/u/')) {
                                    pixelId = decoded.split('/u/')[1].split('?')[0];
                                }
                            } catch (e) {
                                // Base64 නෙවෙයි නම් කෙලින්ම පරීක්ෂා කිරීම
                                if (decodeURIComponent(encoded).includes('pixeldrain.com/u/')) {
                                    pixelId = decodeURIComponent(encoded).split('/u/')[1].split('?')[0];
                                }
                            }
                        }

                        if (pixelId) {
                            const row = $$(linkTag).closest('tr');
                            dl_links.push({
                                quality: row.find('td').first().text().trim() || "HD",
                                size: row.find('td').eq(2).text().trim() || "N/A",
                                url: `https://pixeldrain.com/u/${pixelId}`
                            });
                        }
                    });

                    results.push({
                        title: title.replace(' - Sinhala Subtitles', '').trim(),
                        link: movieUrl,
                        thumbnail: $$('meta[property="og:image"]').attr('content') || "",
                        imdb: $$('.data-imdb').text().replace('IMDb:', '').trim() || "N/A",
                        year: finalYear,
                        description: $$('.wp-content p').first().text().trim().substring(0, 200) + "...",
                        dl_links: dl_links
                    });
                } catch (e) { continue; }
            }
        }
        return results;
    } catch (err) { return []; }
}

module.exports = { getMovieData };
