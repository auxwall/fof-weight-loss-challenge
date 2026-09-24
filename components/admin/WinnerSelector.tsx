"use client";

import { useState } from "react";
import WinnerCelebrationCard from "./WinnerCelebrationCard";
import { formatDubai } from "@/lib/dayjs";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Candidate {
  userId: string;
  name: string;
  mobile: string;
  gender: string;
  branchLabel: string;
  day1Weight: number;
  finalWeight: number;
  kgLost: number;
}

interface WinnerInfo {
  position: number;
  userId: string;
  name: string;
  prizeAed: number;
  kgLost: number;
  branchLabel: string;
}

interface WinnerSelectorProps {
  candidates: Candidate[];
  initialWinners: Record<number, WinnerInfo>;
  finalizeDate: string | null;
  isFinalizeAllowed: boolean;
}

export default function WinnerSelector({
  candidates,
  initialWinners,
  finalizeDate,
  isFinalizeAllowed: initialAllowed,
}: WinnerSelectorProps) {
  const [winners, setWinners] = useState<Record<number, WinnerInfo>>(initialWinners);
  const [adminOverride, setAdminOverride] = useState(!initialAllowed);
  const [showCelebration, setShowCelebration] = useState(
    Object.keys(initialWinners).length >= 3
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnlocked = initialAllowed || adminOverride;

  const handleAssign = (position: number, candidate: Candidate) => {
    setWinners((prev) => ({
      ...prev,
      [position]: {
        position,
        userId: candidate.userId,
        name: candidate.name,
        prizeAed: position === 1 ? 15000 : position === 2 ? 5000 : 3000,
        kgLost: candidate.kgLost,
        branchLabel: candidate.branchLabel,
      },
    }));
  };

  const handleConfirmWinners = async () => {
    if (!winners[1] || !winners[2] || !winners[3]) {
      setError("Please select all 3 winners (1st, 2nd, and 3rd place) before confirming.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload = [
        { position: 1, userId: winners[1].userId },
        { position: 2, userId: winners[2].userId },
        { position: 3, userId: winners[3].userId },
      ];

      const res = await fetch("/api/admin/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winners: payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to confirm winners.");
        setSaving(false);
        return;
      }

      setShowCelebration(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // If celebration view is active, render the celebration podium
  if (showCelebration) {
    return (
      <WinnerCelebrationCard
        winners={winners}
        onReset={() => setShowCelebration(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Lock & Status Banner */}
      <div className="gym-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gymRed" />
            <h2 className="text-sm font-bold text-white uppercase">Official Finalization Cut-Off</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Finalize Date:{" "}
            <strong className="text-zinc-200 font-mono">
              {finalizeDate ? formatDubai(finalizeDate) : "Not configured (always open)"}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!initialAllowed ? (
            <button
              type="button"
              onClick={() => setAdminOverride(!adminOverride)}
              className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              {adminOverride ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Override Active</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Enable Admin Override</span>
                </>
              )}
            </button>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finalize Window Open</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gymRed shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selected Winner Slots */}
      <div className="grid sm:grid-cols-3 gap-3">
        {/* 1st Place Slot */}
        <div
          className={`gym-card rounded-2xl p-4 border-2 transition-all ${
            winners[1]
              ? "border-amber-400/90 bg-amber-950/15"
              : "border-dashed border-zinc-700 bg-zinc-900/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>1st Place · 15,000 AED</span>
            </span>
            {winners[1] && (
              <button
                type="button"
                onClick={() => setWinners((p) => { const n = { ...p }; delete n[1]; return n; })}
                className="text-[10px] text-zinc-500 hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
          {winners[1] ? (
            <div>
              <div className="text-base font-black text-white uppercase">{winners[1].name}</div>
              <div className="text-xs text-zinc-400">{winners[1].branchLabel}</div>
              <div className="mt-2 text-lg font-black text-gymRed font-mono">
                -{winners[1].kgLost.toFixed(1)} KG
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-zinc-500 text-xs">
              Select 1st Place from table below
            </div>
          )}
        </div>

        {/* 2nd Place Slot */}
        <div
          className={`gym-card rounded-2xl p-4 border-2 transition-all ${
            winners[2]
              ? "border-zinc-300 bg-zinc-900/60"
              : "border-dashed border-zinc-700 bg-zinc-900/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-300 flex items-center gap-1">
              <Medal className="w-3.5 h-3.5" />
              <span>2nd Place · 5,000 AED</span>
            </span>
            {winners[2] && (
              <button
                type="button"
                onClick={() => setWinners((p) => { const n = { ...p }; delete n[2]; return n; })}
                className="text-[10px] text-zinc-500 hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
          {winners[2] ? (
            <div>
              <div className="text-base font-black text-white uppercase">{winners[2].name}</div>
              <div className="text-xs text-zinc-400">{winners[2].branchLabel}</div>
              <div className="mt-2 text-lg font-black text-gymRed font-mono">
                -{winners[2].kgLost.toFixed(1)} KG
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-zinc-500 text-xs">
              Select 2nd Place from table below
            </div>
          )}
        </div>

        {/* 3rd Place Slot */}
        <div
          className={`gym-card rounded-2xl p-4 border-2 transition-all ${
            winners[3]
              ? "border-amber-700 bg-amber-950/20"
              : "border-dashed border-zinc-700 bg-zinc-900/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-700 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>3rd Place · 3,000 AED</span>
            </span>
            {winners[3] && (
              <button
                type="button"
                onClick={() => setWinners((p) => { const n = { ...p }; delete n[3]; return n; })}
                className="text-[10px] text-zinc-500 hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>
          {winners[3] ? (
            <div>
              <div className="text-base font-black text-white uppercase">{winners[3].name}</div>
              <div className="text-xs text-zinc-400">{winners[3].branchLabel}</div>
              <div className="mt-2 text-lg font-black text-gymRed font-mono">
                -{winners[3].kgLost.toFixed(1)} KG
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-zinc-500 text-xs">
              Select 3rd Place from table below
            </div>
          )}
        </div>
      </div>

      {/* Confirm & Reveal Button */}
      {winners[1] && winners[2] && winners[3] && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleConfirmWinners}
            disabled={saving}
            className="py-3.5 px-8 rounded-2xl bg-gymRed hover:bg-gymRed-hover text-white font-black text-sm tracking-wider uppercase transition-all shadow-red-glow-lg inline-flex items-center gap-2.5 transform active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Winners...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Lock In Winners & Reveal Instagram Podium</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Candidates Leaderboard Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          CANDIDATES RANKED BY KG LOST ({candidates.length} FINISHED)
        </h3>

        <div className="gym-card rounded-2xl overflow-hidden border-surface-border shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="p-3.5 font-semibold text-center">Rank</th>
                  <th className="p-3.5 font-semibold">Participant</th>
                  <th className="p-3.5 font-semibold">Club</th>
                  <th className="p-3.5 font-semibold text-center">Day-1</th>
                  <th className="p-3.5 font-semibold text-center">Final</th>
                  <th className="p-3.5 font-semibold text-center">Absolute KG Lost</th>
                  <th className="p-3.5 font-semibold text-right">Assign Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                      No participants have completed final weigh-in yet.
                    </td>
                  </tr>
                ) : (
                  candidates.map((c, index) => {
                    const isFirst = winners[1]?.userId === c.userId;
                    const isSecond = winners[2]?.userId === c.userId;
                    const isThird = winners[3]?.userId === c.userId;

                    return (
                      <tr key={c.userId} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="p-3.5 text-center font-bold text-zinc-400">
                          {index === 0 ? "🥇 1" : index === 1 ? "🥈 2" : index === 2 ? "🥉 3" : index + 1}
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-white text-sm">{c.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">ID: {c.userId}</div>
                        </td>

                        <td className="p-3.5 font-medium text-zinc-300">{c.branchLabel}</td>

                        <td className="p-3.5 text-center font-mono font-semibold text-zinc-300">
                          {c.day1Weight.toFixed(1)} kg
                        </td>

                        <td className="p-3.5 text-center font-mono font-semibold text-zinc-300">
                          {c.finalWeight.toFixed(1)} kg
                        </td>

                        <td className="p-3.5 text-center font-mono font-black text-sm text-gymRed">
                          -{c.kgLost.toFixed(1)} kg
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            disabled={!isUnlocked}
                            onClick={() => handleAssign(1, c)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                              isFirst
                                ? "bg-amber-400 text-black shadow-sm"
                                : "bg-zinc-800 text-zinc-300 hover:bg-amber-400 hover:text-black"
                            }`}
                          >
                            {isFirst ? "✓ 1st" : "1st"}
                          </button>

                          <button
                            type="button"
                            disabled={!isUnlocked}
                            onClick={() => handleAssign(2, c)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                              isSecond
                                ? "bg-zinc-300 text-black shadow-sm"
                                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-300 hover:text-black"
                            }`}
                          >
                            {isSecond ? "✓ 2nd" : "2nd"}
                          </button>

                          <button
                            type="button"
                            disabled={!isUnlocked}
                            onClick={() => handleAssign(3, c)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                              isThird
                                ? "bg-amber-700 text-white shadow-sm"
                                : "bg-zinc-800 text-zinc-300 hover:bg-amber-700 hover:text-white"
                            }`}
                          >
                            {isThird ? "✓ 3rd" : "3rd"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
