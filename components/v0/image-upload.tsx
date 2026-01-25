import React, { useState } from "react";

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  currentImage?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  currentImage,
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Assuming backend endpoint /api/upload handles Cloudinary/Storage
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      // data.secure_url is standard for Cloudinary responses
      onImageUpload(data.secure_url || data.url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image. Using local preview for now.");
      // In a real app, you might want to stop here,
      // but for this demo we'll let the base64 preview stand if upload fails
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div
        className={`relative group border-2 border-dashed rounded-2xl p-6 text-center transition-all ${preview ? "border-primary/50 500/50 bg-primary/10 500/5" : "border-zinc-800 hover:border-zinc-700 bg-zinc-950"}`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="image-input"
        />
        <label
          htmlFor="image-input"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          {!preview ? (
            <>
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-primary/50 400 group-hover:scale-110 transition-all">
                <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
              </div>
              <div>
                <span className="block text-zinc-300 font-medium">
                  {uploading
                    ? "Uploading to Cloud..."
                    : "Click to upload image"}
                </span>
                <span className="text-xs text-zinc-500">
                  PNG, JPG or WebP (Max 5MB)
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-primary/50 400 uppercase tracking-widest">
                Image Ready
              </span>
              <span className="text-zinc-500 text-[10px]">
                Click to replace
              </span>
            </div>
          )}
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-xs text-center font-medium animate-pulse">
          {error}
        </p>
      )}

      {preview && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden ring-1 ring-zinc-800 shadow-2xl">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary/50 500"></i>
              <span className="text-white text-sm font-bold animate-pulse">
                Processing...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
