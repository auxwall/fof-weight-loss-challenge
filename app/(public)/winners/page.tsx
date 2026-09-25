import prisma from "@/lib/prisma";
import TvWinnerCelebration, {
  WinnerDisplayInfo,
  TopLeaderboardUser,
} from "@/components/public/TvWinnerCelebration";
import { getDaysRemaining } from "@/lib/dayjs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Official Winner & Top 10 Announcement | Face Off Fitness",
  description:
    "Official winner announcement and Top 10 leaderboard for Face Off Fitness 30-Day Weight Loss Challenge.",
};

export default async function PublicWinnersTvPage() {
  // 1. Fetch official locked winners if any exist
  const [existingWinners, totalRegisteredCount, allUsers] = await Promise.all([
    prisma.winner.findMany({
      include: {
        user: {
          include: {
            registeredBranch: true,
            weighIns: true,
          },
        },
      },
      orderBy: { position: "asc" },
    }),
    prisma.user.count(),
    prisma.user.findMany({
      where: {
        status: { not: "DISQUALIFIED" },
        disqualifiedAt: null,
      },
      include: {
        registeredBranch: true,
        weighIns: true,
      },
    }),
  ]);

  // 3. Strict disqualification filter & calculate verified weight loss
  const completedCandidates = allUsers
    .map((u) => {
      // Rule 1: Exclude if status is DISQUALIFIED or disqualifiedAt is set
      if (u.status === "DISQUALIFIED" || u.disqualifiedAt !== null) {
        return null;
      }

      // Rule 2: Exclude if ACTIVE and return window deadline is expired
      if (u.status === "ACTIVE" && u.deadlineDate) {
        const daysInfo = getDaysRemaining(u.deadlineDate);
        if (daysInfo.isExpired) {
          return null;
        }
      }

      // Rule 3: Must have both Day-1 and Final weigh-ins recorded
      const day1 = u.weighIns.find((w) => w.type === "DAY_1");
      const finalW = u.weighIns.find((w) => w.type === "FINAL");

      if (!day1 || !finalW) return null;

      const day1Weight = Number(day1.weightKg);
      const finalWeight = Number(finalW.weightKg);
      const kgLost = parseFloat((day1Weight - finalWeight).toFixed(3));

      // In a weight loss challenge, verified weight loss must be positive
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

  // 4. Verify official winners (filter out any who might be disqualified)
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

  // 5. Assemble Top 10 list
  const top10: TopLeaderboardUser[] = [];
  const prizeLookup: Record<number, number> = { 1: 10000, 2: 5000, 3: 3000 };

  if (validOfficialWinners.length > 0) {
    // Official winners occupy ranks 1, 2, 3
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

    // Remaining top participants fill ranks 4 to 10
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
    // If no official winners locked yet, directly rank top completed participants in leaderboard only
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

  return (
    <TvWinnerCelebration
      winners={winnersMap}
      top10={top10}
      totalRegistered={totalRegisteredCount}
    />
  );
}
