"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  Maximize2,
  Minimize2,
  Trophy,
  Medal,
  Award,
  Scale,
  CheckCircle2,
  Radio,
  Wifi,
} from "lucide-react";

export interface WinnerDisplayInfo {
  position: number;
  name: string;
  prizeAed: number;
  kgLost: number;
  branchLabel: string;
}

export interface TopLeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  branchLabel: string;
  day1WeightKg: number;
  finalWeightKg: number;
  kgLost: number;
  prizeAed?: number;
  isOfficialWinner?: boolean;
}

interface TvWinnerCelebrationProps {
  winners: Record<number, WinnerDisplayInfo>;
  top10?: TopLeaderboardUser[];
  totalRegistered?: number;
}

export default function TvWinnerCelebration({
  winners: initialWinners,
  top10: initialTop10 = [],
  totalRegistered: initialTotalRegistered = 0,
}: TvWinnerCelebrationProps) {
  const [winners, setWinners] = useState<Record<number, WinnerDisplayInfo>>(initialWinners);
  const [top10, setTop10] = useState<TopLeaderboardUser[]>(initialTop10);
  const [totalRegistered, setTotalRegistered] = useState<number>(initialTotalRegistered);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Sync state if initial props change
  useEffect(() => {
    setWinners(initialWinners);
    setTop10(initialTop10);
    setTotalRegistered(initialTotalRegistered);
  }, [initialWinners, initialTop10, initialTotalRegistered]);

  // Live time ticker
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
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          timeZone: "Asia/Dubai",
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch latest winners, leaderboard, and total registration count
  const refreshData = async () => {
    try {
      const res = await fetch(`/api/public/winners?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        if (data.winners) setWinners(data.winners);
        if (data.top10) setTop10(data.top10);
        if (typeof data.totalRegistered === "number") setTotalRegistered(data.totalRegistered);
      }
    } catch (err) {
      console.error("Failed to refresh winners:", err);
    }
  };

  // Real-time Push via Server-Sent Events (SSE) with fallback polling
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/public/winners/stream");

        eventSource.onmessage = () => {
          // Immediately trigger refresh on any message/ping
          refreshData();
        };

        eventSource.onerror = () => {
          eventSource?.close();
          setTimeout(connectSSE, 4000);
        };
      } catch (e) {
        // SSE not supported or blocked
      }
    };

    connectSSE();

    // Fast failsafe polling every 6s so updates never lag behind
    fallbackInterval = setInterval(refreshData, 6000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  // Celebratory Confetti Loop
  useEffect(() => {
    const fireLeft = () => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.65 },
        colors: ["#EC1C23", "#FFD700", "#FFFFFF", "#FFA500"],
        zIndex: 9999,
      });
    };

    const fireRight = () => {
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.65 },
        colors: ["#EC1C23", "#FFD700", "#FFFFFF", "#FFA500"],
        zIndex: 9999,
      });
    };

    const fireCenter = () => {
      confetti({
        particleCount: 60,
        spread: 100,
        origin: { x: 0.5, y: 0.25 },
        colors: ["#EC1C23", "#FFD700", "#FFFFFF", "#FF3B30"],
        zIndex: 9999,
      });
    };

    fireCenter();
    const t1 = setTimeout(fireLeft, 400);
    const t2 = setTimeout(fireRight, 800);

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
    }, 6000);

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

  const first = (winners as any)?.[1] || (winners as any)?.["1"];
  const second = (winners as any)?.[2] || (winners as any)?.["2"];
  const third = (winners as any)?.[3] || (winners as any)?.["3"];

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col justify-between overflow-x-hidden select-none font-sans p-3 sm:p-5 lg:p-6 box-border">
      {/* Background Ambience Dynamic Lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[60vw] max-w-[800px] h-[350px] bg-gymRed/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed top-1/2 left-8 w-[30vw] max-w-[450px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-8 w-[30vw] max-w-[450px] h-[300px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between shrink-0 border-b border-zinc-800/80 pb-3 gap-3">
        {/* Brand Logo & Live Registration Counter */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="relative w-28 h-8 sm:w-40 sm:h-11 lg:w-48 lg:h-12">
            <Image
              src="/logo.png"
              alt="Face Off Fitness"
              fill
              className="object-contain object-left"
              priority
            />
          </div>

          {/* Live Total Registered Count Display */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-950/70 via-zinc-900 to-zinc-950 border border-gymRed/40 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-gymRed animate-ping" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-300">
              Total Registered:
            </span>
            <span className="text-xs sm:text-sm lg:text-base font-black font-mono text-white tracking-wide">
              {totalRegistered.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Dubai Live Clock & Fullscreen Toggle */}
        <div className="flex items-center gap-3 sm:gap-5">
          {currentTime && (
            <div className="text-right">
              <span className="text-xs sm:text-base lg:text-lg xl:text-xl font-mono font-black text-white tracking-widest block">
                {currentTime}
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">
                {currentDate} · Dubai, UAE
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all shadow-md hover:scale-105"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Single-Window Showcase: Podium + Top 10 Leaders together without toggle */}
      <main className="w-full flex-1 flex flex-col justify-start items-center py-3 sm:py-4 z-10 gap-5 max-w-7xl mx-auto">
        {/* Title Announcement Header */}
        <div className="text-center shrink-0 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>30-Day Weight Loss Challenge</span>
          </div>

          <h1 className="text-xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-tight leading-tight drop-shadow-xl">
            Official Winner & <span className="text-gymRed">Top 10 Leaders</span>
          </h1>

          <p className="text-[10px] sm:text-xs text-zinc-400 font-semibold tracking-wide">
            Face Off Fitness Dubai · 18,000 AED Total Cash Prize Pool
          </p>
        </div>

        {/* Section 1: Top 3 Podium Champions */}
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-stretch md:items-end">
            {/* 2nd Place (Silver - Left) */}
            <div className="order-2 md:order-1 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-2 border-zinc-400/80 rounded-2xl p-4 sm:p-5 text-center relative shadow-2xl backdrop-blur-md flex flex-col justify-between min-h-[190px] sm:min-h-[220px]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 text-black text-[10px] sm:text-xs font-black uppercase tracking-widest px-3.5 py-0.5 rounded-full shadow-xl border border-white/60 whitespace-nowrap">
                🥈 2ND PLACE
              </div>

              <div className="pt-2">
                <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight line-clamp-1">
                  {second ? second.name : "To Be Announced"}
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-zinc-400 mt-0.5">
                  {second ? `${second.branchLabel} Club` : "Face Off Fitness"}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/90 flex items-center justify-around gap-2">
                <div className="bg-black/70 rounded-xl py-1.5 px-3 border border-zinc-800 flex-1">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block">
                    Weight Lost
                  </span>
                  <span className="text-base sm:text-xl font-black text-gymRed font-mono tracking-tight block">
                    {second ? `-${Number(second.kgLost).toFixed(3)} KG` : "—"}
                  </span>
                </div>

                <div className="bg-zinc-900/90 rounded-xl py-1.5 px-3 border border-zinc-700/60 flex-1">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block">
                    Cash Prize
                  </span>
                  <span className="text-sm sm:text-lg font-black text-white font-mono tracking-tight block">
                    5,000 AED
                  </span>
                </div>
              </div>
            </div>

            {/* 1st Place (Gold Champion - Center Hero) */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 border-4 border-amber-400 rounded-2xl p-4 sm:p-6 text-center relative shadow-2xl shadow-amber-950/40 md:-translate-y-2 backdrop-blur-md flex flex-col justify-between min-h-[220px] sm:min-h-[250px]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-2xl border-2 border-amber-200 flex items-center gap-1.5 whitespace-nowrap">
                <Trophy className="w-3.5 h-3.5 text-black shrink-0" />
                <span>🥇 1ST PLACE CHAMPION</span>
              </div>

              <div className="pt-2">
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight line-clamp-1">
                  {first ? first.name : "To Be Announced"}
                </h2>
                <p className="text-xs sm:text-sm font-black text-amber-400/90 mt-0.5">
                  {first ? `${first.branchLabel} Club` : "Official Champion"}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/90 flex items-center justify-around gap-2">
                <div className="bg-black/80 rounded-xl py-1.5 px-3 border border-zinc-800 shadow-inner flex-1">
                  <span className="text-[9px] text-zinc-400 uppercase font-black block">
                    Weight Lost
                  </span>
                  <span className="text-lg sm:text-2xl font-black text-gymRed font-mono tracking-tight block">
                    {first ? `-${Number(first.kgLost).toFixed(3)} KG` : "—"}
                  </span>
                </div>

                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-xl py-1.5 px-3 border-2 border-amber-400/60 shadow-lg flex-1">
                  <span className="text-[9px] text-amber-300 uppercase font-black block">
                    Grand Prize
                  </span>
                  <span className="text-base sm:text-2xl font-black text-amber-400 font-mono tracking-tight block">
                    10,000 AED
                  </span>
                </div>
              </div>
            </div>

            {/* 3rd Place (Bronze - Right) */}
            <div className="order-3 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-2 border-amber-700/80 rounded-2xl p-4 sm:p-5 text-center relative shadow-2xl backdrop-blur-md flex flex-col justify-between min-h-[190px] sm:min-h-[220px]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-3.5 py-0.5 rounded-full shadow-xl border border-amber-500/60 whitespace-nowrap">
                🥉 3RD PLACE
              </div>

              <div className="pt-2">
                <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight line-clamp-1">
                  {third ? third.name : "To Be Announced"}
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-zinc-400 mt-0.5">
                  {third ? `${third.branchLabel} Club` : "Face Off Fitness"}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/90 flex items-center justify-around gap-2">
                <div className="bg-black/70 rounded-xl py-1.5 px-3 border border-zinc-800 flex-1">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block">
                    Weight Lost
                  </span>
                  <span className="text-base sm:text-xl font-black text-gymRed font-mono tracking-tight block">
                    {third ? `-${Number(third.kgLost).toFixed(3)} KG` : "—"}
                  </span>
                </div>

                <div className="bg-zinc-900/90 rounded-xl py-1.5 px-3 border border-zinc-700/60 flex-1">
                  <span className="text-[9px] text-zinc-400 uppercase font-bold block">
                    Cash Prize
                  </span>
                  <span className="text-sm sm:text-lg font-black text-white font-mono tracking-tight block">
                    3,000 AED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Top 10 Leaders on the SAME window */}
        <section className="w-full bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Medal className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
                <span>Top 10 Leaders</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gymRed/20 text-gymRed border border-gymRed/30 font-bold uppercase">
                  Live Rankings
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified 30-Day Floor Weigh-Ins</span>
            </div>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-2">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Participant Name</div>
            <div className="col-span-3 text-center">Club Branch</div>
            <div className="col-span-2 text-right">Start / Final</div>
            <div className="col-span-2 text-right">Total Lost</div>
          </div>

          {/* Leaderboard Rows */}
          <div className="flex flex-col gap-1.5 mt-2">
            {top10.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                No verified participants on the leaderboard yet.
              </div>
            ) : (
              top10.slice(0, 10).map((user) => {
                const isFirst = user.rank === 1;
                const isSecond = user.rank === 2;
                const isThird = user.rank === 3;

                let rowBorder = "border-zinc-800/80";
                let rowBg = "bg-zinc-900/50";
                let rankLabel = `#${user.rank}`;

                if (isFirst) {
                  rowBorder = "border-amber-400/80";
                  rowBg = "bg-gradient-to-r from-amber-500/20 via-zinc-900/90 to-zinc-950";
                  rankLabel = "🥇 1";
                } else if (isSecond) {
                  rowBorder = "border-zinc-300/80";
                  rowBg = "bg-gradient-to-r from-zinc-300/20 via-zinc-900/90 to-zinc-950";
                  rankLabel = "🥈 2";
                } else if (isThird) {
                  rowBorder = "border-amber-700/80";
                  rowBg = "bg-gradient-to-r from-amber-700/20 via-zinc-900/90 to-zinc-950";
                  rankLabel = "🥉 3";
                }

                return (
                  <div
                    key={user.userId || user.rank}
                    className={`w-full rounded-xl border ${rowBorder} ${rowBg} px-3 py-1.5 sm:py-2 flex items-center justify-between md:grid md:grid-cols-12 gap-2 shadow-sm text-xs sm:text-sm`}
                  >
                    <div className="col-span-1 flex items-center md:justify-center">
                      <span className="font-mono font-black text-xs sm:text-sm text-white">
                        {rankLabel}
                      </span>
                    </div>

                    <div className="col-span-4 font-black uppercase text-white truncate">
                      {user.name}
                    </div>

                    <div className="hidden md:block col-span-3 text-center text-zinc-300 text-xs truncate">
                      {user.branchLabel}
                    </div>

                    <div className="hidden md:block col-span-2 text-right font-mono text-zinc-400 text-xs">
                      {user.day1WeightKg.toFixed(1)} → {user.finalWeightKg.toFixed(1)} kg
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="font-mono font-black text-gymRed text-sm sm:text-base">
                        -{Number(user.kgLost).toFixed(3)} KG
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full shrink-0 pt-3 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-semibold z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
          <span>Official 30-Day Fitness Challenge</span>
          <span>·</span>
          <span>Verified Floor Staff</span>
          <span>·</span>
          <span>Live Results</span>
        </div>
        <div>
          <span>Face Off Fitness · Dubai, UAE</span>
        </div>
      </footer>
    </div>
  );
}
