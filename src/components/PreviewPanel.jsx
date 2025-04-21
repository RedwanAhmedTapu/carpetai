import { useEffect, useState, useRef, useCallback } from "react";

const PreviewPanel = ({ 
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
  texture,
  refreshTrigger,
}) => {
  const fallbackImage = PRESET_ROOMS?.[0]?.url;
  const [showProcessingComplete, setShowProcessingComplete] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const previewContainerRef = useRef(null);
  const [originalImageData, setOriginalImageData] = useState(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Track container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (previewContainerRef.current) {
        setContainerDimensions({
          width: previewContainerRef.current.clientWidth,
          height: previewContainerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Capture original image data when texture changes or refresh occurs
  const captureOriginalImage = useCallback(() => {
    if (!canvasRef.current || !texture) return;
    
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    setOriginalImageData(tempCanvas.toDataURL());
  }, [canvasRef, texture]);

  useEffect(() => {
    const timer = setTimeout(captureOriginalImage, 100);
    return () => clearTimeout(timer);
  }, [texture, refreshTrigger, captureOriginalImage]);

  // Setup canvas with proper dimensions and image
  useEffect(() => {
    const canvas = isDrawingMode ? drawingCanvasRef.current : canvasRef.current;
    if (!canvas || !containerDimensions.width) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image's natural size
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    img.src = image || fallbackImage;
  }, [isDrawingMode, image, fallbackImage, refreshTrigger, containerDimensions]);

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
    if (!previewContainerRef.current || !isComparing) return;
    
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
        {/* Background image container */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {(image || fallbackImage) && (
            <img
              src={image || fallbackImage}
              alt="Room Background"
              className="max-w-full max-h-full object-contain pointer-events-none"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto'
              }}
            />
          )}
        </div>

        {/* Drawing or processed canvas */}
        {isDrawingMode ? (
          <canvas
            ref={drawingCanvasRef}
            className="absolute inset-0 m-auto cursor-crosshair z-10 touch-none md:touch-auto"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto'
            }}
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
            className="absolute inset-0 m-auto z-10 touch-none"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto'
            }}
          />
        )}

        {/* Comparison overlay */}
        {originalImageData && progress === 100 && (
          <>
            <div 
              className="absolute inset-0 m-auto z-20 pointer-events-none"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                clipPath: `polygon(0 0, ${comparePosition}% 0, ${comparePosition}% 100%, 0 100%)`,
                backgroundImage: `url(${originalImageData})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
            />
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white z-30 shadow-lg pointer-events-none"
              style={{ 
                left: `${comparePosition}%`,
                height: '100%'
              }}
            >
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-white rounded-sm flex items-center justify-center">
                <div className="w-1 h-6 bg-gray-400"></div>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!image && !fallbackImage && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-center z-10 p-4">
            <div>
              <div className="text-xl md:text-2xl mb-2">👋 Get Started</div>
              <p className="text-sm md:text-base">Upload a room photo or select a preset to begin</p>
            </div>
          </div>
        )}

        {/* Processing overlay */}
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
};

export default PreviewPanel;