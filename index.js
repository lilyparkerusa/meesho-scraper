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
      const description = document.querySelector('[data-testid="product-description"]')?.innerText || '';
      const imageNodes = Array.from(document.querySelectorAll('img[src*="images.meesho"]'));
      const images = imageNodes.map(img => img.src).filter((v, i, a) => a.indexOf(v) === i);

      const priceText = document.querySelector('[data-testid="price-main"]')?.innerText || '';
      const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

      return { title, description, images, price };
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    console.error('Scraping failed:', err);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

