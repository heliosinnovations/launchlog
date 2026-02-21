#!/usr/bin/env node
/**
 * Visual comparison: Design reference vs Deployed implementation
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');

async function compareImages(img1Path, img2Path, diffPath) {
  console.log('\n=== Visual Regression Comparison ===');
  console.log('Design Reference:', img1Path);
  console.log('Deployed Implementation:', img2Path);

  if (!fs.existsSync(img1Path)) {
    console.error('ERROR: Design reference screenshot not found!');
    return { passed: false, error: 'Design reference missing' };
  }

  if (!fs.existsSync(img2Path)) {
    console.error('ERROR: Deployed screenshot not found!');
    return { passed: false, error: 'Deployed screenshot missing' };
  }

  const img1 = PNG.sync.read(fs.readFileSync(img1Path));
  const img2 = PNG.sync.read(fs.readFileSync(img2Path));

  // Get dimensions
  console.log(`Design dimensions: ${img1.width}x${img1.height}`);
  console.log(`Deployed dimensions: ${img2.width}x${img2.height}`);

  // Images must match in width, but heights may differ
  if (img1.width !== img2.width) {
    console.error('ERROR: Image widths do not match!');
    return { passed: false, error: 'Width mismatch', width1: img1.width, width2: img2.width };
  }

  // Use the smaller height for comparison (footers may vary in height)
  const width = img1.width;
  const height = Math.min(img1.height, img2.height);

  console.log(`Comparing area: ${width}x${height} pixels`);
  if (img1.height !== img2.height) {
    console.log(`Note: Heights differ (design: ${img1.height}, deployed: ${img2.height})`);
    console.log(`Comparing the first ${height} pixels (overlapping area)`);
  }

  const diff = new PNG({ width, height });

  // Create buffers for the comparison area
  const img1Data = Buffer.alloc(width * height * 4);
  const img2Data = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const i1 = (y * img1.width + x) * 4;
      const i2 = (y * img2.width + x) * 4;

      img1Data[i] = img1.data[i1];
      img1Data[i + 1] = img1.data[i1 + 1];
      img1Data[i + 2] = img1.data[i1 + 2];
      img1Data[i + 3] = img1.data[i1 + 3];

      img2Data[i] = img2.data[i2];
      img2Data[i + 1] = img2.data[i2 + 1];
      img2Data[i + 2] = img2.data[i2 + 2];
      img2Data[i + 3] = img2.data[i2 + 3];
    }
  }

  const numDiffPixels = pixelmatch(
    img1Data,
    img2Data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const totalPixels = width * height;
  const matchPercent = ((totalPixels - numDiffPixels) / totalPixels * 100).toFixed(2);

  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  console.log('\n--- Results ---');
  console.log(`Total pixels: ${totalPixels.toLocaleString()}`);
  console.log(`Different pixels: ${numDiffPixels.toLocaleString()}`);
  console.log(`Match percentage: ${matchPercent}%`);
  console.log(`Diff image saved: ${diffPath}`);
  console.log(`Status: ${matchPercent >= 98 ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log('=================================\n');

  return {
    matchPercent: parseFloat(matchPercent),
    diffPixels: numDiffPixels,
    totalPixels,
    passed: matchPercent >= 98,
    threshold: 98
  };
}

async function main() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  const resultsDir = path.join(__dirname, 'results');

  const designRef = path.join(screenshotsDir, 'footer-design-reference.png');
  const deployed = path.join(screenshotsDir, 'footer-deployed-desktop-large.png');
  const diffOutput = path.join(screenshotsDir, 'footer-visual-diff.png');

  const result = await compareImages(designRef, deployed, diffOutput);

  // Save result to JSON
  const resultPath = path.join(resultsDir, 'visual-regression-result.json');
  fs.writeFileSync(resultPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    test: 'Footer Visual Regression',
    designReference: designRef,
    deployedImplementation: deployed,
    diffImage: diffOutput,
    ...result
  }, null, 2));

  console.log(`Result saved to: ${resultPath}`);

  process.exit(result.passed ? 0 : 1);
}

main().catch(console.error);
