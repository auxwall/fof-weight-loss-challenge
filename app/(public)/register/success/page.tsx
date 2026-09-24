import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface SuccessPageProps {searchParams: {userId?: string}}

export default async function RegisterSuccessPage({ searchParams }: SuccessPageProps) {
  const userId = searchParams.userId;

  let user = null;

  if (userId) {
    user = await prisma.user.findUnique({where: { id: userId },include: { registeredBranch: true }});
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Header rightAction="home" />

      <main className="max-w-md w-full mx-auto py-8 px-4 sm:px-6 flex-1 flex flex-col justify-center text-center">
        {/* Success Card */}
        <div className="gym-card rounded-2xl p-6 sm:p-7 shadow-2xl border-gymRed/30 relative overflow-hidden">
          {/* Top Checkmark */}
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-gymRed block mb-1">REGISTRATION CONFIRMED</span>
          <h1 className="text-2xl font-black uppercase text-white mb-2">YOU&apos;RE IN THE CHALLENGE!</h1>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">Welcome, <strong className="text-white">{user?.name || "Participant"}</strong>. You are officially registered for the 30-day challenge.</p>

          {/* User ID Highlight - Single Line on all screens */}
          <div className="bg-zinc-900 border border-dashed border-gymRed/60 rounded-xl px-2.5 py-3 sm:p-4 mb-6 max-w-full overflow-hidden">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">YOUR OFFICIAL USER ID</span>
            <div className="font-mono text-[13px] min-[360px]:text-sm min-[410px]:text-base sm:text-xl font-black text-white tracking-tight sm:tracking-wider whitespace-nowrap overflow-x-auto py-0.5 select-all selection:bg-gymRed">{userId || "PENDING"}</div>
          </div>

          {/* Email Delivery Notice */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 sm:p-4 mb-6 flex items-center justify-center gap-2.5 text-center">
            <Mail className="w-4 h-4 text-gymRed shrink-0" />
            <p className="text-xs text-zinc-300">Please check your email <span className="text-white font-semibold break-all">{user?.email || "inbox"}</span> for your challenge details.</p>
          </div>

          {/* Return Home Button */}
          <Link href="/" className="w-full py-3.5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider transition-all shadow-red-glow flex items-center justify-center gap-2">
            <span>Return to Homepage</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="text-center text-[11px] text-zinc-500 py-6">Club Weight Loss Challenge · Dubai, UAE</footer>
    </div>
  );
}
