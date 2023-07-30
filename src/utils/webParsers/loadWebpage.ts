import { chromium } from 'playwright';

const loadWebContent = async (url: string) => {
  const browser = await chromium.launch({headless: true}); 
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' +
  ' AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36', }); 
  const page = await context.newPage(); 
    // Navigate to a website 
  await page.goto(url); 
    // Do something on the website
    // ... 
  const textContents = await page.innerText('body');
  await browser.close(); 
  return textContents.replace(/[\r\n]+/gm, " ");
}

export default loadWebContent;