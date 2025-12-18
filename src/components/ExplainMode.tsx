import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageCanvas } from './ImageCanvas';
import { HistogramChart } from './HistogramChart';
import {
  convertToGrayscale,
  applyHistogramEqualization,
  applyCLAHE,
  applyCLAHEToColor,
  cleanupMat,
} from '../utils/imageProcessing';
import { computeHistogram } from '../utils/histogram';

interface Step {
  title: string;
  description: string;
  mat: any;
  histogram?: any;
  showTileGrid?: boolean;
  tileSize?: number;
}

interface ExplainModeProps {
  originalMat: any;
  claheClipLimit: number;
  claheTileSize: number;
}

export function ExplainMode({ originalMat, claheClipLimit, claheTileSize }: ExplainModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const matsRef = useRef<any[]>([]);

  const steps: Step[] = useMemo(() => {
    if (!originalMat) return [];
    try {
      const cv = (window as any).cv;
      if (!cv) return [];

      // Cleanup any previous mats we stored before building new steps
      try {
        cleanupMat(...matsRef.current);
      } catch (e) {
        // ignore
      }
      matsRef.current = [];

      const stepsArray: Step[] = [];

      const original = new cv.Mat();
      originalMat.copyTo(original);
      // track mat for cleanup later
      matsRef.current.push(original);

      stepsArray.push({
      title: 'Step 1: Original Image',
      description:
        'This is your original input image. We will apply a series of enhancement techniques to improve its contrast and visibility.',
      mat: original,
      histogram: computeHistogram(original),
    });

    const gray = convertToGrayscale(original);
    matsRef.current.push(gray);
    stepsArray.push({
      title: 'Step 2: Grayscale Conversion',
      description:
        'Converting to grayscale simplifies the image from 3 color channels (RGB) to a single intensity channel. This reduces computational complexity and allows us to focus on luminance information.',
      mat: gray,
      histogram: computeHistogram(gray),
    });

    const histogramVisualization = {
      title: 'Step 3: Histogram Analysis',
      description:
        'The histogram shows the distribution of pixel intensities. A well-distributed histogram typically indicates good contrast. Concentrated peaks suggest limited dynamic range.',
      mat: gray,
      histogram: computeHistogram(gray),
    };
    stepsArray.push(histogramVisualization);

    const equalized = applyHistogramEqualization(gray);
    matsRef.current.push(equalized);
    stepsArray.push({
      title: 'Step 4: Histogram Equalization',
      description:
        'Histogram equalization spreads out the pixel intensities across the full range (0-255). This global technique enhances overall contrast but may over-amplify noise in uniform regions.',
      mat: equalized,
      histogram: computeHistogram(equalized),
    });

    // Clamp tile count and compute pixel tile size safely
    const safeTileCount = Math.max(1, Math.floor(claheTileSize || 8));
    const claheResult = applyCLAHE(gray, claheClipLimit, safeTileCount);
    matsRef.current.push(claheResult);
    const pixelTileSize = original.cols && safeTileCount > 0 ? Math.max(4, Math.floor(original.cols / safeTileCount)) : 8;

    stepsArray.push({
      title: 'Step 5: CLAHE (Contrast Limited Adaptive Histogram Equalization)',
      description: `CLAHE divides the image into ${claheTileSize}x${claheTileSize} tiles and applies histogram equalization locally to each tile. The clip limit (${claheClipLimit}) prevents over-amplification of noise. This adaptive approach preserves local detail better than global equalization.`,
      mat: claheResult,
      histogram: computeHistogram(claheResult),
      // tile overlay intentionally omitted: no tile grid boxes shown on image
    });

    let finalEnhanced: any;
    try {
      if (original.channels() >= 3) {
        finalEnhanced = applyCLAHEToColor(original, claheClipLimit, claheTileSize);
        matsRef.current.push(finalEnhanced);
      } else {
        finalEnhanced = new cv.Mat();
        claheResult.copyTo(finalEnhanced);
        matsRef.current.push(finalEnhanced);
      }
    } catch (e) {
      console.error('ExplainMode final enhancement error', e);
      finalEnhanced = new cv.Mat();
      // fallback: copy original
      original.copyTo(finalEnhanced);
      matsRef.current.push(finalEnhanced);
    }

    stepsArray.push({
      title: 'Step 6: Final Enhanced Image',
      description:
        'The final result applies CLAHE to the color image (in YCrCb color space to preserve luminance while keeping colors stable). This produces an enhanced image with improved local contrast while maintaining natural colors.',

      mat: finalEnhanced,
      histogram: computeHistogram(finalEnhanced),
    });

    return stepsArray;
    } catch (e) {
      console.error('ExplainMode build steps error', e);
      return [];
    }
  }, [originalMat, claheClipLimit, claheTileSize]);

  // cleanup mats on unmount only (we manage per-build cleanup in useMemo above)
  useEffect(() => {
    return () => {
      try {
        cleanupMat(...matsRef.current);
      } catch (e) {
        // ignore
      }
      matsRef.current = [];
    };
  }, []);

  // Create a safe display copy for the current step to avoid rendering mats
  // that might be deleted elsewhere. We keep the display copy in a ref
  // and recreate it when `steps` or `currentStep` changes.
  const displayRef = useRef<any>(null);
  useEffect(() => {
    const cv = (window as any).cv;
    try {
      if (displayRef.current) {
        cleanupMat(displayRef.current);
        displayRef.current = null;
      }

      if (!steps || steps.length === 0) return;

      const src = steps[currentStep]?.mat;
      if (!src) return;

      const copy = new cv.Mat();
      src.copyTo(copy);
      displayRef.current = copy;
    } catch (e) {
      console.error('ExplainMode display copy failed', e);
      try { if (displayRef.current) { cleanupMat(displayRef.current); displayRef.current = null; } } catch (ee) {}
    }

    return () => {
      try { if (displayRef.current) { cleanupMat(displayRef.current); displayRef.current = null; } } catch (e) {}
    };
  }, [steps, currentStep]);

  // Ensure currentStep remains in bounds when steps change
  useEffect(() => {
    if (steps.length === 0) {
      setCurrentStep(0);
      return;
    }
    if (currentStep < 0) setCurrentStep(0);
    else if (currentStep >= steps.length) setCurrentStep(steps.length - 1);
  }, [steps, currentStep]);

  if (steps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Load an image to see the step-by-step explanation
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Explain Mode: Image Enhancement Pipeline
        </h2>
        <div className="text-sm text-gray-600">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={goToPrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-green-700 disabled:bg-blue-600 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
          Previous
        </button>
        <button
          onClick={goToNext}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-green-700 disabled:bg-blue-600 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentStep}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="space-y-4"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-blue-800">{currentStepData.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ImageCanvas
              mat={displayRef.current || currentStepData.mat}
              title="Processed Image"
            />
            {currentStepData.histogram && (
              <HistogramChart histData={currentStepData.histogram} title="Histogram" />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-2 mt-6">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentStep ? 1 : -1);
              setCurrentStep(index);
            }}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentStep ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
