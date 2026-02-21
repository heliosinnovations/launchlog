/**
 * Visual Regression Test
 * Compares the deployed implementation to the design reference
 */

const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

// Read images
const designImg = PNG.sync.read(fs.readFileSync('/workspace/launchlog/test-results/design-reference.png'));
const implImg = PNG.sync.read(fs.readFileSync('/workspace/launchlog/test-results/implementation.png'));

// Ensure images are same size
if (designImg.width !== implImg.width || designImg.height !== implImg.height) {
  console.log(`❌ Image size mismatch: Design ${designImg.width}x${designImg.height} vs Implementation ${implImg.width}x${implImg.height}`);
  console.log(`Resizing to match for comparison...`);

  // Use the smaller dimensions for comparison
  const width = Math.min(designImg.width, implImg.width);
  const height = Math.min(designImg.height, implImg.height);

  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    designImg.data,
    implImg.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const matchPercent = ((width * height - numDiffPixels) / (width * height) * 100).toFixed(2);

  fs.writeFileSync('/workspace/launchlog/test-results/diff.png', PNG.sync.write(diff));

  console.log(`\n📊 Visual Regression Results:`);
  console.log(`   Match: ${matchPercent}%`);
  console.log(`   Diff pixels: ${numDiffPixels}`);
  console.log(`   Threshold: 98%`);
  console.log(`   Diff image: test-results/diff.png`);

  if (parseFloat(matchPercent) >= 98) {
    console.log(`\n✅ PASS - Visual regression test passed`);
    process.exit(0);
  } else {
    console.log(`\n❌ FAIL - Visual regression test failed`);
    process.exit(1);
  }
} else {
  const { width, height } = designImg;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    designImg.data,
    implImg.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  const matchPercent = ((width * height - numDiffPixels) / (width * height) * 100).toFixed(2);

  fs.writeFileSync('/workspace/launchlog/test-results/diff.png', PNG.sync.write(diff));

  console.log(`\n📊 Visual Regression Results:`);
  console.log(`   Match: ${matchPercent}%`);
  console.log(`   Diff pixels: ${numDiffPixels}`);
  console.log(`   Threshold: 98%`);
  console.log(`   Diff image: test-results/diff.png`);

  if (parseFloat(matchPercent) >= 98) {
    console.log(`\n✅ PASS - Visual regression test passed`);
    process.exit(0);
  } else {
    console.log(`\n❌ FAIL - Visual regression test failed`);
    process.exit(1);
  }
}
