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
                    const innerRes = await axios.get(movieUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const $$ = cheerio.load(innerRes.data);

                    const thumb = $$('meta[property="og:image"]').attr('content');
                    
                    // ඩවුන්ලෝඩ් ලින්ක්ස් ගන්නා ආකාරය (Pixeldrain)
                    const dl_links = [];
                    $$('a[href*="pixeldrain.com"]').each((i, link) => {
                        const url = $$(link).attr('href');
                        // ලින්ක් එක තියෙන Row එකේ විස්තර ගැනීම
                        const row = $$(link).closest('tr');
                        const quality = row.find('td').first().text().trim() || "HD";
                        const size = row.find('td').eq(2).text().trim() || "Unknown";
                        
                        dl_links.push({ quality, size, url });
                    });

                    results.push({
                        title: title.replace(' - Sinhala Subtitles', '').trim(),
                        link: movieUrl,
                        thumbnail: thumb,
                        imdb: $$('.data-imdb').text().replace('IMDb:', '').trim() || "N/A",
                        year: $$('.date, .year').first().text().trim().split(',').pop().trim() || "N/A",
                        description: $$('.wp-content p').first().text().trim().substring(0, 300) + "...",
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
