import { ProcessingOptions } from '../utils/imageProcessing';
import { RotateCw, FlipHorizontal, FlipVertical, Crop, Maximize2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ControlPanelProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
  onReset: () => void;
  width: number;
  height: number;
}

function ResizeControls({
  currentWidth,
  currentHeight,
  onApply,
  onCancel
}: {
  currentWidth: number;
  currentHeight: number;
  onApply: (w: number, h: number) => void;
  onCancel: () => void;
}) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);


  // Update local state if props change (e.g. new image loaded)
  useEffect(() => {
    setWidth(currentWidth);
    setHeight(currentHeight);
  }, [currentWidth, currentHeight]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Resize Image</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Width: {width}px
          </label>
          <input
            type="range"
            min={Math.max(1, Math.round(currentWidth * 0.1))}
            max={Math.round(currentWidth * 2)}
            value={width}
            onChange={(e) => handleWidthChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Height: {height}px
          </label>
          <input
            type="range"
            min={Math.max(1, Math.round(currentHeight * 0.1))}
            max={Math.round(currentHeight * 2)}
            value={height}
            onChange={(e) => handleHeightChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onApply(width, height)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function ControlPanel({ options, onChange, onReset, width, height }: ControlPanelProps) {
  const [showResize, setShowResize] = useState(false);

  // Reset local UI state when image changes or global reset happens
  useEffect(() => {
    // If resize option is cleared externally, hide resize panel
    if (!options.resize) {
      setShowResize(false);
    }
  }, [options.resize]);
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

        <div className="border-t border-gray-200 pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
            <RefreshCw size={16} className="text-green-600" />
            Geometric Transformations
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChange({ ...options, rotation: ((options.rotation || 0) + 90) % 360 })}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-xs"
            >
              <RotateCw size={14} />
              Rotate 90°
            </button>

            <button
              onClick={() => onChange({ ...options, rotation: ((options.rotation || 0) + 180) % 360 })}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-xs"
            >
              <RotateCw size={14} />
              Rotate 180°
            </button>

            <button
              onClick={() => onChange({ ...options, flipHorizontal: !options.flipHorizontal })}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-xs"
            >
              <FlipHorizontal size={14} />
              Flip Horizontal
            </button>

            <button
              onClick={() => onChange({ ...options, flipVertical: !options.flipVertical })}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-xs"
            >
              <FlipVertical size={14} />
              Flip Vertical
            </button>

            <button
              onClick={() => onChange({ ...options, cropCenter: !options.cropCenter })}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-xs"
            >
              <Crop size={14} />
              Crop Center
            </button>

            <button
              onClick={() => setShowResize(!showResize)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-xs"
            >
              <Maximize2 size={14} />
              Resize
            </button>
          </div>

          {showResize && (
            <ResizeControls
              currentWidth={width}
              currentHeight={height}
              onApply={(w, h) => {
                onChange({ ...options, resize: { width: w, height: h } });
              }}
              onCancel={() => {
                setShowResize(false);
                onChange({ ...options, resize: null });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}


