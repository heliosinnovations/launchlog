const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

/**
 * Visual Regression Test for Footer Component
 * Compares design reference against deployed implementation
 */

const DEPLOYED_URL = 'https://launchlog-lac.vercel.app';
const DESIGN_REF_PATH = path.join(__dirname, '../drafts/landing-variation-1.html');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const RESULTS_DIR = path.join(__dirname, 'results');

// Test breakpoints
const BREAKPOINTS = [
  { name: 'mobile-small', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop-medium', width: 1024, height: 768 },
  { name: 'desktop-large', width: 1440, height: 900 }
];

async function compareImages(img1Path, img2Path, diffPath) {
  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));

  // Resize images to match if needed
  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);

  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const totalPixels = width * height;
  const matchPercent = ((totalPixels - numDiffPixels) / totalPixels * 100).toFixed(2);

  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  return {
    matchPercent: parseFloat(matchPercent),
    diffPixels: numDiffPixels,
    totalPixels,
    passed: matchPercent >= 98
  };
}

// Export test functions for manual execution
module.exports = {
  DEPLOYED_URL,
  DESIGN_REF_PATH,
  SCREENSHOTS_DIR,
  RESULTS_DIR,
  BREAKPOINTS,
  compareImages
};

console.log('Footer Visual Regression Test Configuration');
console.log('Deployed URL:', DEPLOYED_URL);
console.log('Design Reference:', DESIGN_REF_PATH);
console.log('Breakpoints:', BREAKPOINTS.map(bp => `${bp.name} (${bp.width}x${bp.height})`).join(', '));
