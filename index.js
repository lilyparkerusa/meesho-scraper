const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const app = express();

app.get('/scrape', async (req, res) => {
  const productUrl = req.query.url;
  if (!productUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.1 Safari/537.36');

    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const data = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText || 'No title';
      const priceText = document.querySelector('[class*=Price]')?.innerText || '₹0';
      const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
      const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
      const description = document.body.innerText.slice(0, 200); // dummy for now

      return { title, price, images, description };
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    console.error('[Scraping Failed]', err);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server running...'));
