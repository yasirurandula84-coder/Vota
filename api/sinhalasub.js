const axios = require('axios');
const cheerio = require('cheerio');

async function getMovieData(query) {
    try {
        // සයිට් එකේ සර්ච් එක වෙනුවට RSS Feed එක පාවිච්චි කිරීම (Bypass Blocks)
        const searchUrl = `https://sinhalasub.lk/feed/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data, { xmlMode: true });
        const results = [];

        // RSS එකේ තියෙන Items ලූප් කිරීම
        const items = $('item').get().slice(0, 5);

        for (const el of items) {
            const title = $(el).find('title').text();
            const movieUrl = $(el).find('link').text();
            
            if (movieUrl) {
                try {
                    // විස්තර ලබා ගැනීමට පෝස්ට් එක ඇතුළට යාම
                    const innerRes = await axios.get(movieUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const $$ = cheerio.load(innerRes.data);

                    // Image එක සොයාගැනීම (Thumbnail)
                    const thumb = $$('meta[property="og:image"]').attr('content') || $$('.wp-post-image').attr('src');

                    // Pixeldrain ලින්ක්ස් පෙරීම
                    const dl_links = [];
                    $$('table tbody tr').each((i, row) => {
                        const px = $$(row).find('a[href*="pixeldrain.com"]').attr('href');
                        if (px) {
                            dl_links.push({
                                quality: $$(row).find('td').first().text().trim() || "HD",
                                size: $$(row).find('td').eq(2).text().trim() || "N/A",
                                url: px
                            });
                        }
                    });

                    results.push({
                        title: title.replace(' - Sinhala Subtitles', ''),
                        link: movieUrl,
                        thumbnail: thumb,
                        imdb: $$('.data-imdb').text().replace('IMDb:', '').trim() || "N/A",
                        year: $$('.year').first().text().trim() || "N/A",
                        description: $$('.wp-content p').first().text().trim().substring(0, 300) + "...",
                        genres: $$('.details-genre a').map((i, g) => $$(g).text()).get(),
                        cast: $$('.info-col p:contains("Stars:") a').map((i, s) => $$(s).text()).get(),
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
