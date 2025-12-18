import { useRef, useEffect } from 'react';

interface ImageCanvasProps {
  mat: any;
  title: string;
  showTileGrid?: boolean;
  tileSize?: number;
}

export function ImageCanvas({ mat, title, showTileGrid = false, tileSize = 8 }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!mat || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const cv = (window as any).cv;

      // Log mat diagnostics
      try {
        console.debug('ImageCanvas: rendering mat', {
          cols: mat?.cols,
          rows: mat?.rows,
          channels: typeof mat?.channels === 'function' ? mat.channels() : 'unknown',
          isDeleted: typeof mat?.isDeleted === 'function' ? mat.isDeleted() : 'no-isDeleted',
        });
      } catch (d) {
        // ignore diagnostics
      }

      // Ensure canvas matches mat size
      if (mat.cols && mat.rows) {
        canvas.width = mat.cols;
        canvas.height = mat.rows;
      }

      // Defensive: check mat validity and deletion state
      if (typeof mat.cols !== 'number' || typeof mat.rows !== 'number' || mat.cols === 0 || mat.rows === 0) {
        console.error('ImageCanvas: invalid Mat dimensions', { cols: mat.cols, rows: mat.rows, mat });
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width || 200, canvas.height || 200);
        ctx.fillStyle = '#c00';
        ctx.fillText('Invalid image', 10, 20);
        return;
      }

      if (typeof mat.isDeleted === 'function' && mat.isDeleted()) {
        console.error('ImageCanvas: Mat has been deleted before render', mat);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#c00';
        ctx.fillText('Image data unavailable', 10, 20);
        return;
      }

      // Try to display via OpenCV; catch any runtime errors
      try {
        cv.imshow(canvas, mat);
      } catch (showErr) {
        console.error('cv.imshow failed', showErr, mat);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#c00';
        ctx.fillText('Display error', 10, 20);
      }

      // Draw overlay grid on separate transparent canvas to avoid altering image pixels
      try {
        const overlay = overlayRef.current;
        if (overlay) {
          overlay.width = canvas.width;
          overlay.height = canvas.height;
          const octx = overlay.getContext('2d');
          if (octx) {
            octx.clearRect(0, 0, overlay.width, overlay.height);

            if (showTileGrid && tileSize > 0) {
              const clamped = Math.max(4, Math.min(16, Math.floor(tileSize)));
              octx.strokeStyle = 'rgba(255, 0, 0, 0.45)';
              octx.lineWidth = 1;

              for (let x = 0; x < overlay.width; x += clamped) {
                octx.beginPath();
                octx.moveTo(x + 0.5, 0);
                octx.lineTo(x + 0.5, overlay.height);
                octx.stroke();
              }

              for (let y = 0; y < overlay.height; y += clamped) {
                octx.beginPath();
                octx.moveTo(0, y + 0.5);
                octx.lineTo(overlay.width, y + 0.5);
                octx.stroke();
              }
            }
          }
        }
      } catch (overlayErr) {
        console.error('ImageCanvas overlay error', overlayErr);
      }
    } catch (e) {
      console.error('ImageCanvas unexpected error', e, mat);
      try {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width || 200, canvas.height || 200);
        ctx.fillStyle = '#c00';
        ctx.fillText('Unexpected error', 10, 20);
      } catch (drawErr) {
        // ignore drawing errors
      }
    }
  }, [mat, showTileGrid, tileSize]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <div className="relative inline-block border border-gray-300 rounded-lg">
        <canvas
          ref={canvasRef}
          className="block max-w-full h-auto"
        />
        <canvas
          ref={overlayRef}
          className="absolute left-0 top-0 pointer-events-none"
          style={{ mixBlendMode: 'normal' }}
        />
      </div>
    </div>
  );
}
