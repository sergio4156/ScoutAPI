import type { Browser } from "puppeteer-core";

/**
 * Launch a Puppeteer browser instance.
 * Uses @sparticuz/chromium on Vercel (serverless), regular puppeteer locally.
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log("Launching serverless browser...");
    // Serverless: use puppeteer-core + @sparticuz/chromium
    const chromiumMod = await import("@sparticuz/chromium");
    const chromium = chromiumMod.default || chromiumMod;
    const puppeteer = await import("puppeteer-core");

    console.log("Chromium args:", chromium.args);
    const execPath = await chromium.executablePath();
    console.log("Chromium executablePath:", execPath);

    return puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath: execPath,
      headless: true,
    }) as Promise<Browser>;
  } else {
    // Local dev: use full puppeteer with stealth
    const puppeteerExtra = await import("puppeteer-extra");
    const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
    puppeteerExtra.default.use(StealthPlugin.default());

    return puppeteerExtra.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    }) as unknown as Promise<Browser>;
  }
}
