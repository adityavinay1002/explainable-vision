import { ProcessingOptions } from '../utils/imageProcessing';

interface ControlPanelProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
  onReset: () => void;
}

export function ControlPanel({ options, onChange, onReset }: ControlPanelProps) {
  const updateOption = <K extends keyof ProcessingOptions>(
    key: K,
    value: ProcessingOptions[K]
  ) => {
    // Enforce mutually exclusive behavior between histogramEqualization, clahe, and colorClahe
    const newOptions = { ...options, [key]: value } as ProcessingOptions;

    if (key === 'colorClahe' && value === true) {
      newOptions.clahe = false;
      newOptions.histogramEqualization = false;
      newOptions.grayscale = false;
    }

    if (key === 'clahe' && value === true) {
      newOptions.histogramEqualization = false;
      newOptions.colorClahe = false;
      // clahe operates on grayscale; ensure grayscale flag is set for clarity
      newOptions.grayscale = true;
    }

    if (key === 'histogramEqualization' && value === true) {
      newOptions.clahe = false;
      newOptions.colorClahe = false;
      newOptions.grayscale = true;
    }

    if (key === 'grayscale' && value === true) {
      // when enabling grayscale explicitly, prefer grayscale CLAHE/histeq
      // but do not auto-toggle other modes
    }

    // Clamp tile size when updated
    if (key === 'claheTileSize') {
      const v = Number(value || 8);
      const clamped = Math.max(4, Math.min(16, Math.floor(v)));
      newOptions.claheTileSize = clamped;
    }

    onChange(newOptions);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Image Processing Controls</h2>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Transformations</h3>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.grayscale || false}
              onChange={(e) => updateOption('grayscale', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Convert to Grayscale</span>
          </label>
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Histogram Enhancement</h3>

          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={options.histogramEqualization || false}
              onChange={(e) => updateOption('histogramEqualization', e.target.checked)}
              className="w-4 h-4"
              disabled={!options.grayscale}
            />
            <span className="text-sm text-gray-700">Histogram Equalization (grayscale only)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={options.clahe || false}
              onChange={(e) => updateOption('clahe', e.target.checked)}
              className="w-4 h-4"
              disabled={!options.grayscale}
            />
            <span className="text-sm text-gray-700">CLAHE (grayscale only)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={options.colorClahe || false}
              onChange={(e) => updateOption('colorClahe', e.target.checked)}
              className="w-4 h-4"
              disabled={options.grayscale}
            />
            <span className="text-sm text-gray-700">CLAHE (color image)</span>
          </label>

          {(options.clahe || options.colorClahe) && (
            <div className="ml-6 space-y-3 mt-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Clip Limit: {options.claheClipLimit?.toFixed(1) || 2.0}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={options.claheClipLimit || 2.0}
                  onChange={(e) => updateOption('claheClipLimit', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Tile Size: {options.claheTileSize || 8}
                </label>
                <input
                  type="range"
                  min="4"
                  max="16"
                  step="4"
                  value={options.claheTileSize || 8}
                  onChange={(e) => updateOption('claheTileSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Smoothing Filters</h3>

          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={options.gaussianBlur || false}
              onChange={(e) => updateOption('gaussianBlur', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Gaussian Blur</span>
          </label>

          {options.gaussianBlur && (
            <div className="ml-6 mb-3">
              <label className="block text-xs text-gray-600 mb-1">
                Kernel Size: {options.gaussianKernelSize || 5}
              </label>
              <input
                type="range"
                min="3"
                max="15"
                step="2"
                value={options.gaussianKernelSize || 5}
                onChange={(e) => updateOption('gaussianKernelSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={options.averageBlur || false}
              onChange={(e) => updateOption('averageBlur', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Average Blur</span>
          </label>

          {options.averageBlur && (
            <div className="ml-6">
              <label className="block text-xs text-gray-600 mb-1">
                Kernel Size: {options.averageKernelSize || 5}
              </label>
              <input
                type="range"
                min="3"
                max="15"
                step="2"
                value={options.averageKernelSize || 5}
                onChange={(e) => updateOption('averageKernelSize', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Sharpening</h3>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.sharpen || false}
              onChange={(e) => updateOption('sharpen', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Sharpen Image</span>
          </label>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Edge Detection</h3>

          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={options.sobelEdges || false}
              onChange={(e) => updateOption('sobelEdges', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Sobel Edge Detection</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={options.cannyEdges || false}
              onChange={(e) => updateOption('cannyEdges', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Canny Edge Detection</span>
          </label>

          {options.cannyEdges && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Lower Threshold: {options.cannyThreshold1 || 50}
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="10"
                  value={options.cannyThreshold1 || 50}
                  onChange={(e) => updateOption('cannyThreshold1', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Upper Threshold: {options.cannyThreshold2 || 150}
                </label>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="10"
                  value={options.cannyThreshold2 || 150}
                  onChange={(e) => updateOption('cannyThreshold2', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
