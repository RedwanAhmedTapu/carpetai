import { useEffect, useState, useRef } from 'react';

const DemoMode = ({
  setImage,
  setIsDrawingMode,
  setBrushSize,
  setConnectionRadius,
  setShowWireframe,
  texture,
  setTexture,
  setTextureScale,
  setTextureOpacity,
  closeCurrentArea,
  clearAllAreas,
  refreshCanvases,
  PRESET_ROOMS,
  PRESET_TEXTURES,
  setShowControls,
  canvasRef,
  drawingCanvasRef,
  applyTexture
}) => {
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoMessage, setDemoMessage] = useState('');
  const timeoutRef = useRef([]);

  const clearTimeouts = () => {
    timeoutRef.current.forEach(id => clearTimeout(id));
    timeoutRef.current = [];
  };

  const simulateDrawing = () => {
    if (!drawingCanvasRef.current) return;
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Define the points
    const points = [
      {x: 750.5686371152378, y: 570.8898377611496},
      {x: 929.4408494445858, y: 845.851833188306},
      {x: 444.9229150767404, y: 842.4148082454666},
      {x: 443.1862916560671, y: 603.5415747181245}
    ];
  
    // Draw the filled shape
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
  
    // Draw visible dots at each point
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2); // 5px radius dots
      ctx.fillStyle = index === 0 ? 'green' : 'red'; // First point green, others red
      ctx.fill();
      
      // Optional: Add point labels
      ctx.font = '12px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText(`P${index+1}`, point.x + 10, point.y - 10);
    });
  };

  const runStep = (step) => {
    clearTimeouts();
    
    switch (step) {
      case 0:
        setDemoMessage("Welcome! Let's start by selecting a sample room...");
        setImage(PRESET_ROOMS[1].url);
        setShowControls(true);
        timeoutRef.current.push(setTimeout(() => runStep(1), 2000));
        break;
        
      case 1:
        setDemoMessage("Now we'll enter drawing mode to create a floor area...");
        setIsDrawingMode(true);
        setBrushSize(5);
        setConnectionRadius(30);
        timeoutRef.current.push(setTimeout(() => runStep(2), 2000));
        break;
        
      case 2:
        setDemoMessage("Drawing a sample floor area...");
        simulateDrawing();
        timeoutRef.current.push(setTimeout(() => runStep(3), 2500));
        break;
        
      case 3:
        setDemoMessage("Closing the drawing mode...");
        setIsDrawingMode(false);
        timeoutRef.current.push(setTimeout(() => runStep(4), 1500));
        break;
        
      case 4:
        setDemoMessage("Let's double click to apply a wood texture to our floor...");
        setTexture(PRESET_TEXTURES[0]);
        setTextureScale(1.5);
        setTextureOpacity(0.8);
        applyTexture();
        setTimeout(()=>applyTexture(),50);
        
        timeoutRef.current.push(setTimeout(() => runStep(5), 2000));
        break;
        
      case 5:
        setDemoMessage("Showing the wireframe to see the structure...");
        setShowWireframe(true);
        timeoutRef.current.push(setTimeout(() => runStep(6), 1500));
        break;
        
      case 6:
        setDemoMessage("Refreshing the canvas to see changes...");
        refreshCanvases();
        timeoutRef.current.push(setTimeout(() => runStep(7), 1500));
        break;
        
      case 7:
        setDemoMessage("Clearing all areas to start fresh...");
        clearAllAreas();
        timeoutRef.current.push(setTimeout(() => runStep(8), 1500));
        break;
        
      case 8:
        setDemoMessage("Demo complete! Try exploring on your own now.");
        timeoutRef.current.push(setTimeout(() => {
          setIsDemoRunning(false);
          setDemoMessage('');
        }, 3000));
        break;
        
      default:
        setIsDemoRunning(false);
        setDemoMessage('');
    }
    
    setCurrentStep(step);
  };

  const startDemo = () => {
    setIsDemoRunning(true);
    setCurrentStep(0);
    runStep(0);
  };

  useEffect(() => {
    // Check if it's the first visit (using localStorage)
    const isFirstVisit = !localStorage.getItem('hasVisitedBefore');
    
    if (isFirstVisit) {
      startDemo();
      localStorage.setItem('hasVisitedBefore', 'true');
    }

    return () => clearTimeouts();
  }, []);

  return isDemoRunning ? (
    <div className="demo-message fixed inset-0 z-50 pointer-events-none flex items-end justify-center p-4">
      <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg max-w-md text-center">
        {demoMessage}
        <div className="w-full bg-gray-600 h-2 mt-3 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 8) * 100}%` }}
          />
        </div>
      </div>
    </div>
  ) : null;
};

export default DemoMode;