import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDaysRemaining } from "@/lib/dayjs";
import { WinnerDisplayInfo, TopLeaderboardUser } from "@/components/public/TvWinnerCelebration";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch official locked winners if any exist
    const existingWinners = await prisma.winner.findMany({
      include: {
        user: {
          include: {
            registeredBranch: true,
            weighIns: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });

    // 2. Total registered count (all registered participants in challenge)
    const totalRegisteredCount = await prisma.user.count();

    // 3. Fetch all completed candidates
    const allUsers = await prisma.user.findMany({
      where: {
        status: { not: "DISQUALIFIED" },
        disqualifiedAt: null,
      },
      include: {
        registeredBranch: true,
        weighIns: true,
      },
    });

    const completedCandidates = allUsers
      .map((u) => {
        if (u.status === "DISQUALIFIED" || u.disqualifiedAt !== null) return null;
        if (u.status === "ACTIVE" && u.deadlineDate) {
          const daysInfo = getDaysRemaining(u.deadlineDate);
          if (daysInfo.isExpired) return null;
        }

        const day1 = u.weighIns.find((w) => w.type === "DAY_1");
        const finalW = u.weighIns.find((w) => w.type === "FINAL");
        if (!day1 || !finalW) return null;

        const day1Weight = Number(day1.weightKg);
        const finalWeight = Number(finalW.weightKg);
        const kgLost = parseFloat((day1Weight - finalWeight).toFixed(3));
        if (kgLost <= 0) return null;

        return {
          userId: u.id,
          name: u.name,
          branchLabel: u.registeredBranch.label,
          day1WeightKg: day1Weight,
          finalWeightKg: finalWeight,
          kgLost,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.kgLost - a.kgLost);

    const validOfficialWinners = existingWinners.filter((w) => {
      if (!w.user) return false;
      if (w.user.status === "DISQUALIFIED" || w.user.disqualifiedAt !== null) return false;
      if (
        w.user.status === "ACTIVE" &&
        w.user.deadlineDate &&
        getDaysRemaining(w.user.deadlineDate).isExpired
      ) {
        return false;
      }
      return true;
    });

    const winnersMap: Record<number, WinnerDisplayInfo> = {};
    const officialWinnerUserIds = new Set<string>();

    for (const w of validOfficialWinners) {
      winnersMap[w.position] = {
        position: w.position,
        name: w.user.name,
        prizeAed: w.prizeAed,
        kgLost: Number(w.kgLost),
        branchLabel: w.user.registeredBranch.label,
      };
      officialWinnerUserIds.add(w.userId);
    }

    const top10: TopLeaderboardUser[] = [];
    const prizeLookup: Record<number, number> = { 1: 10000, 2: 5000, 3: 3000 };

    if (validOfficialWinners.length > 0) {
      for (const pos of [1, 2, 3]) {
        const w = validOfficialWinners.find((win) => win.position === pos);
        if (w) {
          const day1 = w.user.weighIns.find((wi) => wi.type === "DAY_1");
          const finalW = w.user.weighIns.find((wi) => wi.type === "FINAL");
          top10.push({
            rank: pos,
            userId: w.userId,
            name: w.user.name,
            branchLabel: w.user.registeredBranch.label,
            day1WeightKg: day1 ? Number(day1.weightKg) : 0,
            finalWeightKg: finalW ? Number(finalW.weightKg) : 0,
            kgLost: Number(w.kgLost),
            prizeAed: w.prizeAed,
            isOfficialWinner: true,
          });
        }
      }

      const remainingCandidates = completedCandidates.filter(
        (c) => !officialWinnerUserIds.has(c.userId)
      );

      let nextRank = top10.length + 1;
      for (const cand of remainingCandidates) {
        if (top10.length >= 10) break;
        top10.push({
          rank: nextRank++,
          userId: cand.userId,
          name: cand.name,
          branchLabel: cand.branchLabel,
          day1WeightKg: cand.day1WeightKg,
          finalWeightKg: cand.finalWeightKg,
          kgLost: cand.kgLost,
          prizeAed: undefined,
          isOfficialWinner: false,
        });
      }
    } else {
      // If no official winners locked yet, show top candidates in leaderboard without locking winners
      completedCandidates.slice(0, 10).forEach((c, idx) => {
        const rank = idx + 1;
        top10.push({
          rank,
          userId: c.userId,
          name: c.name,
          branchLabel: c.branchLabel,
          day1WeightKg: c.day1WeightKg,
          finalWeightKg: c.finalWeightKg,
          kgLost: c.kgLost,
          prizeAed: prizeLookup[rank],
          isOfficialWinner: false,
        });
      });
    }

    return NextResponse.json(
      {
        success: true,
        winners: winnersMap,
        top10,
        totalRegistered: totalRegisteredCount,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch live winners data:", error);
    return NextResponse.json({ error: "Failed to fetch winners" }, { status: 500 });
  }
}
