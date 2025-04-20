// ControlsPanel Component
const ControlsPanel = ({
  image,
  texture,
  isDrawingMode,
  brushSize,
  connectionRadius,
  showWireframe,
  activeAreaIndex,
  floorAreas,
  textureScale,
  textureOpacity,
  isProcessing,
  progress,
  setIsDrawingMode,
  setBrushSize,
  setConnectionRadius,
  setShowWireframe,
  closeCurrentArea,
  clearCurrentArea,
  clearAllAreas,
  selectArea,
  setTexture,
  setTextureScale,
  setTextureOpacity,
  applyTexture,
  setActiveAreaIndex,
  PRESET_TEXTURES,
  refreshTrigger,
  refreshCanvases,
}) => {
  return (
    <section className="bg-[#FAFBF8] p-3 rounded-lg shadow text-sm flex flex-col gap-4 overflow-x-auto border border-gray-200">
      <div className="flex-1 min-w-[220px] text-xs text-gray-700 space-y-2">
        {/* Drawing Tools */}
        <div className="bg-white p-2 rounded border border-gray-300">
          <h2 className="font-semibold text-sm mb-1">Drawing</h2>
          <button
            onClick={() => {
              setIsDrawingMode(true);
              setActiveAreaIndex(-1);
            }}
            className={`w-full py-1 rounded ${
              isDrawingMode
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            ✏️ Draw Area
          </button>
        </div>

        {/* Brush & Radius */}
        <div className="bg-white p-2 rounded border border-gray-300 space-y-2">
          <div>
            <label className="block font-medium mb-1">
              Brush Size: {brushSize}px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Connection Radius: {connectionRadius}px
            </label>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={connectionRadius}
              onChange={(e) => setConnectionRadius(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showWireframe}
              onChange={(e) => setShowWireframe(e.target.checked)}
              className="accent-blue-500"
            />
            Show Wireframe
          </label>
        </div>

        {/* Refresh Canvas */}
        <div className="bg-white p-2 rounded border border-gray-300">
          <button
            onClick={refreshCanvases}
            className="w-full py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Canvas
          </button>
        </div>

        {/* Area Tools */}
        <div className="bg-white p-2 rounded border border-gray-300 space-y-1">
          <h2 className="font-semibold text-sm">Area Tools</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={closeCurrentArea}
              disabled={activeAreaIndex === -1}
              className="py-1 rounded bg-green-100 hover:bg-green-200 border border-green-300 disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={clearCurrentArea}
              disabled={activeAreaIndex === -1}
              className="py-1 rounded bg-red-100 hover:bg-red-200 border border-red-300 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
          <button
            onClick={clearAllAreas}
            className="w-full py-1 bg-red-100 hover:bg-red-200 border border-red-300 rounded"
          >
            Clear All
          </button>
        </div>

        {/* Texture Controls */}
        <div className="bg-white p-2 rounded border border-gray-300 space-y-2">
          <div>
            <label className="block mb-1 font-medium">
              Texture Scale: {textureScale.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={textureScale}
              onChange={(e) => setTextureScale(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Opacity: {Math.round(textureOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={textureOpacity}
              onChange={(e) => setTextureOpacity(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ControlsPanel;