import scrape from 'website-scraper';
import PuppeteerPlugin from 'website-scraper-puppeteer';

const options = {
    urls: ['https://www.zeusonsolofficial.com'], // Replace with the URL you want to scrape
    directory: './zeus', // Directory where scraped content will be saved
    plugins: [
      new PuppeteerPlugin({
        launchOptions: { headless: "new" }, 
        gotoOptions: { waitUntil: "networkidle0" },
        scrollToBottom: { timeout: 10000, viewportN: 10 },
        blockNavigation: true,
      })
    ]
};

scrape(options)
  .then(() => console.log('Scraping completed'))
  .catch(err => console.error('An error occurred:', err));