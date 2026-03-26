const axios = require('axios');
const cheerio = require('cheerio');

async function getMovieData(query) {
    try {
        const searchUrl = `https://sinhalasub.lk/feed/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000 
        });

        const $ = cheerio.load(data, { xmlMode: true });
        const results = [];
        const items = $('item').get().slice(0, 5);

        for (const el of items) {
            const title = $(el).find('title').text();
            const movieUrl = $(el).find('link').text();
            
            if (movieUrl) {
                try {
                    const innerRes = await axios.get(movieUrl, { 
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 10000
                    });
                    const html = innerRes.data;
                    const $$ = cheerio.load(html);

                    let finalYear = "N/A";
                    const yearMatch = title.match(/\d{4}/) || html.match(/\b(19|20)\d{2}\b/);
                    if (yearMatch) finalYear = yearMatch[0];

                    const dl_links = [];
                    // Redirect Decode Logic
                    $$('a[href*="link="], a[href*="pixeldrain"]').each((i, linkTag) => {
                        const rawUrl = $$(linkTag).attr('href');
                        let pixelId = "";

                        if (rawUrl.includes('pixeldrain.com/u/')) {
                            pixelId = rawUrl.split('/u/')[1].split('?')[0];
                        } else if (rawUrl.includes('link=')) {
                            const encoded = rawUrl.split('link=')[1].split('&')[0];
                            try {
                                const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
                                if (decoded.includes('pixeldrain.com/u/')) {
                                    pixelId = decoded.split('/u/')[1].split('?')[0];
                                }
                            } catch (e) {
                                if (decodeURIComponent(encoded).includes('pixeldrain.com/u/')) {
                                    pixelId = decodeURIComponent(encoded).split('/u/')[1].split('?')[0];
                                }
                            }
                        }

                        if (pixelId) {
                            dl_links.push({
                                quality: $$(linkTag).closest('tr').find('td').first().text().trim() || "HD",
                                url: `https://pixeldrain.com/u/${pixelId}`
                            });
                        }
                    });

                    results.push({
                        title: title.replace(' - Sinhala Subtitles', '').trim(),
                        thumbnail: $$('meta[property="og:image"]').attr('content') || "",
                        year: finalYear,
                        dl_links
                    });
                } catch (e) { continue; }
            }
        }
        return results;
    } catch (err) {
        console.error("Scraper Error:", err.message);
        return [];
    }
}

module.exports = { getMovieData };
