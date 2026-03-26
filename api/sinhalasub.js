const axios = require('axios');
const cheerio = require('cheerio');

async function getMovieData(query) {
    try {
        const searchUrl = `https://sinhalasub.lk/feed/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
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
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
                    });
                    const html = innerRes.data;
                    const $$ = cheerio.load(html);

                    // 1. Year එක ගැනීම (Title එකෙන් හෝ Content එකෙන්)
                    let finalYear = "N/A";
                    const yearMatch = title.match(/\d{4}/) || html.match(/\b(19|20)\d{2}\b/);
                    if (yearMatch) finalYear = yearMatch[0];

                    // 2. Pixeldrain ලින්ක්ස් ගැනීම (HTML එක ඇතුළේ ඇති සියලුම Pixeldrain ලින්ක්ස් සොයයි)
                    const dl_links = [];
                    const pixeldrainRegex = /https:\/\/pixeldrain\.com\/u\/[a-zA-Z0-9]+/g;
                    const linksFound = html.match(pixeldrainRegex);

                    if (linksFound) {
                        // Unique ලින්ක්ස් පමණක් තබා ගැනීම
                        const uniqueLinks = [...new Set(linksFound)];
                        uniqueLinks.forEach((link, i) => {
                            // ලින්ක් එක තියෙන තැන අවට Quality එක සෙවීම
                            let quality = "HD";
                            if (html.includes(link)) {
                                const pos = html.indexOf(link);
                                const context = html.substring(pos - 100, pos).toLowerCase();
                                if (context.includes('480')) quality = "480p";
                                else if (context.includes('720')) quality = "720p";
                                else if (context.includes('1080')) quality = "1080p";
                            }
                            dl_links.push({ quality, size: "N/A", url: link });
                        });
                    }

                    results.push({
                        title: title.replace(' - Sinhala Subtitles', '').trim(),
                        link: movieUrl,
                        thumbnail: $$('meta[property="og:image"]').attr('content') || "",
                        imdb: $$('.data-imdb').text().replace('IMDb:', '').trim() || "N/A",
                        year: finalYear,
                        description: $$('.wp-content p').first().text().trim().substring(0, 200) + "...",
                        genres: $$('.details-genre a').map((i, g) => $$(g).text()).get(),
                        dl_links
                    });
                } catch (e) { continue; }
            }
        }
        return results;
    } catch (err) { return []; }
}

module.exports = { getMovieData };
