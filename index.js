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
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('h1', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText || '';
      const description = document.querySelector('[data-testid="product-description"]')?.innerText || '';
      const imageElements = Array.from(document.querySelectorAll('img[src*="images.meesho"]'));
      const images = imageElements.map(img => img.src);
      const priceText = document.querySelector('[data-testid="price-main"]')?.innerText || '';
      const price = parseFloat(priceText.replace(/[^\d.]/g, '') || 0);

      return { title, description, images, price };
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    console.error('[Scraping Failed]', err.message);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Scraper API running on http://localhost:${PORT}`);
});
