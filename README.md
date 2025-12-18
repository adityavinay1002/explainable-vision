# Explainable Vision

An interactive browser-based computer vision learning tool that demonstrates classical image processing techniques with real-time visualization and step-by-step explanations.

## Purpose and Learning Goals

**Explainable Vision** bridges the gap between theory and practice in computer vision by providing an intuitive, visual interface for exploring image processing algorithms. The application is designed for:

- **Students** learning computer vision fundamentals
- **Educators** teaching image processing concepts
- **Researchers** experimenting with enhancement techniques
- **Developers** understanding classical CV algorithms before diving into deep learning

### Why Visual Representation Matters

Computer vision algorithms can seem abstract when presented purely mathematically. This tool makes concepts tangible by:

1. **Immediate Feedback**: See how each parameter affects the output in real-time
2. **Histogram Visualization**: Understand pixel intensity distributions before and after processing
3. **Step-by-Step Pipeline**: Break down complex operations into digestible stages
4. **Interactive Learning**: Experiment freely without coding or environment setup

## Features

### Two Modes of Interaction

#### Explore Mode
An interactive playground where you can:
- Apply multiple image processing filters
- Adjust parameters with real-time preview
- Compare original and processed images side-by-side
- Visualize histograms before and after processing

#### Explain Mode
A guided educational experience that:
- Walks through a complete image enhancement pipeline
- Shows intermediate results at each step
- Provides contextual explanations for each technique
- Visualizes CLAHE tile grids overlaid on the image
- Uses smooth animations to transition between steps

### Image Processing Capabilities

**Basic Transformations**
- Grayscale conversion

**Histogram-Based Enhancement**
- Histogram Equalization
- CLAHE (Contrast Limited Adaptive Histogram Equalization) for grayscale
- CLAHE for color images (applied in LAB color space)
- Adjustable clip limit and tile size

**Smoothing Filters**
- Gaussian Blur with adjustable kernel size
- Average Blur with adjustable kernel size

**Sharpening**
- Convolution-based sharpening filter

**Edge Detection**
- Sobel edge detection
- Canny edge detection with adjustable thresholds

## The Image Processing Pipeline

### Understanding Histogram Equalization vs CLAHE

Both techniques aim to improve image contrast by redistributing pixel intensities, but they work differently:

#### Histogram Equalization

**How it works**: Spreads out pixel intensities across the entire range (0-255) using a global transformation.

**Strengths**:
- Simple and fast
- Effective for images with poor global contrast
- Mathematically elegant

**Limitations**:
- Applies the same transformation to the entire image
- Can over-amplify noise in near-uniform regions
- May lose local detail in favor of global contrast

**When to use**: Images with generally poor contrast that need global enhancement.

#### CLAHE (Contrast Limited Adaptive Histogram Equalization)

**How it works**:
1. Divides the image into small tiles (e.g., 8×8 pixels)
2. Applies histogram equalization independently to each tile
3. Limits contrast amplification using a clip limit threshold
4. Smoothly blends neighboring tiles using bilinear interpolation

**Strengths**:
- Adapts to local image characteristics
- Prevents noise over-amplification via clip limit
- Preserves fine details better than global methods
- Handles varying lighting conditions within one image

**Limitations**:
- More computationally expensive
- Requires parameter tuning (clip limit, tile size)
- Can create visible tile boundaries if poorly configured

**When to use**: Images with non-uniform lighting, medical imaging, underwater photography, or when local detail preservation is critical.

#### CLAHE on Color Images

When applying CLAHE to color images, we convert from RGB to a luminance/chrominance space (YCrCb in this implementation):
- **Y (luminance) channel**: Contains brightness information
- **Cr and Cb channels**: Contain color (chrominance) information

We apply CLAHE only to the luminance channel, preserving natural colors while enhancing contrast. This prevents color distortion that would occur if CLAHE were applied to RGB channels directly.

## Technology Stack

### Core Technologies

- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling

