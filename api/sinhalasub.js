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
                    const $$ = cheerio.load(innerRes.data);

                    // 1. Thumbnail එක ගැනීම
                    const thumb = $$('meta[property="og:image"]').attr('content') || $$('img.wp-post-image').attr('src');
                    
                    // 2. Year එක ගැනීම (පෝස්ට් එකේ තියෙන අවුරුද්ද)
                    const yearText = $$('.year, .date, .release-date').text().trim();
                    const yearMatch = yearText.match(/\d{4}/); // ඉලක්කම් 4ක අවුරුද්දක් සොයන්න
                    const finalYear = yearMatch ? yearMatch[0] : "N/A";

                    // 3. ඩවුන්ලෝඩ් ලින්ක්ස් ගැනීම (Direct Pixeldrain Search)
                    const dl_links = [];
                    $$('a').each((i, link) => {
                        const href = $$(link).attr('href');
                        if (href && href.includes('pixeldrain.com')) {
                            const linkText = $$(link).text().toLowerCase();
                            
                            // Quality එක සොයා ගැනීම (Link එකේ Text එකෙන්)
                            let quality = "HD";
                            if (linkText.includes('480')) quality = "480p";
                            else if (linkText.includes('720')) quality = "720p";
                            else if (linkText.includes('1080')) quality = "1080p";

                            dl_links.push({
                                quality: quality,
                                size: "Check Link",
                                url: href
                            });
                        }
                    });

                    results.push({
                        title: title.replace(' - Sinhala Subtitles', '').trim(),
                        link: movieUrl,
                        thumbnail: thumb,
                        imdb: $$('.data-imdb').text().replace('IMDb:', '').trim() || "N/A",
                        year: finalYear,
                        description: $$('.wp-content p').first().text().trim().substring(0, 200) + "...",
                        genres: $$('.details-genre a').map((i, g) => $$(g).text()).get(),
                        cast: $$('.info-col p:contains("Stars:") a').map((i, s) => $$(s).text()).get(),
                        dl_links: dl_links
                    });
                } catch (e) { continue; }
            }
        }
        return results;
    } catch (err) {
        return [];
    }
}

module.exports = { getMovieData };
