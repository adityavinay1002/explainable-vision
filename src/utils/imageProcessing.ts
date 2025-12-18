export interface ProcessingOptions {
  grayscale?: boolean;
  histogramEqualization?: boolean;
  clahe?: boolean;
  claheClipLimit?: number;
  claheTileSize?: number;
  colorClahe?: boolean;
  gaussianBlur?: boolean;
  gaussianKernelSize?: number;
  averageBlur?: boolean;
  averageKernelSize?: number;
  sharpen?: boolean;
  sobelEdges?: boolean;
  cannyEdges?: boolean;
  cannyThreshold1?: number;
  cannyThreshold2?: number;
}

export function loadImageToMat(imageElement: HTMLImageElement): any {
  const cv = window.cv;

  // Draw the image onto an offscreen canvas to ensure consistent reading
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth || imageElement.width;
  canvas.height = imageElement.naturalHeight || imageElement.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context for image loading');
  }
  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  // Read into an RGBA Mat first
  const matRGBA = cv.imread(canvas);

  // Convert to 3-channel RGB for consistency across processing routines
  let matRGB: any;
  if (matRGBA.channels() === 4) {
    matRGB = new cv.Mat();
    cv.cvtColor(matRGBA, matRGB, cv.COLOR_RGBA2RGB);
    matRGBA.delete();
  } else {
    matRGB = matRGBA;
  }

  return matRGB;
}

export function convertToGrayscale(src: any): any {
  const cv = window.cv;
  const gray = new cv.Mat();
  if (src.channels() === 4) {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  } else if (src.channels() === 3) {
    cv.cvtColor(src, gray, cv.COLOR_RGB2GRAY);
  } else {
    src.copyTo(gray);
  }
  return gray;
}

export function applyHistogramEqualization(src: any): any {
  const cv = window.cv;
  const result = new cv.Mat();
  cv.equalizeHist(src, result);
  return result;
}

export function applyCLAHE(src: any, clipLimit: number = 2.0, tileSize: number = 8): any {
  const cv = window.cv;
  const result = new cv.Mat();

  // Feature-detect CLAHE in the OpenCV.js build
  const hasCreate = typeof cv.createCLAHE === 'function';
  const hasCtor = typeof (cv as any).CLAHE === 'function';

  if (hasCreate) {
    const clahe = cv.createCLAHE(clipLimit, new cv.Size(tileSize, tileSize));
    try {
      clahe.apply(src, result);
    } finally {
      try { if (typeof clahe.delete === 'function') clahe.delete(); } catch (e) { }
    }
    return result;
  }

  if (hasCtor) {
    // Some builds expose a constructor; try to use it safely
    let clahe: any = null;
    try {
      clahe = new (cv as any).CLAHE(clipLimit, new cv.Size(tileSize, tileSize));
      clahe.apply(src, result);
    } catch (e) {
      // fall through to fallback below
    } finally {
      try { if (clahe && typeof clahe.delete === 'function') clahe.delete(); } catch (e) { }
    }

    if (result && result.rows && result.cols) return result;
  }

  // Fallback: if CLAHE not available, use global histogram equalization for grayscale
  if (src.channels && src.channels() === 1) {
    cv.equalizeHist(src, result);
    return result;
  }

  // If color image, perform per-channel histogram equalization
  const channels = new cv.MatVector();
  cv.split(src, channels);
  const outChannels = new cv.MatVector();
  try {
    for (let i = 0; i < channels.size(); i++) {
      const ch = channels.get(i);
      const eq = new cv.Mat();
      try {
        cv.equalizeHist(ch, eq);
        outChannels.push_back(eq);
      } finally {
        ch.delete();
        // eq is now owned by outChannels
      }
    }
    cv.merge(outChannels, result);
  } finally {
    outChannels.delete();
    channels.delete();
  }

  return result;
}

export function applyCLAHEToColor(src: any, clipLimit: number = 2.0, tileSize: number = 8): any {
  const cv = window.cv;
  // Use YCrCb approach (apply CLAHE to luminance channel) — matches Python reference
  const ycrcb = new cv.Mat();
  cv.cvtColor(src, ycrcb, cv.COLOR_RGB2YCrCb);

  const channels = new cv.MatVector();
  cv.split(ycrcb, channels);

  const yChannel = channels.get(0);

  // Feature detect CLAHE
  const hasCreate = typeof cv.createCLAHE === 'function';
  const hasCtor = typeof (cv as any).CLAHE === 'function';

  const enhancedY = new cv.Mat();
  let usedClahe = false;
  if (hasCreate) {
    const clahe = cv.createCLAHE(clipLimit, new cv.Size(tileSize, tileSize));
    try {
      clahe.apply(yChannel, enhancedY);
      usedClahe = true;
    } finally {
      try { if (typeof clahe.delete === 'function') clahe.delete(); } catch (e) {}
    }
  } else if (hasCtor) {
    let clahe: any = null;
    try {
      clahe = new (cv as any).CLAHE(clipLimit, new cv.Size(tileSize, tileSize));
      clahe.apply(yChannel, enhancedY);
      usedClahe = true;
    } catch (e) {
      // fallback below
    } finally {
      try { if (clahe && typeof clahe.delete === 'function') clahe.delete(); } catch (e) {}
    }
  }

  let result = new cv.Mat();
  if (usedClahe) {
    channels.set(0, enhancedY);
    const merged = new cv.Mat();
    cv.merge(channels, merged);
    cv.cvtColor(merged, result, cv.COLOR_YCrCb2RGB);
    merged.delete();
  } else {
    // fallback: equalize Y channel
    const equalizedY = new cv.Mat();
    cv.equalizeHist(yChannel, equalizedY);
    channels.set(0, equalizedY);
    const merged = new cv.Mat();
    cv.merge(channels, merged);
    cv.cvtColor(merged, result, cv.COLOR_YCrCb2RGB);
    equalizedY.delete();
    merged.delete();
  }

  // cleanup
  yChannel.delete();
  enhancedY.delete();
  channels.delete();
  ycrcb.delete();

  return result;
}

