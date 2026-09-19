import prisma from "@/lib/prisma";
import TvWinnerCelebration, { WinnerDisplayInfo } from "@/components/public/TvWinnerCelebration";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Official Winner Announcement | Face Off Fitness",
  description: "Official winner announcement and podium champions for Face Off Fitness 30-Day Weight Loss Challenge.",
};

export default async function PublicWinnersTvPage() {
  
  const existingWinners = await prisma.winner.findMany({
    include: {user: {include: {registeredBranch: true}}},
    orderBy: { position: "asc" },
  });

  const winnersMap: Record<number, WinnerDisplayInfo> = {};

  for (const w of existingWinners) {
    winnersMap[w.position] = {
      position: w.position,
      name: w.user.name,
      prizeAed: w.prizeAed,
      kgLost: w.kgLost,
      branchLabel: w.user.registeredBranch.label,
    };
  }

  return <TvWinnerCelebration winners={winnersMap} />;
}
