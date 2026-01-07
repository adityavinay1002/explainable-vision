import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, X } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

export const WebcamCapture = ({ onCapture, onCancel }: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing webcam:', err);
      setError('Could not access webcam. Please ensure you have granted permission.');
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        stopWebcam(); // Stop stream before passing data
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="bg-transparent rounded-xl p-6 max-w-lg mx-auto relative">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-gray-100">Webcam Capture</h2>
      </div>

      {error ? (
        <div className="text-red-400 mb-6 text-center bg-red-900/20 p-4 rounded-lg border border-red-900/50">
          <p>{error}</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-6 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>
      )}

      {!error && (
        <div className="flex justify-center gap-4">
          <button
            onClick={handleCapture}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors font-medium"
          >
            <Camera size={20} className="text-white" />
            Capture Frame
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-8 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors font-medium"
          >
            <CameraOff size={20} />
            Stop Webcam
          </button>
        </div>
      )}
    </div>
  );
};
