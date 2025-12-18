import { useState, useRef, useEffect } from 'react';
import { Upload, Eye, BookOpen } from 'lucide-react';
import { useOpenCV } from './hooks/useOpenCV';
import { ImageCanvas } from './components/ImageCanvas';
import { HistogramChart } from './components/HistogramChart';
import { ControlPanel } from './components/ControlPanel';
import { ExplainMode } from './components/ExplainMode';
import {
  loadImageToMat,
  processImage,
  cleanupMat,
  ProcessingOptions,
} from './utils/imageProcessing';
import { computeHistogram } from './utils/histogram';

type AppMode = 'explore' | 'explain';

function App() {
  const { loaded: cvLoaded, error: cvError } = useOpenCV();
  const [appError, setAppError] = useState<string | null>(null);
  const [mode, setMode] = useState<AppMode>('explore');
  const [originalMat, setOriginalMat] = useState<any>(null);
  const [processedMat, setProcessedMat] = useState<any>(null);
  const [originalHistogram, setOriginalHistogram] = useState<any>(null);
  const [processedHistogram, setProcessedHistogram] = useState<any>(null);
  const [options, setOptions] = useState<ProcessingOptions>({
    grayscale: false,
    histogramEqualization: false,
    clahe: false,
    claheClipLimit: 2.0,
    claheTileSize: 8,
    colorClahe: false,
    gaussianBlur: false,
    gaussianKernelSize: 5,
    averageBlur: false,
    averageKernelSize: 5,
    sharpen: false,
    sobelEdges: false,
    cannyEdges: false,
    cannyThreshold1: 50,
    cannyThreshold2: 150,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!cvLoaded || !originalMat) return;

    if (processedMat) {
      cleanupMat(processedMat);
    }

    try {
      const processed = processImage(originalMat, options);
      setProcessedMat(processed);

      const procHist = computeHistogram(processed);
      setProcessedHistogram(procHist);
      setAppError(null);
    } catch (e: any) {
      setAppError(e?.message || String(e));
    }
  }, [cvLoaded, originalMat, options]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!cvLoaded) {
          setAppError('OpenCV.js not loaded yet. Wait a moment and try again.');
          return;
        }

        try {
          if (originalMat) {
            cleanupMat(originalMat);
          }
          if (processedMat) {
            cleanupMat(processedMat);
          }

          const mat = loadImageToMat(img);
          console.log('Loaded Mat:', { cols: mat.cols, rows: mat.rows, channels: mat.channels ? mat.channels() : 'unknown' });
          setOriginalMat(mat);

          const processed = processImage(mat, options);
          console.log('Processed Mat:', { cols: processed.cols, rows: processed.rows, channels: processed.channels ? processed.channels() : 'unknown' });
          setProcessedMat(processed);

          const origHist = computeHistogram(mat);
          const procHist = computeHistogram(processed);
          setOriginalHistogram(origHist);
          setProcessedHistogram(procHist);
          setAppError(null);
        } catch (e: any) {
          setAppError(e?.message || String(e));
        }
      };
      img.src = e.target?.result as string;
      if (imageRef.current) {
        imageRef.current.src = e.target?.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const processFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!cvLoaded) {
          setAppError('OpenCV.js not loaded yet. Wait a moment and try again.');
          return;
        }

        try {
          if (originalMat) {
            cleanupMat(originalMat);
          }
          if (processedMat) {
            cleanupMat(processedMat);
          }

          const mat = loadImageToMat(img);
          console.log('Loaded Mat:', { cols: mat.cols, rows: mat.rows, channels: mat.channels ? mat.channels() : 'unknown' });
          setOriginalMat(mat);

          const processed = processImage(mat, options);
          console.log('Processed Mat:', { cols: processed.cols, rows: processed.rows, channels: processed.channels ? processed.channels() : 'unknown' });
          setProcessedMat(processed);

          const origHist = computeHistogram(mat);
          const procHist = computeHistogram(processed);
          setOriginalHistogram(origHist);
          setProcessedHistogram(procHist);
          setAppError(null);
        } catch (e: any) {
          setAppError(e?.message || String(e));
        }
      };
      img.src = e.target?.result as string;
      if (imageRef.current) {
        imageRef.current.src = e.target?.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] || null;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleReset = () => {
    setOptions({
      grayscale: false,
      histogramEqualization: false,
      clahe: false,
      claheClipLimit: 2.0,
      claheTileSize: 8,
      colorClahe: false,
      gaussianBlur: false,
      gaussianKernelSize: 5,
      averageBlur: false,
      averageKernelSize: 5,
      sharpen: false,
      sobelEdges: false,
      cannyEdges: false,
      cannyThreshold1: 50,
      cannyThreshold2: 150,
    });
  };

  if (!cvLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading OpenCV.js...</p>
          {cvError && (
            <p className="text-sm text-red-600 mt-3">{cvError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Explainable Vision</h1>
              <p className="text-sm text-gray-600 mt-1">
                Interactive Computer Vision Learning Tool
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('explore')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  mode === 'explore'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-gray-700 hover:bg-green-700'
                }`}
              >
                <Eye size={18} />
                Explore Mode
              </button>
              <button
                onClick={() => setMode('explain')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  mode === 'explain'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-gray-700 hover:bg-green-700'
                }`}
                disabled={!originalMat}
              >
                <BookOpen size={18} />
                Explain Mode
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {appError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {appError}
          </div>
        )}
        {!originalMat ? (
          <div className="text-center py-20">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`upload-box bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 max-w-md mx-auto ${dragActive ? 'drag-active' : ''}`}
            >
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                Upload or Drop an Image
              </h2>
              <p className="text-gray-300 mb-6">
                Drop an image onto the box, or click to choose one from your files.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Choose Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Image loaded successfully</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Load Different Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {mode === 'explore' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {originalMat && (
                      <ImageCanvas mat={originalMat} title="Original Image" />
                    )}
                    {processedMat && (
                      <ImageCanvas
                        mat={processedMat}
                        title="Processed Image"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {originalHistogram && (
                      <HistogramChart
                        histData={originalHistogram}
                        title="Original Histogram"
                      />
                    )}
                    {processedHistogram && (
                      <HistogramChart
                        histData={processedHistogram}
                        title="Processed Histogram"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <ControlPanel
                    options={options}
                    onChange={setOptions}
                    onReset={handleReset}
                  />
                </div>
              </div>
            ) : (
              <ExplainMode
                originalMat={originalMat}
                claheClipLimit={options.claheClipLimit || 2.0}
                claheTileSize={options.claheTileSize || 8}
              />
            )}
          </div>
        )}
      </main>

      <img ref={imageRef} alt="" className="hidden" />
    </div>
  );
}

export default App;
