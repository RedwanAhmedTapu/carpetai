"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, UserPlus2Icon } from "lucide-react";

// TextureScrollStrip Component
const TextureScrollStrip = ({
  textures,
  currentTexture,
  setTexture,
  applyTexture,
  setIsDrawingMode,
}) => {
  const handleTextureSelect =  (url) => {
    setIsDrawingMode(false);
    setTexture(url);
     applyTexture();
  };

  return (
    <div className="flex flex-col mt-2">
      <label className="text-gray-700 mb-2 font-medium">Textures</label>
      <div className="flex space-x-2 overflow-x-auto max-w-xs pr-1">
        {textures.map((t) => (
          <button
            key={t.url}
            onClick={() => handleTextureSelect(t.url)}
            className={`flex-shrink-0 w-16 h-16 border-2 rounded transition-colors ${
              currentTexture === t.url
                ? "border-blue-500"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};
export default TextureScrollStrip;
