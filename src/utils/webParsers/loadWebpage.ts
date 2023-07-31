import axios from 'axios';
const { chromium } = require('playwright-core');
const bundledChromium = require('chrome-aws-lambda');


const loadWebContent = async (url: string) => {
  const browser = await Promise.resolve(bundledChromium.executablePath).then(
    (executablePath) => {
      if (!executablePath) {
        // local execution
        return chromium.launch({});
      }
      return chromium.launch({ executablePath });
    }
  ); 
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' +
  ' AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36', });
  const page = await context.newPage(); 
    // Navigate to a website 
  await page.goto((url || 'https://mindplug.io')); 
  //   // Do something on the website
    // ... 
  const textContents = await page.innerText('body');
  await browser.close(); 
  const toReturn = textContents.replace(/[\r\n]+/gm, " ");
  return toReturn;
}

export default loadWebContent;