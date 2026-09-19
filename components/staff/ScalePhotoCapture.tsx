"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Trash2, CheckCircle2, Image as ImageIcon } from "lucide-react";

interface ScalePhotoCaptureProps {
  label?: string;
  required?: boolean;
  value: string | null;
  onChange: (base64: string | null) => void;
}

export default function ScalePhotoCapture({
  label = "Weight Scale Photo",
  required = true,
  value,
  onChange,
}: ScalePhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    // Read and compress image client-side to keep upload fast
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {label} {required && <span className="text-gymRed">*</span>}
        </label>
        {value && (
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Photo Attached</span>
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 group">
          {/* Preview Image */}
          <div className="relative h-44 w-full bg-black/40 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Weight Scale"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Action Bar */}
          <div className="p-2.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Scale Display Captured</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                title="Remove photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? "border-gymRed bg-gymRed/10"
              : "border-zinc-700/80 hover:border-zinc-500 bg-zinc-900/60 hover:bg-zinc-900"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-200">
              Take Scale Photo <span className="text-zinc-500 font-normal">or upload image</span>
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Ensure the weight readout on the scale is clearly visible
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gymRed uppercase tracking-wider mt-1">
            <Upload className="w-3 h-3" />
            <span>Open Camera / Browse</span>
          </div>
        </div>
      )}
    </div>
  );
}
