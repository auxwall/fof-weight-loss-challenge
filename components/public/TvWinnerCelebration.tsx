"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

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
}

export default function TvWinnerCelebration({
  winners,
  top10 = [],
}: TvWinnerCelebrationProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

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

  // Auto-refresh every 60 seconds to pick up live database updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      router.refresh();
    }, 60000);
    return () => clearInterval(refreshInterval);
  }, [router]);

  // Celebratory Confetti Loop
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

    fireCenter();
    const t1 = setTimeout(fireLeft, 350);
    const t2 = setTimeout(fireRight, 700);

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
    }, 4000);

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
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col justify-between overflow-x-hidden select-none font-sans px-4 sm:px-8 lg:px-14 xl:px-20 py-4 lg:py-6">
      {/* Background Ambience Dynamic Lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[900px] xl:w-[1300px] h-[600px] bg-gymRed/15 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed top-1/2 left-1/5 w-[500px] xl:w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-1/5 w-[500px] xl:w-[700px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top TV Broadcast Bar */}
      <header className="w-full flex items-center justify-between z-20 border-b border-zinc-800/80 pb-3 lg:pb-4 gap-4">
        {/* Brand Logo & Live Badge */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative w-36 h-12 sm:w-48 sm:h-14 lg:w-60 lg:h-16 xl:w-64 xl:h-18">
            <Image
              src="/logo.png"
              alt="Face Off Fitness"
              fill
              className="object-contain object-left"
              priority
            />
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-800/60 text-gymRed text-xs font-black uppercase tracking-wider animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>TV Live View</span>
          </div>
        </div>

        {/* Dubai Live Clock & Fullscreen Toggle */}
        <div className="flex items-center gap-4 lg:gap-8">
          {currentTime && (
            <div className="text-right">
              <span className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-mono font-black text-white tracking-widest block">
                {currentTime}
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-400 font-semibold block">
                {currentDate} · Dubai, UAE
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

      {/* Main TV Showcase Content - Single Integrated Page */}
      <main className="w-full flex-1 flex flex-col justify-start items-center py-6 lg:py-8 z-10 space-y-12 lg:space-y-16">
        {/* Official Announcement Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs sm:text-sm lg:text-base font-black uppercase tracking-widest shadow-lg">
            <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400 animate-bounce" />
            <span>30-Day Weight Loss Challenge</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase text-white tracking-tight leading-none drop-shadow-2xl">
            Official Winner <span className="text-gymRed">Announcement</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-xl xl:text-2xl text-zinc-400 font-semibold tracking-wide">
            Face Off Fitness Dubai · 19,000 AED Total Cash Prize Pool
          </p>
        </div>

        {/* 1. PODIUM CHAMPIONS */}
        <section className="w-full max-w-[1850px] grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 xl:gap-10 items-stretch md:items-end pt-4 lg:pt-6">
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
                  {second ? `-${Number(second.kgLost).toFixed(3)} KG` : "—"}
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

          {/* 1st Place (Gold Champion - Center Hero) */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 border-4 border-amber-400 rounded-3xl p-7 sm:p-8 lg:p-10 xl:p-12 text-center relative shadow-2xl shadow-amber-950/50 md:-translate-y-6 lg:-translate-y-8 transition-transform hover:scale-[1.03] backdrop-blur-md flex flex-col justify-between">
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
                  {first ? `-${Number(first.kgLost).toFixed(3)} KG` : "—"}
                </span>
              </div>

              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-2xl py-3.5 px-4 border-2 border-amber-400/60 shadow-lg">
                <span className="text-xs sm:text-sm lg:text-base text-amber-300 uppercase font-black block">
                  Grand Cash Prize
                </span>
                <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-amber-400 font-mono tracking-tight block">
                  10,000 AED
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
                  {third ? `-${Number(third.kgLost).toFixed(3)} KG` : "—"}
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
        </section>

        {/* 2. OFFICIAL TOP 10 LEADERBOARD */}
        <section className="w-full max-w-[1850px] bg-zinc-950/90 border border-zinc-800/90 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Top 10 Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Medal className="w-6 h-6 lg:w-8 lg:h-8" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                  <span>Official Top 10 Leaderboard</span>
                  <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-gymRed/20 text-gymRed border border-gymRed/30 font-bold uppercase">
                    Top 10 Finalists
                  </span>
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-zinc-400 font-medium">
                  Strictly verified 30-day challenge results · Disqualified participants are completely excluded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-400">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Showing {top10.length} {top10.length === 1 ? "Participant" : "Participants"}
                </span>
              </div>
            </div>
          </div>

          {/* Top 10 Participants Table / Rows */}
          {top10.length > 0 ? (
            <div className="space-y-3">
              {/* Table Header (Visible on Desktop / TV) */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 text-xs font-black uppercase tracking-wider text-zinc-400">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-4">Participant Name</div>
                <div className="col-span-2 text-center">Club Branch</div>
                <div className="col-span-2 text-right">Start Weight</div>
                <div className="col-span-2 text-right">Final Weight</div>
                <div className="col-span-1 text-right">Total Lost</div>
              </div>

              {/* Table Rows */}
              {top10.map((user) => {
                const isFirst = user.rank === 1;
                const isSecond = user.rank === 2;
                const isThird = user.rank === 3;

                let rowBorderColor = "border-zinc-800/80 hover:border-zinc-700";
                let rowBg = "bg-zinc-900/60 hover:bg-zinc-900/90";
                let rankBadge = (
                  <span className="w-10 h-10 rounded-2xl bg-zinc-800 text-zinc-300 font-mono font-black text-lg flex items-center justify-center border border-zinc-700">
                    #{user.rank}
                  </span>
                );
                let awardTag = null;

                if (isFirst) {
                  rowBorderColor = "border-amber-400/80 bg-gradient-to-r from-amber-500/10 via-zinc-900/90 to-zinc-950";
                  rankBadge = (
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xl flex items-center justify-center shadow-lg border-2 border-amber-200">
                      🥇 1
                    </span>
                  );
                  awardTag = (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/50 text-xs font-black uppercase tracking-wider">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>10,000 AED Cash Prize</span>
                    </span>
                  );
                } else if (isSecond) {
                  rowBorderColor = "border-zinc-300/70 bg-gradient-to-r from-zinc-300/10 via-zinc-900/90 to-zinc-950";
                  rankBadge = (
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-400 text-black font-black text-xl flex items-center justify-center shadow-lg border-2 border-white">
                      🥈 2
                    </span>
                  );
                  awardTag = (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-300/20 text-zinc-200 border border-zinc-300/50 text-xs font-black uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5" />
                      <span>5,000 AED Cash Prize</span>
                    </span>
                  );
                } else if (isThird) {
                  rowBorderColor = "border-amber-700/70 bg-gradient-to-r from-amber-700/10 via-zinc-900/90 to-zinc-950";
                  rankBadge = (
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white font-black text-xl flex items-center justify-center shadow-lg border-2 border-amber-500">
                      🥉 3
                    </span>
                  );
                  awardTag = (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700/20 text-amber-400 border border-amber-600/50 text-xs font-black uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5" />
                      <span>3,000 AED Cash Prize</span>
                    </span>
                  );
                } else {
                  awardTag = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700 text-[11px] font-bold uppercase tracking-wider">
                      <span>Top 10 Finalist</span>
                    </span>
                  );
                }

                return (
                  <div
                    key={user.userId || user.rank}
                    className={`w-full rounded-2xl border ${rowBorderColor} ${rowBg} p-4 sm:p-5 transition-all flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-3 lg:gap-4 shadow-lg`}
                  >
                    {/* Rank Indicator */}
                    <div className="col-span-1 flex items-center justify-between lg:justify-center">
                      <div className="flex items-center gap-3">
                        {rankBadge}
                        <span className="lg:hidden text-base font-black uppercase text-white">
                          Rank #{user.rank}
                        </span>
                      </div>
                      <div className="lg:hidden">{awardTag}</div>
                    </div>

                    {/* Participant Name & Awards */}
                    <div className="col-span-4 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg sm:text-xl lg:text-2xl font-black uppercase text-white tracking-tight">
                          {user.name}
                        </h4>
                        <div className="hidden lg:inline-block">{awardTag}</div>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-400 lg:hidden">
                        {user.branchLabel} Club
                      </p>
                    </div>

                    {/* Club Branch (Desktop) */}
                    <div className="hidden lg:block col-span-2 text-center">
                      <span className="inline-block px-3 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs font-bold text-zinc-300 uppercase">
                        {user.branchLabel}
                      </span>
                    </div>

                    {/* Day 1 Start Weight */}
                    <div className="col-span-2 flex justify-between lg:block lg:text-right">
                      <span className="text-xs text-zinc-400 uppercase lg:hidden">
                        Start Weight:
                      </span>
                      <div>
                        <span className="text-base sm:text-lg lg:text-xl font-mono font-bold text-zinc-200">
                          {user.day1WeightKg > 0
                            ? `${user.day1WeightKg.toFixed(3)}`
                            : "—"}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono ml-1">KG</span>
                      </div>
                    </div>

                    {/* Final Weigh-in Weight */}
                    <div className="col-span-2 flex justify-between lg:block lg:text-right">
                      <span className="text-xs text-zinc-400 uppercase lg:hidden">
                        Final Weight:
                      </span>
                      <div>
                        <span className="text-base sm:text-lg lg:text-xl font-mono font-bold text-zinc-200">
                          {user.finalWeightKg > 0
                            ? `${user.finalWeightKg.toFixed(3)}`
                            : "—"}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono ml-1">KG</span>
                      </div>
                    </div>

                    {/* Total Weight Lost (Hero Metric) */}
                    <div className="col-span-1 flex justify-between items-center lg:block lg:text-right pt-2 lg:pt-0 border-t border-zinc-800 lg:border-t-0">
                      <span className="text-xs font-bold text-zinc-400 uppercase lg:hidden">
                        Total Lost:
                      </span>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-mono font-black text-gymRed tracking-tight block">
                          -{Number(user.kgLost).toFixed(3)}
                        </span>
                        <span className="text-[10px] font-black text-gymRed/80 uppercase tracking-widest block">
                          KG LOST
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State (When no completed participants yet) */
            <div className="py-16 text-center space-y-4 rounded-3xl bg-zinc-900/40 border border-zinc-800/80">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scale className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase text-white tracking-tight">
                  Challenge In Progress
                </h3>
                <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
                  Top 10 leaderboard rankings will update live here as participants complete their verified Day-30 final weigh-ins.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/80 text-xs font-bold text-zinc-400 uppercase border border-zinc-700">
                <span>Any disqualified participants are strictly excluded</span>
              </div>
            </div>
          )}

          {/* Table Footer Disqualification Guarantee */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Eligibility Policy: Only participants who completed both Day 1 and Day 30 weigh-ins within the official window are ranked. Disqualified participants do not appear.
              </span>
            </div>
            <div className="shrink-0 font-mono">
              Verified Face Off Fitness Terminal
            </div>
          </div>
        </section>
      </main>

      {/* TV Footer Watermark */}
      <footer className="w-full pt-6 lg:pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-zinc-500 uppercase tracking-widest font-semibold z-10 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
          <span>Official 30-Day Fitness Challenge</span>
          <span>·</span>
          <span>Verified by Certified Floor Staff</span>
          <span>·</span>
          <span>Top 10 Official Leaderboard</span>
        </div>
        <div>
          <span>Face Off Fitness · Dubai, UAE</span>
        </div>
      </footer>
    </div>
  );
}
