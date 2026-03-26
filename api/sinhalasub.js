const axios = require('axios');
const cheerio = require('cheerio');

async function getMovieData(query) {
    try {
        const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const results = [];

        // සයිට් එකේ ඕනෑම තැනක තිබිය හැකි Movie Item එකක් සොයන ආකාරය
        // .result-item හෝ article හෝ .item යන ඕනෑම එකක් සොයයි
        const items = $('.result-item, article, .item, .post-item').get().slice(0, 5);

        for (const el of items) {
            const titleElement = $(el).find('h2.title a, .title a, h3 a, a').first();
            const title = titleElement.text().trim() || $(el).find('img').attr('alt');
            const movieUrl = titleElement.attr('href');
            const thumb = $(el).find('img').attr('src');

            if (movieUrl && movieUrl.includes('sinhalasub.lk')) {
                try {
                    const innerRes = await axios.get(movieUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const $$ = cheerio.load(innerRes.data);

                    // අතිරේක විස්තර එකතු කිරීම
                    results.push({
                        title: title,
                        link: movieUrl,
                        thumbnail: thumb,
                        imdb: $$('.data-imdb, .imdb-rating').text().replace('IMDb:', '').trim() || "N/A",
                        year: $$('.year').first().text().trim() || "N/A",
                        runtime: $$('.runtime, .duration, [itemprop="duration"]').text().trim() || "N/A",
                        description: $$('.wp-content p, .plot-text').first().text().trim().substring(0, 300) + "...",
                        genres: $$('.details-genre a, .genres a').map((i, g) => $$(g).text()).get(),
                        cast: $$('.info-col p:contains("Stars:") a, .cast a').map((i, s) => $$(s).text()).get(),
                        dl_links: $$('table tbody tr, .download-links tr').map((i, row) => {
                            const px = $$(row).find('a[href*="pixeldrain.com"]');
                            if (px.length > 0) {
                                return {
                                    quality: $$(row).find('td').first().text().trim() || "HD",
                                    size: $$(row).find('td').eq(2).text().trim() || "Unknown",
                                    url: px.attr('href')
                                };
                            }
                        }).get().filter(l => l !== undefined)
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
