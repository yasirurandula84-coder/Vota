const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

async function getMovieData(query) {
    try {
        // 1. මුලින්ම සර්ච් එක කරලා Movie Page URL එක ගන්නවා
        const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}`;
        const searchRes = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(searchRes.data);
        
        const firstMovie = $('article a').first().attr('href');
        if (!firstMovie) return [];

        // 2. Movie Page එකට ගිහින් එතන තියෙන "Post ID" එක ගන්නවා
        const moviePage = await axios.get(firstMovie, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $$ = cheerio.load(moviePage.data);
        
        // පෝස්ට් එකේ ID එක හොයාගන්නවා (මෙය ලින්ක්ස් ජෙනරේට් කරන්න ඕනේ)
        const postId = $$('link[rel="shortlink"]').attr('href')?.split('p=')[1] || 
                       $$('article').attr('id')?.replace('post-', '');

        if (!postId) return [];

        const dl_links = [];

        // 3. සයිට් එකේ AJAX API එකට කතා කරලා Pixeldrain ලින්ක්ස් ටික බලෙන් ගන්නවා
        // මේක තමයි සයිට් එකේ ලින්ක්ස් හංගලා තියෙන තැන
        try {
            const ajaxUrl = 'https://sinhalasub.lk/wp-admin/admin-ajax.php';
            const response = await axios.post(ajaxUrl, qs.stringify({
                action: 'get_download_links', // මෙය සයිට් එකේ පාවිච්චි කරන ඇක්ෂන් එක විය හැක
                post_id: postId
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' }
            });

            // ලැබෙන දත්ත ඇතුළේ Pixeldrain ලින්ක්ස් තියෙනවද බලනවා
            const htmlContent = JSON.stringify(response.data);
            const pdRegex = /https:\/\/pixeldrain\.com\/u\/([a-zA-Z0-9]+)/g;
            let match;
            while ((match = pdRegex.exec(htmlContent)) !== null) {
                dl_links.push({
                    quality: "HD",
                    url: match[0]
                });
            }
        } catch (e) {
            // AJAX එක වැඩ නොකළොත් HTML එක ඇතුළේ හැංගිලා තියෙන ඒවාවත් අදිනවා
            const pageHtml = moviePage.data;
            const pdRegex2 = /pixeldrain\.com\/u\/([a-zA-Z0-9]+)/g;
            let match2;
            while ((match2 = pdRegex2.exec(pageHtml)) !== null) {
                dl_links.push({ quality: "HD", url: `https://pixeldrain.com/u/${match2[1]}` });
            }
        }

        return [{
            title: $$('h1.entry-title').text().trim() || "Movie Found",
            thumbnail: $$('meta[property="og:image"]').attr('content') || "",
            year: $$('.year').text().trim() || "N/A",
            dl_links: [...new Set(dl_links.map(JSON.stringify))].map(JSON.parse) // Unique links only
        }];

    } catch (err) {
        console.error("Critical Scraper Error:", err.message);
        return [];
    }
}

module.exports = { getMovieData };
