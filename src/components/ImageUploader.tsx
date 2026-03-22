import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
}

export function ImageUploader({ onImageUpload, imageUrl }: Props) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative border-2 border-dashed border-indigo-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-indigo-50/30 hover:bg-indigo-50/80 transition-all cursor-pointer overflow-hidden group min-h-[240px]"
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      {imageUrl ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt="Uploaded" 
            className="max-w-full max-h-[300px] object-contain rounded-lg shadow-sm" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <span className="text-white font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
              <UploadCloud size={18} /> Change Image
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <UploadCloud size={28} />
          </div>
          <p className="text-base font-semibold text-gray-800">Click or drag image here</p>
          <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WebP</p>
        </div>
      )}
    </div>
  );
}
