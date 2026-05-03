import { useEffect, useRef, useState } from 'react';
import { X, Aperture, RefreshCw, AlertCircle } from 'lucide-react';

interface LiveCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function LiveCamera({ onCapture, onClose }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        setError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError("Unable to access camera. Please make sure you have granted permission.");
      }
    }

    startCamera();

    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match the video feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to a File object
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Header controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={onClose}
          className="size-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-colors"
        >
          <X className="text-white size-5" />
        </button>
        
        <button 
          onClick={toggleCamera}
          className="size-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-colors"
        >
          <RefreshCw className="text-white size-5" />
        </button>
      </div>

      {/* Video Feed */}
      {error ? (
        <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
          <AlertCircle className="size-10 text-red-400" />
          <p className="text-white text-sm">{error}</p>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
      )}
      
      {/* Hidden canvas for capturing the frame */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent">
        <button 
          onClick={handleCapture}
          disabled={!!error}
          className="size-16 rounded-full border-4 border-white/80 flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
        >
          <div className="size-12 bg-white rounded-full flex items-center justify-center">
            <Aperture className="size-6 text-gray-900" />
          </div>
        </button>
      </div>
    </div>
  );
}
