export interface RGB {
  r: number;
  g: number;
  b: number;
}

function colorDistance(c1: RGB, c2: RGB) {
  // Simple Euclidean distance in RGB space
  // For better visual results, one could use LAB color space, but RGB is fast and decent for this use case.
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

export function quantizeColors(imageData: ImageData, colorCount: number) {
  const pixels = imageData.data;
  const colors: RGB[] = [];

  // Extract all non-transparent colors
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    colors.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
  }

  if (colors.length === 0) {
    return { quantizedData: imageData, palette: [] };
  }

  // Initialize centroids randomly from existing colors
  const centroids: RGB[] = [];
  for (let i = 0; i < colorCount; i++) {
    centroids.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  const maxIterations = 10;
  const assignments = new Int32Array(colors.length);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign pixels to nearest centroid
    for (let i = 0; i < colors.length; i++) {
      let minDist = Infinity;
      let bestCentroid = 0;
      for (let j = 0; j < centroids.length; j++) {
        const dist = colorDistance(colors[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          bestCentroid = j;
        }
      }
      assignments[i] = bestCentroid;
    }

    // Update centroids
    const newCentroids = Array.from({ length: colorCount }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < colors.length; i++) {
      const c = assignments[i];
      newCentroids[c].r += colors[i].r;
      newCentroids[c].g += colors[i].g;
      newCentroids[c].b += colors[i].b;
      newCentroids[c].count++;
    }

    let changed = false;
    for (let j = 0; j < colorCount; j++) {
      if (newCentroids[j].count > 0) {
        const nr = Math.round(newCentroids[j].r / newCentroids[j].count);
        const ng = Math.round(newCentroids[j].g / newCentroids[j].count);
        const nb = Math.round(newCentroids[j].b / newCentroids[j].count);
        if (centroids[j].r !== nr || centroids[j].g !== ng || centroids[j].b !== nb) {
          changed = true;
        }
        centroids[j] = { r: nr, g: ng, b: nb };
      }
    }
    if (!changed) break;
  }

  // Apply quantized colors back to imageData
  const newImageData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const newPixels = newImageData.data;
  const paletteMap = new Map<string, { r: number; g: number; b: number; count: number }>();

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue; // Keep transparent

    const c = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
    let minDist = Infinity;
    let bestCentroid = centroids[0];
    for (let j = 0; j < centroids.length; j++) {
      const dist = colorDistance(c, centroids[j]);
      if (dist < minDist) {
        minDist = dist;
        bestCentroid = centroids[j];
      }
    }

    newPixels[i] = bestCentroid.r;
    newPixels[i + 1] = bestCentroid.g;
    newPixels[i + 2] = bestCentroid.b;
    newPixels[i + 3] = pixels[i + 3]; // Keep original alpha

    const key = `${bestCentroid.r},${bestCentroid.g},${bestCentroid.b}`;
    if (paletteMap.has(key)) {
      paletteMap.get(key)!.count++;
    } else {
      paletteMap.set(key, { r: bestCentroid.r, g: bestCentroid.g, b: bestCentroid.b, count: 1 });
    }
  }

  const palette = Array.from(paletteMap.values()).sort((a, b) => b.count - a.count);

  return { quantizedData: newImageData, palette };
}
