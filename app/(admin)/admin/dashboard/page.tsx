import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import Link from "next/link";
import { Users, Clock, CheckCircle2, Scale, Trophy, ArrowRight, Settings, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {

  const [totalUsers, registeredCount, activeCount, completedCount, branches, allWeighIns] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "REGISTERED" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "COMPLETED" } }),
    prisma.branch.findMany({include: {_count: { select: { users: true, staff: true } }}}),
    prisma.weighIn.findMany({where: { type: { in: ["DAY_1", "FINAL"] } },select: { userId: true, type: true, weightKg: true },}),
  ]);

  // Calculate cumulative kg lost across all completed participants
  const userWeights: Record<string, { day1?: number; final?: number }> = {};
  for (const w of allWeighIns) {
    if (!userWeights[w.userId]) userWeights[w.userId] = {};
    if (w.type === "DAY_1") userWeights[w.userId].day1 = Number(w.weightKg);
    if (w.type === "FINAL") userWeights[w.userId].final = Number(w.weightKg);
  }

  let totalKgLost = 0;
  for (const uid of Object.keys(userWeights)) {
    const item = userWeights[uid];
    if (item.day1 !== undefined && item.final !== undefined) {
      const lost = item.day1 - item.final;
      if (lost > 0) totalKgLost += lost;
    }
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <AdminNav />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">CHALLENGE OVERVIEW</h1>
            <p className="text-xs text-zinc-400 mt-1">Real-time monitoring across Dubai clubs: Al Rashidiya, Al Barsha, Abu Hail, Al Nahda.</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/admin/winners" className="py-2.5 px-4 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider shadow-red-glow flex items-center gap-2 transition-all" >
              <Trophy className="w-4 h-4" />
              <span>Select Winners</span>
            </Link>
          </div>
        </div>

        {/* Primary Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="gym-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Enrolled</span>
              <Users className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalUsers}</div>
            <span className="text-[10px] text-zinc-400 mt-1 block">Public registrations</span>
          </div>

          <div className="gym-card rounded-2xl p-4 sm:p-5 border-blue-900/40">
            <div className="flex items-center justify-between text-blue-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pending Day-1</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-400">{registeredCount}</div>
            <span className="text-[10px] text-zinc-400 mt-1 block">Need club weigh-in</span>
          </div>

          <div className="gym-card rounded-2xl p-4 sm:p-5 border-amber-900/40">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Active Clock</span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{activeCount}</div>
            <span className="text-[10px] text-zinc-400 mt-1 block">Within 30-day window</span>
          </div>

          <div className="gym-card rounded-2xl p-4 sm:p-5 border-emerald-900/40">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{completedCount}</div>
            <span className="text-[10px] text-zinc-400 mt-1 block">Eligible for prizes</span>
          </div>

          <div className="gym-card rounded-2xl p-4 sm:p-5 border-gymRed/40 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-gymRed mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total KG Lost</span>
              <Scale className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gymRed">
              {totalKgLost.toFixed(3)} <span className="text-sm font-bold">KG</span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">Across all finishers</span>
          </div>
        </div>

        {/* Branch Statistics Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">PARTICIPATION BY CLUB</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {branches.map((b) => (
              <div key={b.id} className="gym-card rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">{b.label}</div>
                  <div className="text-[11px] text-zinc-400">{b._count.staff} assigned staff</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-white">{b._count.users}</div>
                  <div className="text-[10px] uppercase text-zinc-400 font-semibold">Registered</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/admin/settings" className="gym-card rounded-2xl p-5 hover:border-gymRed/50 transition-colors group flex flex-col justify-between" >
            <div>
              <div className="w-9 h-9 rounded-xl bg-surface-card border border-surface-border text-zinc-300 flex items-center justify-center mb-3">
                <Settings className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Registration & Finalize Window</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Control start/end dates and set the winner finalize cut-off in Asia/Dubai time.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-gymRed mt-4 gap-1 group-hover:translate-x-1 transition-transform">
              <span>Manage Dates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/admin/users" className="gym-card rounded-2xl p-5 hover:border-gymRed/50 transition-colors group flex flex-col justify-between" >
            <div>
              <div className="w-9 h-9 rounded-xl bg-surface-card border border-surface-border text-zinc-300 flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Participant Master Registry</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Search, filter by club & status, reveal masked Emirates IDs, and monitor days remaining.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-gymRed mt-4 gap-1 group-hover:translate-x-1 transition-transform">
              <span>View All Participants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/admin/winners" className="gym-card rounded-2xl p-5 border-gymRed/40 hover:border-gymRed transition-colors group flex flex-col justify-between bg-gradient-to-br from-surface to-red-950/20" >
            <div>
              <div className="w-9 h-9 rounded-xl bg-gymRed/20 border border-gymRed/40 text-gymRed flex items-center justify-center mb-3">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">🏆 Winner Selection</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Leaderboard by kg lost, 10k/5k/3k AED ribbons, confetti celebration & download image.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-gymRed mt-4 gap-1 group-hover:translate-x-1 transition-transform">
              <span>Open Podium</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </main>

      <footer className="border-t border-surface-border py-4 text-center text-xs text-zinc-500">
        Management Terminal · Dubai Time (Asia/Dubai)
      </footer>
    </div>
  );
}
