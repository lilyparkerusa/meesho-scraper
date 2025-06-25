const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/scrape', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const data = await page.evaluate(() => {
            const title = document.querySelector('h1')?.innerText || '';
            const description = document.querySelector('.ProductDescription')?.innerText || '';
            const scriptTag = [...document.scripts].find(s => s.innerText.includes('imageUrls'));

            let images = [];
            let price = 0;

            if (scriptTag) {
                try {
                    const match = scriptTag.innerText.match(/"imageUrls":\[(.*?)\]/);
                    if (match) {
                        images = match[1].split(',').map(s => s.replace(/"/g, '').trim());
                    }

                    const priceMatch = scriptTag.innerText.match(/"price":\s?(\d+(\.\d+)?)/);
                    if (priceMatch) {
                        price = parseFloat(priceMatch[1]);
                    }
                } catch (e) {}
            }

            return { title, description, images, price };
        });

        await browser.close();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Scraping failed' });
    }
});

app.listen(PORT, () => console.log(`Scraper API running on http://localhost:${PORT}`));
