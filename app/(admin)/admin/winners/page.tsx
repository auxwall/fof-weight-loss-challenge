import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import WinnerSelector from "@/components/admin/WinnerSelector";
import { nowDubai } from "@/lib/dayjs";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export default async function AdminWinnersPage() {

  const [settings, existingWinners, completedUsers] = await Promise.all([
    prisma.challengeSettings.findUnique({ where: { id: "singleton" } }),
    prisma.winner.findMany({
      include: { user: { include: { registeredBranch: true, weighIns: true }}},
      orderBy: { position: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "COMPLETED" },
      include: { registeredBranch: true, weighIns: true },
    }),
  ]);

  const now = nowDubai();
  const finalizeDate = settings?.finalizeDate ? dayjs(settings.finalizeDate).tz("Asia/Dubai") : null;
  const isFinalizeAllowed = finalizeDate ? now.isAfter(finalizeDate) || now.isSame(finalizeDate) : true;

  const candidates = completedUsers
    .map((u) => {
      const day1 = u.weighIns.find((w) => w.type === "DAY_1");
      const finalW = u.weighIns.find((w) => w.type === "FINAL");

      if (!day1 || !finalW) return null;

      const kgLost = parseFloat((Number(day1.weightKg) - Number(finalW.weightKg)).toFixed(3));
      return {
        userId: u.id,
        name: u.name,
        mobile: u.mobile,
        gender: u.gender,
        branchLabel: u.registeredBranch.label,
        day1Weight: Number(day1.weightKg),
        finalWeight: Number(finalW.weightKg),
        kgLost,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.kgLost - a.kgLost);

  const winnersMap: Record<number, any> = {};
  for (const w of existingWinners) {
    winnersMap[w.position] = {
      position: w.position,
      userId: w.userId,
      name: w.user.name,
      prizeAed: w.prizeAed,
      kgLost: Number(w.kgLost),
      branchLabel: w.user.registeredBranch.label,
    };
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <AdminNav />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
              <span>🏆 Official Winner Announcement</span>
            </h1>
          </div>
          <a href="/winners" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase transition-all shadow-md shrink-0 w-fit" >
            <span>Open Live Display Screen</span>
          </a>
        </div>

        <WinnerSelector
          candidates={candidates}
          initialWinners={winnersMap}
          finalizeDate={settings?.finalizeDate ? settings.finalizeDate.toISOString() : null}
          isFinalizeAllowed={isFinalizeAllowed}
        />
      </main>

      <footer className="border-t border-surface-border py-4 text-center text-xs text-zinc-500">Management Terminal · Winner Finalization</footer>
    </div>
  );
}
