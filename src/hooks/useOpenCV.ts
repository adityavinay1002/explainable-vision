import { useState, useEffect } from 'react';

export function useOpenCV() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    const checkOpenCV = () => {
      try {
        if ((window as any).cv && (window as any).cv.Mat) {
          if (!cancelled) setLoaded(true);
          return;
        }

        if (Date.now() - start > 10000) {
          if (!cancelled) setError('OpenCV.js did not load within 10 seconds. Check network or console for errors.');
          return;
        }

        setTimeout(checkOpenCV, 150);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      }
    };

    checkOpenCV();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loaded, error } as { loaded: boolean; error: string | null };
}
