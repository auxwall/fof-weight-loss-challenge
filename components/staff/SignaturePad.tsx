"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { RotateCcw, Check, Eraser } from "lucide-react";

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
      const dataUrl = padRef.current.getTrimmedCanvas().toDataURL("image/png");
      onSave(dataUrl);
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

      <div className="signature-container relative border-2 border-dashed border-zinc-700 hover:border-gymRed/60 rounded-xl overflow-hidden bg-zinc-950 h-44 shadow-inner">
        <SignatureCanvas
          ref={padRef}
          penColor="#FFFFFF"
          canvasProps={{
            className: "w-full h-full cursor-crosshair",
          }}
          backgroundColor="#0F0F0F"
        />
        <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-zinc-400 select-none uppercase tracking-widest">
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
