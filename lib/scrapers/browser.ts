import type { Browser } from "puppeteer-core";

/**
 * Launch a Puppeteer browser instance.
 * Uses @sparticuz/chromium on Vercel (serverless), regular puppeteer locally.
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Serverless: use puppeteer-core + @sparticuz/chromium
    const chromium = (await import("@sparticuz/chromium")).default || (await import("@sparticuz/chromium"));
    const puppeteer = await import("puppeteer-core");

    return puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath: await chromium.executablePath(),
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
