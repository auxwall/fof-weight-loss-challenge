"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import { Sparkles, Flame, Download, Loader2, Trophy } from "lucide-react";
import { toPng } from "html-to-image";

interface WinnerInfo {
  position: number;
  userId: string;
  name: string;
  prizeAed: number;
  kgLost: number;
  branchLabel: string;
  day1Weight?: number | null;
  finalWeight?: number | null;
}

interface WinnerCelebrationCardProps {
  winners: Record<number, WinnerInfo>;
  onReset?: () => void;
}

export default function WinnerCelebrationCard({ winners, onReset }: WinnerCelebrationCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fireConfetti = () => {
    // Left burst
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { x: 0.2, y: 0.5 },
      colors: ["#EC1C23", "#FFD700", "#FFFFFF", "#B8860B"],
    });
    // Right burst
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { x: 0.8, y: 0.5 },
      colors: ["#EC1C23", "#FFD700", "#FFFFFF", "#B8860B"],
    });
  };

  useEffect(() => {
    fireConfetti();
    const t1 = setTimeout(fireConfetti, 800);
    const interval = setInterval(fireConfetti, 2500);
    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, []);

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    try {
      const node = cardRef.current;
      const rect = node.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      // Scale pixelRatio so export is precisely 1080px wide for Instagram
      const pixelRatio = 1080 / width;

      const dataUrl = await toPng(node, {
        width,
        height,
        pixelRatio,
        cacheBust: true,
        backgroundColor: "#0A0A0A",
        style: {
          margin: "0",
          left: "0",
          top: "0",
          transform: "none",
        },
      });

      const link = document.createElement("a");
      link.download = `gym-weight-loss-champions-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export celebration card:", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const first = winners[1];
  const second = winners[2];
  const third = winners[3];

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card p-4 rounded-2xl border border-surface-border">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="font-bold text-sm text-white">Official Winner Announcement Card</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloading}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-red-600 to-gymRed hover:from-red-500 hover:to-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/40 transition-all disabled:opacity-50"
          >
            {downloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating High-Res PNG...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Image (PNG)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={fireConfetti}
            className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-gymRed" />
            <span>Burst Confetti</span>
          </button>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="py-2 px-3 rounded-xl bg-surface-card border border-surface-border hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Re-select Winners
            </button>
          )}
        </div>
      </div>

      {/* Centering Wrapper to avoid offset issues with html-to-image */}
      <div className="w-full flex justify-center py-1">
        {/* The Instagram Postable Card Frame (4:5 / Square aesthetic) */}
        <div
          ref={cardRef}
          id="instagram-celebration-card"
          className="relative max-w-lg w-full bg-[#0A0A0A] border-4 border-gymRed/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center select-none"
          style={{ margin: 0 }}
        >
        {/* Background Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-gymRed/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-10 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Header & Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative">
            <Image
              src="/logo.png"
              alt="Gym Logo"
              width={256}
              height={256}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 block">
            DUBAI 2026 OFFICIAL RESULTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            WEIGHT LOSS <span className="text-gymRed">CHAMPIONS</span>
          </h1>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">
            23,000 AED TOTAL PRIZE POOL
          </span>
        </div>

        {/* 1st Place Champion Spotlight (Gold Hero) */}
        {first && (
          <div className="relative bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-2 border-amber-400/90 rounded-3xl p-6 mb-5 shadow-2xl transition-all duration-300 mt-4">
            {/* Top Ribbon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black text-[11px] sm:text-xs font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-xl flex items-center gap-1.5 whitespace-nowrap z-20 border border-amber-200/50">
              <span>🥇 1ST PLACE CHAMPION</span>
            </div>

            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
                {first.name}
              </h2>
              <div className="text-xs text-zinc-400 font-semibold">{first.branchLabel} Club</div>

              {/* Stats Highlight */}
              <div className="mt-4 py-2.5 px-4 bg-black/70 rounded-2xl border border-amber-400/30 inline-flex items-center justify-center gap-4">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Weight Lost</span>
                  <span className="text-2xl font-black text-gymRed font-mono">
                    -{Number(first.kgLost).toFixed(3)} <span className="text-xs">KG</span>
                  </span>
                </div>
                <div className="h-8 w-px bg-zinc-800" />
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Cash Prize</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    10,000 <span className="text-xs">AED</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2nd & 3rd Place Runners Up Podium */}
        <div className="grid grid-cols-2 gap-3.5 mb-6">
          {/* 2nd Place */}
          {second && (
            <div className="bg-zinc-900/80 border border-zinc-400/70 rounded-2xl p-4 text-center relative transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-300 text-black text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md z-20 whitespace-nowrap flex items-center gap-1">
                <span>🥈 2ND PLACE</span>
              </div>
              <div className="pt-1.5">
                <h3 className="text-sm sm:text-base font-bold text-white uppercase leading-snug line-clamp-2 mt-1">
                  {second.name}
                </h3>
                <span className="text-[10px] text-zinc-400 block">{second.branchLabel}</span>

                <div className="mt-2.5 pt-2 border-t border-zinc-800">
                  <div className="text-lg font-black text-gymRed font-mono">
                    -{Number(second.kgLost).toFixed(3)} KG
                  </div>
                  <div className="text-xs font-bold text-zinc-200 font-mono mt-0.5">
                    5,000 AED
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="bg-zinc-900/80 border border-amber-700/60 rounded-2xl p-4 text-center relative transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md z-20 whitespace-nowrap flex items-center gap-1">
                <span>🥉 3RD PLACE</span>
              </div>
              <div className="pt-1.5">
                <h3 className="text-sm sm:text-base font-bold text-white uppercase leading-snug line-clamp-2 mt-1">
                  {third.name}
                </h3>
                <span className="text-[10px] text-zinc-400 block">{third.branchLabel}</span>

                <div className="mt-2.5 pt-2 border-t border-zinc-800">
                  <div className="text-lg font-black text-gymRed font-mono">
                    -{Number(third.kgLost).toFixed(3)} KG
                  </div>
                  <div className="text-xs font-bold text-zinc-200 font-mono mt-0.5">
                    3,000 AED
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Watermark */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">
          <span>Official Gym Challenge</span>
          <span>Dubai · Verified Results</span>
        </div>
      </div>
    </div>
  </div>
  );
}
