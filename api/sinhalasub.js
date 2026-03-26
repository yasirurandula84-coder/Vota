const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Sinhalasub.lk වෙබ් අඩවියෙන් දත්ත ලබා ගන්නා ප්‍රධාන Function එක
 * @param {string} query - සෙවිය යුතු චිත්‍රපටයේ නම
 */
async function getMovieData(query) {
    try {
        const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });

        const $ = cheerio.load(data);
        const results = [];

        // සෙවුම් ප්‍රතිඵල අතරින් මුල් 5 පමණක් තෝරා ගනී (Speed එක සඳහා)
        const movieElements = $('article.result-item').get().slice(0, 5);

        for (const el of movieElements) {
            const title = $(el).find('.title a').text().trim();
            const movieUrl = $(el).find('.title a').attr('href');
            const thumb = $(el).find('img').attr('src');

            if (movieUrl) {
                try {
                    // චිත්‍රපටයේ ඇතුළත පිටුවට (Inner Page) ගොස් විස්තර ලබා ගැනීම
                    const innerPage = await axios.get(movieUrl);
                    const $$ = cheerio.load(innerPage.data);

                    results.push({
                        title: title,
                        link: movieUrl,
                        thumbnail: thumb,
                        imdb: $$('.data-imdb').text().replace('IMDb:', '').trim() || "N/A",
                        runtime: $$('.data-views[itemprop="duration"]').text().trim() || "N/A",
                        year: $$('.year').first().text().trim() || "N/A",
                        description: $$('.wp-content p').first().text().trim() || "No description available",
                        genres: $$('.details-genre a').map((i, g) => $$(g).text()).get(),
                        cast: $$('.info-col p:contains("Stars:") a').map((i, s) => $$(s).text()).get(),
                        // Pixeldrain ලින්ක් ටික මෙතනින් ගන්නවා
                        dl_links: $$('table tbody tr').map((i, row) => {
                            const pixeldrain = $$(row).find('a[href*="pixeldrain.com"]').attr('href');
                            if (pixeldrain) {
                                return {
                                    quality: $$(row).find('td').eq(0).text().trim(),
                                    size: $$(row).find('td').eq(2).text().trim(),
                                    url: pixeldrain
                                };
                            }
                        }).get().filter(l => l !== undefined)
                    });
                } catch (innerError) {
                    console.error("Inner page fetch error:", innerError.message);
                }
            }
        }
        return results;
    } catch (e) {
        console.error("Scraping Error:", e.message);
        return [];
    }
}

module.exports = { getMovieData };