### Computer Vision

- **OpenCV.js** - Complete OpenCV library compiled to WebAssembly
  - Runs entirely in the browser
  - No server-side processing required
  - Access to hundreds of CV algorithms

### Visualization

- **Chart.js** - High-performance histogram rendering
- **react-chartjs-2** - React wrapper for Chart.js
- **Framer Motion** - Smooth animations in Explain Mode

### Architecture Highlights

- **Modular Design**: Separate components for image display, histograms, controls, and explanations
- **Memory Management**: Proper cleanup of OpenCV Mat objects to prevent memory leaks
- **Real-time Processing**: Immediate visual feedback on parameter changes
- **Responsive Layout**: Works on desktop and tablet screens

## Installation and Usage

### Prerequisites

- Node.js 16+ and npm

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd explainable-vision
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

### Running Type Checks

```bash
npm run typecheck
```

## How to Use the Application

### Getting Started

1. **Upload an Image**: Click "Choose Image" and select a photo from your computer
2. **Choose a Mode**:
   - **Explore Mode**: Experiment with different filters and parameters
   - **Explain Mode**: Follow a guided tour of the enhancement pipeline

### Explore Mode Workflow

1. Upload your image
2. Toggle filters on/off in the control panel
3. Adjust sliders for techniques like CLAHE, blur, or edge detection
4. Observe the real-time changes in:
   - The processed image
   - The histogram distribution
5. Click "Reset" to return to the original image

### Explain Mode Workflow

1. Upload your image
2. Switch to Explain Mode
3. Use "Next" and "Previous" buttons to navigate through the pipeline
4. Read the explanations for each step
5. Observe how intermediate results progress toward the final enhanced image

### Tips for Best Results

- **CLAHE Clip Limit**: Start at 2.0 and increase if you need more contrast (higher values = more aggressive enhancement)
- **CLAHE Tile Size**: Smaller tiles (4-8) for fine details, larger tiles (16-32) for broader regions
- **Edge Detection**: Try Canny first, adjust thresholds until edges are clear
- **Combining Filters**: Apply CLAHE or histogram equalization before edge detection for better results

## Project Structure

```
src/
├── components/
│   ├── ImageCanvas.tsx       # Canvas-based image display
│   ├── HistogramChart.tsx    # Chart.js histogram visualization
│   ├── ControlPanel.tsx      # Interactive control panel with sliders
│   └── ExplainMode.tsx       # Step-by-step explanation interface
├── hooks/
│   └── useOpenCV.ts          # Custom hook to check OpenCV.js loading
├── utils/
│   ├── imageProcessing.ts    # All CV operations and processing logic
│   └── histogram.ts          # Histogram computation utilities
├── types/
│   └── opencv.d.ts           # TypeScript declarations for OpenCV.js
├── App.tsx                   # Main application component
└── main.tsx                  # Application entry point
```

## Educational Resources

### Recommended Reading

- **Computer Vision: Algorithms and Applications** by Richard Szeliski
- **Digital Image Processing** by Rafael C. Gonzalez and Richard E. Woods
- **OpenCV Documentation**: https://docs.opencv.org/

### Key Concepts Demonstrated

1. **Color Space Transformations**: RGB to Grayscale, RGB to YCrCb
2. **Histogram Analysis**: Understanding pixel intensity distributions
3. **Spatial Domain Processing**: Convolution kernels for blur and sharpening
4. **Gradient-Based Edge Detection**: Sobel and Canny algorithms
5. **Adaptive Processing**: Local vs global image enhancement

## Future Enhancements

Potential additions to expand the learning experience:

- Morphological operations (erosion, dilation)
- Fourier transforms and frequency domain filtering
- Feature detection (corners, keypoints)
- Image segmentation techniques
- Comparison mode (A/B split view)
- Export processed images
- Batch processing capability

## License

This project is intended for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to improve the tool's educational value.

---

**Built with a focus on clarity, interactivity, and visual learning.**
