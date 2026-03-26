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

                    let finalYear = "N/A";
                    const yearMatch = title.match(/\d{4}/) || html.match(/\b(19|20)\d{2}\b/);
                    if (yearMatch) finalYear = yearMatch[0];

                    const dl_links = [];

                    // --- DOWNLOAD LINKS SCRAPING START ---
                    // ක්‍රමය 1: සියලුම <a> ටැග් පරීක්ෂා කිරීම (Redirect සහ Direct)
                    $$('a').each((i, linkTag) => {
                        const href = $$(linkTag).attr('href') || "";
                        let pixelId = "";

                        // Pixeldrain Direct Link එකක් නම්
                        if (href.includes('pixeldrain.com/u/')) {
                            pixelId = href.split('/u/')[1].split('?')[0];
                        } 
                        // Sinhalasub Redirect Link එකක් නම් (Base64 හෝ URL encoded)
                        else if (href.includes('link=')) {
                            const encoded = href.split('link=')[1].split('&')[0];
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
                            // ලින්ක් එක තියෙන Row එකේ Quality එක සෙවීම
                            const rowText = $$(linkTag).closest('tr').text().toLowerCase() || $$(linkTag).text().toLowerCase();
                            let quality = "HD";
                            if (rowText.includes('480')) quality = "480p";
                            else if (rowText.includes('720')) quality = "720p";
                            else if (rowText.includes('1080')) quality = "1080p";

                            const size = $$(linkTag).closest('tr').find('td').eq(2).text().trim() || "N/A";

                            // එකම ලින්ක් එක දෙපාරක් වැටීම වැළැක්වීම
                            if (!dl_links.some(l => l.url.includes(pixelId))) {
                                dl_links.push({
                                    quality: quality,
                                    size: size,
                                    url: `https://pixeldrain.com/u/${pixelId}`
                                });
                            }
                        }
                    });
                    // --- DOWNLOAD LINKS SCRAPING END ---

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
