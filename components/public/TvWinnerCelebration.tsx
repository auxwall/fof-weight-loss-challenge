"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import { Maximize2, Minimize2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

export interface WinnerDisplayInfo {
  position: number;
  name: string;
  prizeAed: number;
  kgLost: number;
  branchLabel: string;
}

interface TvWinnerCelebrationProps {
  winners: Record<number, WinnerDisplayInfo>;
}

export default function TvWinnerCelebration({ winners }: TvWinnerCelebrationProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Live time ticker for TV broadcast feel
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Dubai",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh every 60 seconds to pick up any winner updates live on the TV
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      router.refresh();
    }, 60000);
    return () => clearInterval(refreshInterval);
  }, [router]);

  // Infinite Confetti Loop
  useEffect(() => {
    const fireLeft = () => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.65 },
        colors: ["#EC1C23", "#FFD700", "#FFFFFF", "#FFA500"],
        zIndex: 9999,
      });
    };

    const fireRight = () => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.65 },
        colors: ["#EC1C23", "#FFD700", "#FFFFFF", "#FFA500"],
        zIndex: 9999,
      });
    };

    const fireCenter = () => {
      confetti({
        particleCount: 75,
        spread: 110,
        origin: { x: 0.5, y: 0.2 },
        colors: ["#EC1C23", "#FFD700", "#FFFFFF", "#FF3B30"],
        zIndex: 9999,
      });
    };

    // Immediate celebratory bursts
    fireCenter();
    const t1 = setTimeout(fireLeft, 350);
    const t2 = setTimeout(fireRight, 700);

    // Infinite recurring loop: bursts every 2.8 seconds indefinitely
    let step = 0;
    const loopInterval = setInterval(() => {
      if (step % 3 === 0) {
        fireLeft();
        fireRight();
      } else if (step % 3 === 1) {
        fireCenter();
      } else {
        fireLeft();
        setTimeout(fireRight, 400);
      }
      step++;
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(loopInterval);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const first = winners[1];
  const second = winners[2];
  const third = winners[3];

  return (
    <div className="relative min-h-screen lg:h-screen w-full bg-[#050505] text-white flex flex-col justify-between overflow-x-hidden select-none font-sans px-4 sm:px-8 lg:px-14 xl:px-20 py-4 lg:py-6">
      {/* Background Ambience Dynamic Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] xl:w-[1300px] h-[600px] bg-gymRed/15 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-1/2 left-1/5 w-[500px] xl:w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/5 w-[500px] xl:w-[700px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top TV Broadcast Bar */}
      <header className="w-full flex items-center justify-between z-10 border-b border-zinc-800/80 pb-3 lg:pb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-36 h-12 sm:w-48 sm:h-14 lg:w-60 lg:h-16 xl:w-72 xl:h-20">
            <Image
              src="/logo.png"
              alt="Face Off Fitness"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-8">
          {currentTime && (
            <div className="text-right">
              <span className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-mono font-black text-white tracking-widest block">
                {currentTime}
              </span>
              <span className="text-[10px] sm:text-xs lg:text-sm uppercase tracking-widest text-zinc-400 font-semibold block">
                Dubai, UAE · Live Results
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 sm:p-3 lg:p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all shadow-lg hover:scale-105"
            title="Toggle TV Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 lg:w-6 lg:h-6" />
            ) : (
              <Maximize2 className="w-5 h-5 lg:w-6 lg:h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Main TV Showcase Content - Expands Full Width on Large Screens */}
      <main className="w-full flex-1 flex flex-col justify-center items-center py-4 lg:py-6 z-10 space-y-4 lg:space-y-6 xl:space-y-8">
        {/* Official Announcement Title */}
        <div className="text-center space-y-2 lg:space-y-3 mb-24">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs sm:text-sm lg:text-base font-black uppercase tracking-widest shadow-lg">
            <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400 animate-bounce" />
            <span>30-Day Weight Loss Challenge</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase text-white tracking-tight leading-none drop-shadow-2xl">
            Official Winner <span className="text-gymRed">Announcement</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-xl xl:text-2xl text-zinc-400 font-semibold tracking-wide">
            Face Off Fitness Dubai · 23,000 AED Total Cash Prize Pool
          </p>
        </div>

        {/* Podium Layout - Expands Generously for Large TVs */}
        <div className="w-full max-w-[1850px] grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 xl:gap-10 items-stretch md:items-end pt-3 lg:pt-6">
          {/* 2nd Place (Silver - Left) */}
          <div className="order-2 md:order-1 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-2 border-zinc-400/80 rounded-3xl p-6 sm:p-7 lg:p-8 xl:p-10 text-center relative shadow-2xl transition-transform hover:scale-[1.02] backdrop-blur-md flex flex-col justify-between">
            <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 text-black text-xs sm:text-sm lg:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-xl border border-white/60 whitespace-nowrap">
              🥈 2ND PLACE
            </div>

            <div className="pt-4 lg:pt-6">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white uppercase tracking-tight line-clamp-2">
                {second ? second.name : "To Be Announced"}
              </h3>
              <p className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold text-zinc-400 mt-1">
                {second ? `${second.branchLabel} Club` : "Face Off Fitness"}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/90 space-y-3">
              <div className="bg-black/70 rounded-2xl py-3 px-4 border border-zinc-800">
                <span className="text-xs sm:text-sm lg:text-base text-zinc-400 uppercase font-bold block">
                  Weight Lost
                </span>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-5xl font-black text-gymRed font-mono tracking-tight block">
                  {second ? `-${second.kgLost.toFixed(1)} KG` : "—"}
                </span>
              </div>

              <div className="bg-zinc-900/90 rounded-2xl py-3 px-4 border border-zinc-700/60">
                <span className="text-xs sm:text-sm lg:text-base text-zinc-400 uppercase font-bold block">
                  Cash Prize
                </span>
                <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white font-mono tracking-tight block">
                  5,000 AED
                </span>
              </div>
            </div>
          </div>

          {/* 1st Place (Gold Champion - Center Elevated Hero) */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 border-4 border-amber-400 rounded-3xl p-7 sm:p-8 lg:p-10 xl:p-12 text-center relative shadow-2xl shadow-amber-950/50 md:-translate-y-6 lg:-translate-y-8 transition-transform hover:scale-[1.03] backdrop-blur-md flex flex-col justify-between">
            {/* Champion Ribbon */}
            <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black text-sm sm:text-base lg:text-lg xl:text-xl font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-2xl border-2 border-amber-200 flex items-center gap-2 whitespace-nowrap">
              <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-black shrink-0" />
              <span>🥇 1ST PLACE CHAMPION</span>
            </div>

            <div className="pt-6 lg:pt-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black text-white uppercase tracking-tight leading-tight">
                {first ? first.name : "To Be Announced"}
              </h2>
              <p className="text-sm sm:text-base lg:text-xl xl:text-2xl font-black text-amber-400/90 mt-2">
                {first ? `${first.branchLabel} Club` : "Official Champion"}
              </p>
            </div>

            <div className="mt-6 lg:mt-8 pt-4 border-t border-zinc-800/90 space-y-3">
              <div className="bg-black/80 rounded-2xl py-3.5 px-4 border border-zinc-800 shadow-inner">
                <span className="text-xs sm:text-sm lg:text-base text-zinc-400 uppercase font-black block">
                  Weight Lost
                </span>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-gymRed font-mono tracking-tight block">
                  {first ? `-${first.kgLost.toFixed(1)} KG` : "—"}
                </span>
              </div>

              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-2xl py-3.5 px-4 border-2 border-amber-400/60 shadow-lg">
                <span className="text-xs sm:text-sm lg:text-base text-amber-300 uppercase font-black block">
                  Grand Cash Prize
                </span>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-amber-400 font-mono tracking-tight block">
                  15,000 AED
                </span>
              </div>
            </div>
          </div>

          {/* 3rd Place (Bronze - Right) */}
          <div className="order-3 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-2 border-amber-700/80 rounded-3xl p-6 sm:p-7 lg:p-8 xl:p-10 text-center relative shadow-2xl transition-transform hover:scale-[1.02] backdrop-blur-md flex flex-col justify-between">
            <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white text-xs sm:text-sm lg:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-xl border border-amber-500/60 whitespace-nowrap">
              🥉 3RD PLACE
            </div>

            <div className="pt-4 lg:pt-6">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white uppercase tracking-tight line-clamp-2">
                {third ? third.name : "To Be Announced"}
              </h3>
              <p className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold text-zinc-400 mt-1">
                {third ? `${third.branchLabel} Club` : "Face Off Fitness"}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/90 space-y-3">
              <div className="bg-black/70 rounded-2xl py-3 px-4 border border-zinc-800">
                <span className="text-xs sm:text-sm lg:text-base text-zinc-400 uppercase font-bold block">
                  Weight Lost
                </span>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-5xl font-black text-gymRed font-mono tracking-tight block">
                  {third ? `-${third.kgLost.toFixed(1)} KG` : "—"}
                </span>
              </div>

              <div className="bg-zinc-900/90 rounded-2xl py-3 px-4 border border-zinc-700/60">
                <span className="text-xs sm:text-sm lg:text-base text-zinc-400 uppercase font-bold block">
                  Cash Prize
                </span>
                <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white font-mono tracking-tight block">
                  3,000 AED
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* TV Footer Watermark */}
      <footer className="w-full pt-3 lg:pt-4 border-t border-zinc-900 flex items-center justify-between text-xs sm:text-sm lg:text-base text-zinc-500 uppercase tracking-widest font-semibold z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <span>Official 30-Day Fitness Challenge</span>
          <span>·</span>
          <span>Verified by Certified Floor Staff</span>
        </div>
        <div>
          <span>Face Off Fitness · Dubai, UAE</span>
        </div>
      </footer>
    </div>
  );
}
