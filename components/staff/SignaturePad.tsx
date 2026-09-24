"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Check, Eraser } from "lucide-react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
}

export default function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const padRef = useRef<SignatureCanvas | null>(null);

  const handleClear = () => {
    if (padRef.current) {
      padRef.current.clear();
      onClear?.();
    }
  };

  const handleConfirm = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      try {
        const trimmed = padRef.current.getTrimmedCanvas();
        // Create canvas with solid white background to guarantee white bg + black text
        const whiteCanvas = document.createElement("canvas");
        const padding = 16;
        whiteCanvas.width = trimmed.width + padding * 2;
        whiteCanvas.height = trimmed.height + padding * 2;
        const ctx = whiteCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);
          ctx.drawImage(trimmed, padding, padding);
          const dataUrl = whiteCanvas.toDataURL("image/png");
          onSave(dataUrl);
          return;
        }
      } catch (err) {
        console.error("Failed to trim signature with white background:", err);
      }

      // Fallback if trimCanvas fails
      const rawCanvas = padRef.current.getCanvas();
      const whiteCanvas = document.createElement("canvas");
      whiteCanvas.width = rawCanvas.width;
      whiteCanvas.height = rawCanvas.height;
      const ctx = whiteCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);
        ctx.drawImage(rawCanvas, 0, 0);
        onSave(whiteCanvas.toDataURL("image/png"));
      } else {
        onSave(rawCanvas.toDataURL("image/png"));
      }
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
        <span className="font-semibold uppercase tracking-wider text-zinc-300">
          Participant Signature
        </span>
        <span className="text-[10px] text-zinc-400">Sign with finger or stylus</span>
      </div>

      <div className="signature-container relative border-2 border-dashed border-zinc-300 hover:border-gymRed/80 rounded-xl overflow-hidden bg-white h-44 shadow-inner">
        <SignatureCanvas
          ref={padRef}
          penColor="#000000"
          canvasProps={{
            className: "w-full h-full cursor-crosshair",
          }}
          backgroundColor="rgba(255, 255, 255, 0)"
        />
        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-zinc-400 select-none uppercase tracking-widest font-medium">
          Sign inside box
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5 text-zinc-400" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          className="py-2 px-4 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-gymRed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Check className="w-3.5 h-3.5 text-gymRed" />
          <span>Lock In Signature</span>
        </button>
      </div>
    </div>
  );
}

