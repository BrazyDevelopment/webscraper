const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const prettier = require('prettier');

const baseUrl = 'ENTER_URL_HERE';
const outputDir = path.join(__dirname, 'template');


async function scrapeUrl(url) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        await page.goto(url, { waitUntil: 'networkidle0' });

        const content = await page.content();
        await browser.close();

        const $ = cheerio.load(content);

        // Remove unnecessary whitespace
        $('style, script').remove();

        // Make HTML more readable
        const formattedHtml = await prettier.format($.html(), {
            parser: "html",
            htmlWhitespaceSensitivity: "ignore",
            singleQuote: true,
            tabWidth: 4,
            useTabs: false,
            printWidth: 100,
        });

        // Save formatted HTML
        const fileName = path.join(outputDir, `${url.replace(/[^a-zA-Z0-9]/g, '_')}.html`);
        // Ensure we're passing the formatted HTML string, not a Promise
        await fs.writeFile(fileName, formattedHtml);

        // Extract and save images
        $('img').each(async (i, elem) => {
            const src = $(elem).attr('src');
            if (src && src.startsWith('http')) {
                const imgPath = path.join(outputDir, 'images', path.basename(src));
                await fs.mkdir(path.dirname(imgPath), { recursive: true });
                console.log(`Image to download: ${src} -> ${imgPath}`);
            }
        });

        // Extract and save CSS
        $('link[rel="stylesheet"]').each(async (i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.startsWith('http')) {
                const cssPath = path.join(outputDir, 'css', path.basename(href));
                await fs.mkdir(path.dirname(cssPath), { recursive: true });
                console.log(`CSS to download: ${href} -> ${cssPath}`);

            }
        });

        // Extract and save JS
        $('script[src]').each(async (i, elem) => {
            const src = $(elem).attr('src');
            if (src && src.startsWith('http')) {
                const jsPath = path.join(outputDir, 'js', path.basename(src));
                await fs.mkdir(path.dirname(jsPath), { recursive: true });
                console.log(`JS to download: ${src} -> ${jsPath}`);

            }
        });

    } catch (err) {
        console.error(`Failed to scrape ${url}: ${err.message}`);
    } finally {
        await browser.close();
    }
}
// Start scraping from the base URL
async function startScraping() {
    await fs.mkdir(outputDir, { recursive: true });
    await scrapeUrl(baseUrl);
    console.log('Scraping completed.');
}

startScraping();