import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs';

export interface VisualComparisonResult {
  match: boolean;
  matchPercentage: number;
  diffPixels: number;
  totalPixels: number;
  diffImagePath: string;
}

/**
 * Compare two images pixel-by-pixel using pixelmatch
 * @param image1Path Path to first image
 * @param image2Path Path to second image
 * @param diffOutputPath Path to save diff image
 * @param threshold Matching threshold (0-1), default 0.1
 * @returns Comparison result
 */
export function compareImages(
  image1Path: string,
  image2Path: string,
  diffOutputPath: string,
  threshold: number = 0.1
): VisualComparisonResult {
  // Read images
  const img1 = PNG.sync.read(fs.readFileSync(image1Path));
  const img2 = PNG.sync.read(fs.readFileSync(image2Path));

  const { width, height } = img1;
  const totalPixels = width * height;

  // Ensure images are same size
  if (img2.width !== width || img2.height !== height) {
    throw new Error(
      `Image dimensions don't match: ${width}x${height} vs ${img2.width}x${img2.height}`
    );
  }

  // Create diff image
  const diff = new PNG({ width, height });

  // Run pixelmatch comparison
  const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold,
  });

  // Calculate match percentage
  const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;

  // Save diff image
  fs.writeFileSync(diffOutputPath, PNG.sync.write(diff));

  return {
    match: matchPercentage >= 98, // Pass if 98% or higher match
    matchPercentage: parseFloat(matchPercentage.toFixed(2)),
    diffPixels,
    totalPixels,
    diffImagePath: diffOutputPath,
  };
}
