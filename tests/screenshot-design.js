#!/usr/bin/env node
/**
 * Screenshot the design reference footer for visual comparison
 */

const { chromium } = require('playwright');
const path = require('path');

async function screenshotDesignReference() {
  console.log('Launching browser to capture design reference...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const designRefPath = 'file://' + path.join(__dirname, '../drafts/landing-variation-1.html');
  console.log('Loading design reference:', designRefPath);

  await page.goto(designRefPath);
  await page.waitForLoadState('networkidle');

  // Wait for footer to be visible
  await page.waitForSelector('footer', { state: 'visible' });

  // Screenshot footer at desktop size
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);

  const footer = page.locator('footer');
  const screenshotPath = path.join(__dirname, 'screenshots', 'footer-design-reference.png');

  await footer.screenshot({ path: screenshotPath });
  console.log('✓ Design reference screenshot saved:', screenshotPath);

  await browser.close();
}

screenshotDesignReference().catch(console.error);
