import prisma from "@/lib/prisma";
import { isRegistrationWindowOpen } from "@/lib/dayjs";
import RegisterForm from "@/components/forms/RegisterForm";
import Header from "@/components/Header";
import { Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const [settings, branches] = await Promise.all([prisma.challengeSettings.findUnique({ where: { id: "singleton" } }), prisma.branch.findMany({ orderBy: { label: "asc" } })]);

  const windowStatus = isRegistrationWindowOpen(settings?.registrationStart, settings?.registrationEnd);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Header rightAction="home" />

      <main className="max-w-xl w-full mx-auto py-8 px-4 sm:px-6 flex-1">

        {/* Title Card */}
        <div className="mb-6">
          {/* <span className="text-[11px] font-bold uppercase tracking-wider text-gymRed block mb-1">Official Registration</span> */}
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">JOIN THE CHALLENGE <span className="text-sm text-gymRed">■</span></h1>
          {/* <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider my-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Free Registration · 19,000 AED Cash Prize Pool
          </div> */}
          <p className="text-xs text-zinc-400 mt-1">Complete the form below to receive your official User ID & QR Code.</p>
        </div>

        {/* Window Banner */}
        {!windowStatus.isOpen ? (
          <div className="gym-card rounded-2xl p-6 border-zinc-800 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto mb-3 text-gymRed"><Clock className="w-6 h-6" /></div>
            <h2 className="text-lg font-bold text-white mb-1">Registration Unavailable</h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{windowStatus.reason || "The registration window is currently closed."}</p>
            <Link href="/" className="inline-block py-2.5 px-5 rounded-xl bg-surface-card border border-surface-border text-xs font-semibold text-white hover:bg-surface-hover transition-colors">Return Home</Link>
          </div>
        ) : (
          <RegisterForm branches={branches} />
        )}
      </main>

      <footer className="text-center text-[11px] text-zinc-500 py-6">Official Club Weight Loss Challenge · Dubai, UAE</footer>
    </div>
  );
}
