import { useEffect, useState, useRef } from 'react';

export default function PreviewPanel({ 
  image,
  isProcessing,
  progress,
  canvasRef,
  drawingCanvasRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  PRESET_ROOMS,
  isDrawingMode,
  refreshTrigger,
  texture,
}) {
  const fallbackImage = PRESET_ROOMS?.[0]?.url;
  const [showProcessingComplete, setShowProcessingComplete] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const previewContainerRef = useRef(null);
  const [originalImageData, setOriginalImageData] = useState(null);
console.log(texture)
  // Capture original image data when texture changes
  useEffect(() => {
    console.log("first")

    if (!canvasRef.current || !texture) return;
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    setOriginalImageData(tempCanvas.toDataURL());
  }, [texture, refreshTrigger]);

  // Handle canvas initialization and updates
  useEffect(() => {
    const canvas = isDrawingMode ? drawingCanvasRef.current : canvasRef.current;
    if (canvas && (image || fallbackImage)) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bgImage = new Image();
      bgImage.src = image || fallbackImage;
      bgImage.onload = () => {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [isDrawingMode, image, fallbackImage, refreshTrigger]);

  // Handle processing completion
  useEffect(() => {
    if (isProcessing && progress === 100) {
      const timer = setTimeout(() => {
        setShowProcessingComplete(true);
        setTimeout(() => setShowProcessingComplete(false), 1000);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, progress]);

  // Handle mouse move for comparison slider
  const handleCompareMove = (e) => {
    if (!previewContainerRef.current ) return;
    
    const container = previewContainerRef.current;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setComparePosition(x);
  };
  return (
    <div className="w-full h-full">
      <div 
        ref={previewContainerRef}
        className="relative border rounded-lg overflow-hidden shadow-lg bg-gray-50 w-full h-full min-h-[300px]"
        onMouseEnter={() => originalImageData && setIsComparing(true)}
        onMouseLeave={() => setIsComparing(false)}
        onMouseMove={handleCompareMove}
      >
        {(image || fallbackImage) && (
          <img
            src={image || fallbackImage}
            alt="Room Background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {isDrawingMode ? (
          <canvas
            ref={drawingCanvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none md:touch-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              e.preventDefault();
              handleMouseDown(e.touches[0]);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              handleMouseMove(e.touches[0]);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleMouseUp();
            }}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-10 touch-none"
          />
        )}

        {/* Comparison overlay */}
        { originalImageData && (
          <>
            <div 
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                clipPath: `polygon(0 0, ${comparePosition}% 0, ${comparePosition}% 100%, 0 100%)`,
                backgroundImage: `url(${originalImageData})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white z-30 shadow-lg pointer-events-none"
              style={{ left: `${comparePosition}%` }}
            >
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-white rounded-sm flex items-center justify-center">
                <div className="w-1 h-6 bg-gray-400"></div>
              </div>
            </div>
          </>
        )}

        {!image && !fallbackImage && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-center z-10 p-4">
            <div>
              <div className="text-xl md:text-2xl mb-2">👋 Get Started</div>
              <p className="text-sm md:text-base">Upload a room photo or select a preset to begin</p>
            </div>
          </div>
        )}

        {(isProcessing || showProcessingComplete) && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center z-20 p-4">
            <div className="text-white font-bold bg-blue-500 px-3 py-1 md:px-4 md:py-2 rounded-lg mb-2 text-sm md:text-base">
              {progress === 100 ? 'Processing Complete!' : `Processing... ${progress}%`}
            </div>
            <div className="w-48 md:w-64 bg-gray-200 rounded-full h-2 md:h-2.5">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}