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

// Smooth the points using quadratic Bézier curves
const smoothPoints = (points, tension = 0.5) => {
  if (points.length < 3) return points;

  const smoothed = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    
    // Calculate control point
    const cp1x = current.x + (next.x - prev.x) * tension;
    const cp1y = current.y + (next.y - prev.y) * tension;
    
    smoothed.push({
      x: cp1x,
      y: cp1y,
      control: true
    });
    smoothed.push(next);
  }
  
  return smoothed;
};

// Draw smooth curve through points
const drawSmoothCurve = (ctx, points, color, lineWidth) => {
  if (points.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    // Straight line if only 2 points
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    // Draw smooth curve for multiple points
    let i = 1;
    while (i < points.length - 2) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      i++;
    }
    // Curve through the last two points
    ctx.quadraticCurveTo(
      points[i].x,
      points[i].y,
      points[i + 1].x,
      points[i + 1].y
    );
  }

  ctx.stroke();
};

// Draw all floor areas with smooth curves
const drawAllAreas = () => {
  const canvas = drawingCanvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const currentPath = pathPointsRef.current;

  // Clear and redraw base image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = new Image();
  img.src = image;
  ctx.drawImage(img, 0, 0);

  // Draw all floor areas
  floorAreasRef.current.forEach((area, areaIndex) => {
    if (area.length < 2) return;

    // Draw the smooth polygon
    const isActive = areaIndex === activeAreaIndex;
    const strokeColor = isActive ? 'rgba(255, 165, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
    const fillColor = isActive ? 'rgba(255, 165, 0, 0.2)' : 'rgba(100, 200, 255, 0.2)';

    // Draw smooth outline
    drawSmoothCurve(ctx, area, strokeColor, brushSize);

    // Close and fill if not currently drawing
    if (!isDrawingRef.current && area.length > 2) {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(area[0].x, area[0].y);
      
      for (let i = 1; i < area.length; i++) {
        const xc = (area[i - 1].x + area[i].x) / 2;
        const yc = (area[i - 1].y + area[i].y) / 2;
        ctx.quadraticCurveTo(area[i - 1].x, area[i - 1].y, xc, yc);
      }
      
      ctx.closePath();
      ctx.fill();
    }

    // Draw points if wireframe is shown
    if (showWireframe) {
      area.forEach((point, pointIndex) => {
        ctx.fillStyle = isActive ? 'orange' : 'red';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (area.length > 2) {
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.fillText(pointIndex.toString(), point.x + 6, point.y + 4);
        }
      });
    }
  });

  // Draw current smooth path
  if (currentPath.length > 1) {
    drawSmoothCurve(ctx, currentPath, 'rgba(255, 0, 0, 0.8)', brushSize);
  }
};

// Handle mouse down - start new area or continue existing one
const handleMouseDown = (e) => {
  if (!isDrawingMode || !drawingCanvasRef.current) return;

  const pos = getCursorPosition(e);
  isDrawingRef.current = true;

  if (activeAreaIndex === -1) {
    // Start new area
    currentAreaRef.current = [pos];
    floorAreasRef.current.push(currentAreaRef.current);
    setActiveAreaIndex(floorAreasRef.current.length - 1);
  }
  
  // Start new path
  pathPointsRef.current = [pos];
  drawAllAreas();
};

// Handle mouse move - record points and draw smooth preview
const handleMouseMove = (e) => {
  if (!isDrawingMode || !isDrawingRef.current || !drawingCanvasRef.current) return;

  const pos = getCursorPosition(e);
  pathPointsRef.current.push(pos);

  // Limit points for performance while maintaining smoothness
  if (pathPointsRef.current.length > 150) {
    pathPointsRef.current = pathPointsRef.current.filter((_, i) => i % 2 === 0);
  }

  drawAllAreas();
};

// Handle mouse up - finalize the area with auto-closing
const handleMouseUp = () => {
  if (!isDrawingMode || !isDrawingRef.current) return;

  if (pathPointsRef.current.length > 1 && activeAreaIndex !== -1) {
    const activeArea = floorAreasRef.current[activeAreaIndex];
    const smoothedPoints = smoothPoints(pathPointsRef.current);
    const startPoint = activeArea[0];
    const lastPoint = smoothedPoints[smoothedPoints.length - 1];

    // Check if we're close to the starting point (within 20 pixels)
    const shouldCloseArea = (
      Math.sqrt(
        Math.pow(lastPoint.x - startPoint.x, 2) + 
        Math.pow(lastPoint.y - startPoint.y, 2)
      ) < 20
    );

    // Add smoothed points to the current area
    smoothedPoints.forEach(point => {
      if (!point.control) {
        activeArea.push(point);
      }
    });

    // If close to start point, close the area
    if (shouldCloseArea) {
      // Remove the last few points that may overlap with start
      while (activeArea.length > 3 && 
             Math.sqrt(
               Math.pow(activeArea[activeArea.length-1].x - startPoint.x, 2) + 
               Math.pow(activeArea[activeArea.length-1].y - startPoint.y, 2)
             ) < 10) {
        activeArea.pop();
      }
      
      // Add the start point to close the loop
      activeArea.push({ ...startPoint });
      
      // Mark drawing as complete
      isDrawingRef.current = false;
      setActiveAreaIndex(-1); // Deselect the completed area
    }
    // If this was the first segment and not closing, duplicate first point
    else if (activeArea.length === pathPointsRef.current.length) {
      activeArea.push({ ...activeArea[0] });
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