export function applyGaussianBlur(src: any, kernelSize: number = 5): any {
  const cv = window.cv;
  const result = new cv.Mat();
  const ksize = new cv.Size(kernelSize, kernelSize);
  cv.GaussianBlur(src, result, ksize, 0, 0, cv.BORDER_DEFAULT);
  return result;
}

export function applyAverageBlur(src: any, kernelSize: number = 5): any {
  const cv = window.cv;
  const result = new cv.Mat();
  const ksize = new cv.Size(kernelSize, kernelSize);
  cv.blur(src, result, ksize);
  return result;
}

export function applySharpen(src: any): any {
  const cv = window.cv;
  const kernel = cv.matFromArray(3, 3, cv.CV_32F, [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ]);
  const result = new cv.Mat();
  cv.filter2D(src, result, cv.CV_8U, kernel);
  kernel.delete();
  return result;
}

export function applySobelEdges(src: any): any {
  const cv = window.cv;
  const gray = src.channels() === 1 ? src : convertToGrayscale(src);

  const gradX = new cv.Mat();
  const gradY = new cv.Mat();
  const absGradX = new cv.Mat();
  const absGradY = new cv.Mat();
  const result = new cv.Mat();

  cv.Sobel(gray, gradX, cv.CV_16S, 1, 0, 3);
  cv.Sobel(gray, gradY, cv.CV_16S, 0, 1, 3);

  cv.convertScaleAbs(gradX, absGradX);
  cv.convertScaleAbs(gradY, absGradY);

  cv.addWeighted(absGradX, 0.5, absGradY, 0.5, 0, result);

  if (src.channels() !== 1) {
    gray.delete();
  }
  gradX.delete();
  gradY.delete();
  absGradX.delete();
  absGradY.delete();

  return result;
}

export function applyCannyEdges(src: any, threshold1: number = 50, threshold2: number = 150): any {
  const cv = window.cv;
  const gray = src.channels() === 1 ? src : convertToGrayscale(src);
  const result = new cv.Mat();

  cv.Canny(gray, result, threshold1, threshold2);

  if (src.channels() !== 1) {
    gray.delete();
  }

  return result;
}

export function processImage(
  src: any,
  options: ProcessingOptions
): any {
  const cv = window.cv;
  let result = new cv.Mat();
  src.copyTo(result);
  // Priority and mode handling for histogram/CLAHE options:
  // 1) colorClahe (applies to color images in luminance/chrominance space, YCrCb)
  // 2) clahe (grayscale CLAHE)
  // 3) histogramEqualization (global, grayscale)
  if (options.colorClahe) {
    // Ensure we operate on a color image
    if (result.channels() === 1) {
      const color = new cv.Mat();
      cv.cvtColor(result, color, cv.COLOR_GRAY2RGB);
      result.delete();
      result = color;
    }

    const temp = applyCLAHEToColor(result, options.claheClipLimit || 2.0, options.claheTileSize || 8);
    result.delete();
    result = temp;
  } else if (options.clahe) {
    // Work in grayscale for CLAHE
    if (result.channels() > 1) {
      const gray = convertToGrayscale(result);
      result.delete();
      result = gray;
    }

    const temp = applyCLAHE(result, options.claheClipLimit || 2.0, options.claheTileSize || 8);
    result.delete();
    result = temp;
  } else if (options.histogramEqualization) {
    // Work in grayscale for global equalization
    if (result.channels() > 1) {
      const gray = convertToGrayscale(result);
      result.delete();
      result = gray;
    }

    const temp = applyHistogramEqualization(result);
    result.delete();
    result = temp;
  } else if (options.grayscale) {
    // If user only requested grayscale conversion
    if (result.channels() > 1) {
      const temp = convertToGrayscale(result);
      result.delete();
      result = temp;
    }
  }

  if (options.gaussianBlur) {
    const temp = applyGaussianBlur(result, options.gaussianKernelSize || 5);
    result.delete();
    result = temp;
  }

  if (options.averageBlur) {
    const temp = applyAverageBlur(result, options.averageKernelSize || 5);
    result.delete();
    result = temp;
  }

  if (options.sharpen) {
    const temp = applySharpen(result);
    result.delete();
    result = temp;
  }

  if (options.sobelEdges) {
    const temp = applySobelEdges(result);
    result.delete();
    result = temp;
  }

  if (options.cannyEdges) {
    const temp = applyCannyEdges(
      result,
      options.cannyThreshold1 || 50,
      options.cannyThreshold2 || 150
    );
    result.delete();
    result = temp;
  }

  return result;
}

export function matToCanvas(mat: any, canvas: HTMLCanvasElement): void {
  const cv = window.cv;
  cv.imshow(canvas, mat);
}

export function cleanupMat(...mats: any[]): void {
  mats.forEach(mat => {
    try {
      if (!mat) return;
      // If isDeleted exists use it, otherwise attempt delete safely
      if (typeof mat.isDeleted === 'function') {
        if (!mat.isDeleted()) mat.delete();
      } else if (typeof mat.delete === 'function') {
        mat.delete();
      }
    } catch (e) {
      // ignore deletion errors
    }
  });
}
