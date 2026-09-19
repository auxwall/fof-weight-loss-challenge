import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.challengeSettings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <AdminNav />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">CHALLENGE SETTINGS</h1>
          <p className="text-xs text-zinc-400 mt-1">Configure registration start/end dates, winner finalization cut-off, and challenge rules.</p>
        </div>

        <SettingsForm
          initialSettings={{
            registrationStart: settings?.registrationStart ? settings.registrationStart.toISOString() : null,
            registrationEnd: settings?.registrationEnd ? settings.registrationEnd.toISOString() : null,
            finalizeDate: settings?.finalizeDate ? settings.finalizeDate.toISOString() : null,
            rulesText: settings?.rulesText || null,
            termsText: settings?.termsText || null,
          }}
        />
      </main>

      <footer className="border-t border-surface-border py-4 text-center text-xs text-zinc-500">Admin Terminal · Timezone: Asia/Dubai</footer>
    </div>
  );
}
