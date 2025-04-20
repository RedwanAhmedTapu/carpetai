"use client";

import { useEffect, useRef, useState } from "react";
import ControlsPanel from "../../components/ControlsPanel";
import PreviewPanel from "../../components/PreviewPanel";

import { UserPlus2Icon } from "lucide-react";
import UploadRoomPanel from "../../components/UploadRoomPanel";
import TextureScrollStrip from "@/components/TextureScrollTrip";
import DemoMode from "@/components/DemoMode";

export default function FloorVisualizer() {
  // Refs
  const canvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const floorAreasRef = useRef([]);
  const currentAreaRef = useRef([]);
  const pathPointsRef = useRef([]);

  // State
  const [image, setImage] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [originalTextureData, setOriginalTextureData] = useState(null);

  const [texture, setTexture] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textureScale, setTextureScale] = useState(1);
  const [textureOpacity, setTextureOpacity] = useState(0.8);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const [brushSize, setBrushSize] = useState(3);
  const [connectionRadius, setConnectionRadius] = useState(30);
  const [activeAreaIndex, setActiveAreaIndex] = useState(-1);
  const [showWireframe, setShowWireframe] = useState(true);

  const PRESET_TEXTURES = [
    { name: "Marble", url: "/textures/marble.jpg" },
    { name: "Carpet", url: "/textures/carpet.jpg" },
    { name: "Concrete", url: "/textures/concrete.jpg" },
  ];
  const PRESET_ROOMS = [
    { name: "Bedroom", url: "/rooms/bedroom.png" },
    { name: "Kitchen", url: "/rooms/kitchen.jpg" },
    { name: "Bathroom", url: "/rooms/bathroom.jpg" },
  ];
  // Initialize canvas when image loads
  useEffect(() => {
    if (!image || !drawingCanvasRef.current) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = drawingCanvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
    };
  }, [image]);
  // Refresh canvas function
  const refreshCanvases = () => {
    window.location.reload();
  };

  // Get accurate cursor position accounting for canvas scaling
  const getCursorPosition = (e) => {
    if (!drawingCanvasRef.current) return { x: 0, y: 0 };

    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate scaling factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Check if point is near another point
  const isPointNearby = (point1, point2, radius) => {
    return (
      Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2) <
      radius
    );
  };

  // Find the nearest point within connection radius
  const findNearestPoint = (point, points, radius) => {
    for (let i = 0; i < points.length; i++) {
      if (isPointNearby(point, points[i], radius)) {
        return i;
      }
    }
    return -1;
  };

  // Draw all floor areas with improved accuracy
  const drawAllAreas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const currentPath = pathPointsRef.current;
    console.log(currentPath)

    // Clear and redraw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.src = image;
    ctx.drawImage(img, 0, 0);

    // Draw all floor areas
    floorAreasRef.current.forEach((area, areaIndex) => {
      if (area.length < 2) return;

      // Draw the polygon
      ctx.strokeStyle =
        areaIndex === activeAreaIndex
          ? "rgba(255, 165, 0, 0.8)"
          : "rgba(255, 0, 0, 0.8)";
      ctx.lineWidth = brushSize;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(area[0].x, area[0].y);

      for (let i = 1; i < area.length; i++) {
        ctx.lineTo(area[i].x, area[i].y);
      }

      if (!isDrawingRef.current && area.length > 2) {
        ctx.closePath();
      }

      ctx.stroke();

      // Fill if closed
      if (!isDrawingRef.current && area.length > 2) {
        ctx.fillStyle =
          areaIndex === activeAreaIndex
            ? "rgba(255, 165, 0, 0.2)"
            : "rgba(100, 200, 255, 0.2)";
        ctx.fill();
      }

      // Draw points
      if (showWireframe) {
        area.forEach((point, pointIndex) => {
          ctx.fillStyle = areaIndex === activeAreaIndex ? "orange" : "red";
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Show point index for debugging
          if (area.length > 2) {
            ctx.fillStyle = "white";
            ctx.font = "10px Arial";
            ctx.fillText(pointIndex.toString(), point.x + 6, point.y + 4);
          }
        });
      }
    });

    // Draw connection indicators for nearby points
    if (
      isDrawingRef.current &&
      currentPath.length > 0 &&
      currentAreaRef.current.length > 0
    ) {
      const lastPoint = currentPath[currentPath.length - 1];

      // Check against current area points
      const nearestIndex = findNearestPoint(
        lastPoint,
        currentAreaRef.current,
        connectionRadius
      );

      if (nearestIndex >= 0) {
        const connectPoint = currentAreaRef.current[nearestIndex];

        ctx.strokeStyle = "rgba(0, 255, 0, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(connectPoint.x, connectPoint.y);
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.stroke();

        // Draw circle around connectable point
        ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
        ctx.beginPath();
        ctx.arc(
          connectPoint.x,
          connectPoint.y,
          connectionRadius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    }

    // Draw current path with improved accuracy
    if (currentPath.length > 1) {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      ctx.lineWidth = brushSize;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);

      // For first segment, draw straight line for accuracy
      if (currentPath.length === 2) {
        ctx.lineTo(currentPath[1].x, currentPath[1].y);
      } else {
        // Apply smoothing to subsequent points
        for (let i = 1; i < currentPath.length - 2; i++) {
          const xc = (currentPath[i].x + currentPath[i + 1].x) / 2;
          const yc = (currentPath[i].y + currentPath[i + 1].y) / 2;
          ctx.quadraticCurveTo(currentPath[i].x, currentPath[i].y, xc, yc);
        }

        // Connect to last point
        ctx.lineTo(
          currentPath[currentPath.length - 1].x,
          currentPath[currentPath.length - 1].y
        );
      }

      ctx.stroke();
    }
  };

  // Handle mouse down with precise starting point and auto-connect
  const handleMouseDown = (e) => {
    if (!isDrawingMode || !drawingCanvasRef.current) return;

    const pos = getCursorPosition(e);
    isDrawingRef.current = true;

    // Check if we're starting a new area or continuing an existing one
    if (activeAreaIndex === -1) {
      // Starting a new area
      currentAreaRef.current = [pos];
      floorAreasRef.current.push(currentAreaRef.current);
      setActiveAreaIndex(floorAreasRef.current.length - 1);
      pathPointsRef.current = [pos];
    } else {
      // Continuing the active area
      const activeArea = floorAreasRef.current[activeAreaIndex];

      // Check if we're near an existing point in the active area
      const nearestIndex = findNearestPoint(pos, activeArea, connectionRadius);

      if (nearestIndex >= 0) {
        // Start from the nearby point
        pathPointsRef.current = [activeArea[nearestIndex], pos];
      } else {
        // Start new segment
        pathPointsRef.current = [pos];
      }
    }

    drawAllAreas();
  };

  // Handle mouse move with accurate positioning
  const handleMouseMove = (e) => {
    if (!drawingCanvasRef.current) return;

    const pos = getCursorPosition(e);

    if (isDrawingMode && isDrawingRef.current) {
      pathPointsRef.current.push(pos);

      // Limit points for performance
      if (pathPointsRef.current.length > 20) {
        pathPointsRef.current.shift();
      }

      drawAllAreas();
    }
  };
  // Handle mouse up - finalize segment with auto-connect
  const handleMouseUp = () => {
    if (!isDrawingMode || !isDrawingRef.current) return;

    if (pathPointsRef.current.length > 0 && activeAreaIndex !== -1) {
      const lastPoint = pathPointsRef.current[pathPointsRef.current.length - 1];
      const activeArea = floorAreasRef.current[activeAreaIndex];

      // Check if we're ending near an existing point in the active area
      const nearestIndex = findNearestPoint(
        lastPoint,
        activeArea,
        connectionRadius
      );

      if (nearestIndex >= 0) {
        // Connect to the nearby point
        activeArea.push(activeArea[nearestIndex]);
      } else {
        // Add the last point to polygon
        activeArea.push(lastPoint);
      }
    }

    isDrawingRef.current = false;
    pathPointsRef.current = [];
    drawAllAreas();
  };

  // Close the current active polygon with auto-connect to first point
  const closeCurrentArea = () => {
    if (activeAreaIndex === -1) return;

    const activeArea = floorAreasRef.current[activeAreaIndex];
    if (activeArea.length > 2) {
      isDrawingRef.current = false;

      // Connect back to first point if not already connected
      const firstPoint = activeArea[0];
      const lastPoint = activeArea[activeArea.length - 1];

      if (!isPointNearby(firstPoint, lastPoint, connectionRadius)) {
        activeArea.push({
          x: firstPoint.x,
          y: firstPoint.y,
        });
      }

      drawAllAreas();
    }
  };

  // Clear the current active area
  const clearCurrentArea = () => {
    if (activeAreaIndex === -1) return;

    floorAreasRef.current.splice(activeAreaIndex, 1);
    currentAreaRef.current = [];
    setActiveAreaIndex(-1);
    isDrawingRef.current = false;
    pathPointsRef.current = [];
    drawAllAreas();
  };

  // Clear all drawings
  const clearAllAreas = () => {
    floorAreasRef.current = [];
    currentAreaRef.current = [];
    setActiveAreaIndex(-1);
    isDrawingRef.current = false;
    pathPointsRef.current = [];
    drawAllAreas();
  };

  // Select an area to edit
  const selectArea = (index) => {
    setActiveAreaIndex(index);
    currentAreaRef.current = floorAreasRef.current[index];
    drawAllAreas();
  };

  // Image upload handler
  const handleImageUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    type === "room" ? setImage(url) : setTexture(url);
  };

  // Calculate the bounding box of a polygon
  const getPolygonBoundingBox = (polygon) => {
    if (!polygon || polygon.length === 0) return null;

    let minX = polygon[0].x;
    let maxX = polygon[0].x;
    let minY = polygon[0].y;
    let maxY = polygon[0].y;

    for (let i = 1; i < polygon.length; i++) {
      minX = Math.min(minX, polygon[i].x);
      maxX = Math.max(maxX, polygon[i].x);
      minY = Math.min(minY, polygon[i].y);
      maxY = Math.max(maxY, polygon[i].y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };
  // Add this function to capture the original texture before applying new one
  const captureOriginalTexture = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(canvas, 0, 0);

    setOriginalTextureData(tempCanvas.toDataURL());
  };
  const applyTexture = async () => {
    // Early return if requirements aren't met
    console.log(texture,"texture")
    if (
      !image ||
      !texture ||
      floorAreasRef.current.length === 0 ||
      !canvasRef.current
    ) {
      return;
    }

    // Reset everything before starting
    setIsProcessing(true);
    setProgress(0);
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to ensure state updates

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Clear any previous work
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Load both images in parallel
      const [img, floorImg] = await Promise.all([
        loadImage(image),
        loadImage(texture),
      ]);

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image first
      ctx.drawImage(img, 0, 0);
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

      // Process each floor area
      for (const [areaIndex, area] of floorAreasRef.current.entries()) {
        if (area.length < 3) continue;

        // Create a temporary canvas for this area
        const areaCanvas = document.createElement("canvas");
        areaCanvas.width = canvas.width;
        areaCanvas.height = canvas.height;
        const areaCtx = areaCanvas.getContext("2d");

        // Create clipping path
        areaCtx.beginPath();
        areaCtx.moveTo(area[0].x, area[0].y);
        for (let i = 1; i < area.length; i++) {
          areaCtx.lineTo(area[i].x, area[i].y);
        }
        areaCtx.closePath();
        areaCtx.clip();

        // Calculate bounding box and pattern size
        const bbox = getPolygonBoundingBox(area);
        if (!bbox) continue;

        const areaSize = Math.max(bbox.width, bbox.height);
        const patternSize =
          Math.max(floorImg.width, floorImg.height) * textureScale;
        const scaleFactor = areaSize / 500;
        const dynamicPatternSize = patternSize * scaleFactor;

        // Create and apply pattern
        const pattern = createPattern(floorImg, dynamicPatternSize);
        areaCtx.fillStyle = pattern;

        const offsetX = bbox.x % dynamicPatternSize;
        const offsetY = bbox.y % dynamicPatternSize;
        areaCtx.translate(-offsetX, -offsetY);
        areaCtx.fillRect(offsetX, offsetY, canvas.width, canvas.height);

        // Draw this area's texture onto main canvas
        ctx.globalAlpha = textureOpacity;
        ctx.drawImage(areaCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        const newProgress = 20 + (70 * (areaIndex + 1)) / floorAreasRef.current.length;
        setProgress(newProgress);
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      }

      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 50)); // Ensure final render

    } catch (error) {
      console.error("Error applying texture:", error);
      setProgress(0);
    } finally {
      setIsProcessing(false);
      setIsDrawingMode(false);
    }
  };

  // Optimized helper functions
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const createPattern = (textureImg, size) => {
    console.log(textureImg,"ii")
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = size;
    patternCanvas.height = size;
    const patternCtx = patternCanvas.getContext("2d");

    patternCtx.drawImage(
      textureImg,
      0,
      0,
      textureImg.width,
      textureImg.height,
      0,
      0,
      size,
      size
    );

    return patternCtx.createPattern(patternCanvas, "repeat");
  };
  console.log(activeAreaIndex, "active");
  return (
    <div className="p-4 max-w-6xl mx-auto bg-[#F8FAFB] min-h-screen">
  <header className="mb-6 text-center">
    <h1 className="text-3xl text-slate-700 font-bold">Floor Texture Visualizer</h1>
  </header>

  {/* Layout: Stack vertically on mobile, side-by-side on md+ */}
  <div className="flex flex-col md:flex-row gap-6">
    
    {/* Left Side: PreviewPanel + Texture Strip */}
    <div className="flex-1">
      <PreviewPanel
        image={image}
        isProcessing={isProcessing}
        progress={progress}
        canvasRef={canvasRef}
        drawingCanvasRef={drawingCanvasRef}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        PRESET_ROOMS={PRESET_ROOMS}
        isDrawingMode={isDrawingMode}
        texture={texture}
        refreshTrigger={refreshTrigger}
        refreshCanvases={refreshCanvases}
      />
      
      {/* Texture Selector always visible */}
      <TextureScrollStrip
        textures={PRESET_TEXTURES}
        currentTexture={texture}
        setTexture={setTexture}
        applyTexture={applyTexture}
        setIsDrawingMode={setIsDrawingMode}
      />
    </div>

    {/* Right Side: Controls, collapsible on small screens */}
    <div className="md:w-[300px] relative">
     

      {/* Controls Panel */}
      {
  <div className="bg-white p-4 rounded shadow-md">
    {/* Close Button for small screens */}
    {showControls && (
      <div className="flex justify-end  mb-2">
        <button
          onClick={() => setShowControls(false)}
          className="text-sm px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          × 
        </button>
      </div>
    )}

    {showControls ? (
      <ControlsPanel
        image={image}
        texture={texture}
        isDrawingMode={isDrawingMode}
        brushSize={brushSize}
        connectionRadius={connectionRadius}
        showWireframe={showWireframe}
        activeAreaIndex={activeAreaIndex}
        floorAreas={floorAreasRef.current}
        textureScale={textureScale}
        textureOpacity={textureOpacity}
        isProcessing={isProcessing}
        progress={progress}
        handleImageUpload={handleImageUpload}
        setIsDrawingMode={setIsDrawingMode}
        setBrushSize={setBrushSize}
        setConnectionRadius={setConnectionRadius}
        setShowWireframe={setShowWireframe}
        closeCurrentArea={closeCurrentArea}
        clearCurrentArea={clearCurrentArea}
        clearAllAreas={clearAllAreas}
        selectArea={selectArea}
        setTexture={setTexture}
        setTextureScale={setTextureScale}
        setTextureOpacity={setTextureOpacity}
        applyTexture={applyTexture}
        setActiveAreaIndex={setActiveAreaIndex}
        PRESET_TEXTURES={PRESET_TEXTURES}
        refreshTrigger={refreshTrigger}
        refreshCanvases={refreshCanvases}
      />
    ) : (
      <UploadRoomPanel
        handleImageUpload={handleImageUpload}
        PRESET_ROOMS={PRESET_ROOMS}
        setTexture={setTexture}
        image={image}
        setImage={setImage}
        showControls={showControls}
        setShowControls={setShowControls}
      />
    )}
  </div>
}

    </div>
  </div>

  {/* DemoMode below everything */}
  <div className="mt-8">
    <DemoMode
      setImage={setImage}
      setIsDrawingMode={setIsDrawingMode}
      setBrushSize={setBrushSize}
      setConnectionRadius={setConnectionRadius}
      setShowWireframe={setShowWireframe}
      texture={texture}
      setTexture={setTexture}
      setTextureScale={setTextureScale}
      setTextureOpacity={setTextureOpacity}
      closeCurrentArea={closeCurrentArea}
      clearAllAreas={clearAllAreas}
      refreshCanvases={refreshCanvases}
      PRESET_ROOMS={PRESET_ROOMS}
      PRESET_TEXTURES={PRESET_TEXTURES}
      setShowControls={setShowControls}
      canvasRef={canvasRef}
      drawingCanvasRef={drawingCanvasRef}
      applyTexture={applyTexture}
    />
  </div>
</div>

  );
}
