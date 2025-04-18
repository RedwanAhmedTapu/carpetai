import { UploadCloud } from "lucide-react";
import { useState } from "react";

export default function UploadRoomPanel({
  handleImageUpload,
  PRESET_ROOMS,
  setTexture,
  image,
  setImage,
}) {
  const [uploadedImage, setUploadedImage] = useState(null);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);
    }
    handleImageUpload(e, "room");
  };

  return (
    <section className="bg-slate-900 p-4 rounded-lg shadow space-y-4 text-white">
      <h2 className="text-xl font-semibold">Upload Room</h2>

      {/* Room Upload Field */}
      <div>
        <label className="block mb-2 font-medium">Room Photo:</label>
        <label
          htmlFor="room-upload"
          className="relative group cursor-pointer w-full h-28 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center hover:border-blue-400 transition"
        >
          {uploadedImage ? (
            <img
              src={uploadedImage}
              alt="Uploaded Room"
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="text-center space-y-1">
              <UploadCloud className="mx-auto h-6 w-6 text-gray-400 group-hover:text-blue-500" />
              <p className="text-sm text-gray-400 group-hover:text-blue-400">
                Click to upload photo
              </p>
            </div>
          )}
          <input
            id="room-upload"
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Preset Room Images */}
      <div>
        <label className="block mb-2 font-medium">
          Or choose a sample room:
        </label>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {PRESET_ROOMS.map((room, index) => (
            <button
              key={index}
              onClick={() => {
                setUploadedImage(room.url);
                setImage(room.url);
              }}
              className="block w-full rounded overflow-hidden border hover:border-blue-400 transition"
            >
              <img
                src={room.url}
                alt={room.name}
                className="w-full h-28 object-cover"
              />
              <div className="text-center py-1 text-sm text-gray-200">
                {room.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
