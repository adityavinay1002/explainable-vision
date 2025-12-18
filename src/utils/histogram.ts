export interface HistogramData {
  red?: number[];
  green?: number[];
  blue?: number[];
  gray?: number[];
}

export function computeHistogram(mat: any): HistogramData {
  const cv = window.cv;
  const histData: HistogramData = {};

  if (mat.channels() === 1) {
    const hist = new cv.Mat();
    const mask = new cv.Mat();
    const mv = new cv.MatVector();
    mv.push_back(mat);
    cv.calcHist(
      mv,
      [0],
      mask,
      hist,
      [256],
      [0, 256]
    );

    const grayData: number[] = [];
    for (let i = 0; i < 256; i++) {
      grayData.push(hist.data32F[i]);
    }
    histData.gray = grayData;

    hist.delete();
    mask.delete();
    mv.delete();
  } else if (mat.channels() >= 3) {
    const channels = new cv.MatVector();
    cv.split(mat, channels);

    const mask = new cv.Mat();
    const colors = ['red', 'green', 'blue'];

    for (let i = 0; i < Math.min(3, mat.channels()); i++) {
      const hist = new cv.Mat();
      const channel = channels.get(i);
      const mv = new cv.MatVector();
      mv.push_back(channel);

      cv.calcHist(
        mv,
        [0],
        mask,
        hist,
        [256],
        [0, 256]
      );

      const colorData: number[] = [];
      for (let j = 0; j < 256; j++) {
        colorData.push(hist.data32F[j]);
      }
      histData[colors[i] as keyof HistogramData] = colorData;

      hist.delete();
      channel.delete();
      mv.delete();
    }

    mask.delete();
    channels.delete();
  }

  return histData;
}

export function normalizeHistogram(histData: number[]): number[] {
  const max = Math.max(...histData);
  if (max === 0) return histData;
  return histData.map(val => val / max);
}
