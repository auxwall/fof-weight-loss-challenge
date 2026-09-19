"use client";

import { X, ExternalLink, Scale } from "lucide-react";

interface PhotoProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
  subtitle?: string;
}

export default function PhotoProofModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
}: PhotoProofModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gymRed/15 text-gymRed flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="p-4 pt-1 flex items-center justify-center bg-black/40 min-h-[260px] max-h-[70vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg border border-zinc-800/80 shadow-md"
          />
        </div>

      </div>
    </div>
  );
}
