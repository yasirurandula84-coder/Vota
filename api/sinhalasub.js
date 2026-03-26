const axios = require('axios');
const cheerio = require('cheerio');

async function getMovieData(query) {
    try {
        const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://sinhalasub.lk/'
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        const results = [];

        // සයිට් එකේ අලුත්ම structure එකට අනුව selectors පරීක්ෂා කිරීම
        const items = $('article, .result-item, .item, .post-item, .search-result').get().slice(0, 5);

        for (const el of items) {
            // ලිපියේ මාතෘකාව සහ ලින්ක් එක සොයාගැනීම
            const titleElement = $(el).find('h2 a, h3 a, .title a, a').first();
            const movieUrl = titleElement.attr('href');
            let title = titleElement.text().trim() || $(el).find('img').attr('alt') || "No Title";
            const thumb = $(el).find('img').attr('src');

            // වැදගත්: ලින්ක් එක sinhalasub එකේ එකක්ද සහ ඒක movie පෝස්ට් එකක්ද කියා බැලීම
            if (movieUrl && movieUrl.includes('sinhalasub.lk')) {
                try {
                    const innerRes = await axios.get(movieUrl, { 
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 10000 
                    });
                    const $$ = cheerio.load(innerRes.data);

                    // Metadata ලබාගැනීම
                    const imdb = $$('.data-imdb, .imdb-rating').text().replace(/IMDb:|Rating:/gi, '').trim() || "N/A";
                    const year = $$('.year, .date').first().text().trim() || "N/A";
                    const runtime = $$('.runtime, .duration, [itemprop="duration"]').text().trim() || "N/A";
                    const description = $$('.wp-content p, .plot-text').first().text().trim().substring(0, 350) + "...";
                    
                    // Pixeldrain ලින්ක්ස් පමණක් පෙරා ගැනීම
                    const dl_links = [];
                    $$('table tbody tr').each((i, row) => {
                        const downloadLink = $$(row).find('a[href*="pixeldrain.com"]').attr('href');
                        if (downloadLink) {
                            dl_links.push({
                                quality: $$(row).find('td').first().text().trim() || "HD",
                                size: $$(row).find('td').eq(2).text().trim() || "Unknown",
                                url: downloadLink
                            });
                        }
                    });

                    results.push({
                        title,
                        link: movieUrl,
                        thumbnail: thumb,
                        imdb,
                        year,
                        runtime,
                        description,
                        genres: $$('.details-genre a, .genres a').map((i, g) => $$(g).text()).get(),
                        cast: $$('.info-col p:contains("Stars:") a, .cast a').map((i, s) => $$(s).text()).get(),
                        dl_links
                    });
                } catch (e) {
                    console.log("Inner fetch failed for:", title);
                    continue; 
                }
            }
        }
        return results;
    } catch (err) {
        console.error("Scraper Error:", err.message);
        return [];
    }
}

module.exports = { getMovieData };
