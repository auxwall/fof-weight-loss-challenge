import prisma from "@/lib/prisma";
import { ShieldCheck, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const settings = await prisma.challengeSettings.findUnique({where: { id: "singleton" }});

  const termsContent = settings?.termsText?.trim();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <main className="max-w-2xl w-full mx-auto py-8 sm:py-12 px-4 sm:px-6 flex-1">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-gymRed" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gymRed">Official Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">TERMS & CONDITIONS</h1>
          <p className="text-xs text-zinc-400 mt-1">Please review the challenge rules and participant obligations carefully.</p>
        </div>

        <div className="gym-card rounded-2xl p-5 sm:p-7 border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800 text-xs font-bold text-white uppercase tracking-wider">
            <FileText className="w-4 h-4 text-gymRed" /><span>Challenge Agreement & Rules</span>
          </div>

          <div className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed sm:p-5 rounded-xl overflow-x-auto min-h-[120px]">
            {termsContent || (
              <span className="text-zinc-500 italic font-sans">No terms and conditions have been published yet.</span>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-zinc-500 py-6">Official Club Weight Loss Challenge · Dubai, UAE</footer>
    </div>
  );
}
