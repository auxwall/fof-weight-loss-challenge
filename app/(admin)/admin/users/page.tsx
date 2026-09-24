import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import UsersTable from "@/components/admin/UsersTable";
import { maskEmiratesId } from "@/lib/mask";
import { getDaysRemaining } from "@/lib/dayjs";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, branches] = await Promise.all([
    prisma.user.findMany({ include: { registeredBranch: true, weighIns: { include: { branch: true } }}, orderBy: { createdAt: "desc" }, }),
    prisma.branch.findMany({ orderBy: { label: "asc" }, }),
  ]);

  const mappedUsers = users.map((u) => {
    let currentStatus = u.status;
    if (u.status === "ACTIVE" && u.deadlineDate) {
      const daysInfo = getDaysRemaining(u.deadlineDate);
      if (daysInfo.isExpired) currentStatus = "DISQUALIFIED";
    }

    const day1 = u.weighIns.find((w) => w.type === "DAY_1");
    const finalW = u.weighIns.find((w) => w.type === "FINAL");
    const kgLost =
      day1 && finalW ? parseFloat((Number(day1.weightKg) - Number(finalW.weightKg)).toFixed(3)) : null;

    const startIso = u.day1Date ? u.day1Date.toISOString() : null;

    return {
      id: u.id,
      name: u.name,
      rawEmiratesId: u.emiratesId,
      maskedEmiratesId: maskEmiratesId(u.emiratesId),
      mobile: u.mobile,
      email: u.email,
      gender: u.gender,
      dob: u.dob ? u.dob.toISOString() : null,
      branchId: u.registeredBranchId,
      branchLabel: u.registeredBranch.label,
      status: currentStatus,
      day1Date: startIso,
      day1Weight: day1 ? Number(day1.weightKg) : null,
      day1PhotoUrl: day1?.photoUrl || null,
      day1SignatureUrl: day1?.signatureUrl || null,
      finalDate: finalW ? finalW.createdAt.toISOString() : null,
      finalWeight: finalW ? Number(finalW.weightKg) : null,
      finalPhotoUrl: finalW?.photoUrl || null,
      finalSignatureUrl: finalW?.signatureUrl || null,
      kgLost,
      deadlineDate: u.deadlineDate ? u.deadlineDate.toISOString() : null,
      daysRemaining: u.deadlineDate ? getDaysRemaining(u.deadlineDate) : null,
      createdAt: u.createdAt.toISOString(),
    };
  });

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <AdminNav />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">PARTICIPANT REGISTRY</h1>
          <p className="text-xs text-zinc-400 mt-1">Master participant roster with real-time status tracking, weigh-in deltas, and Emirates ID privacy masking.</p>
        </div>

        <UsersTable initialUsers={mappedUsers} branches={branches} />
      </main>

      <footer className="border-t border-surface-border py-4 text-center text-xs text-zinc-500">Admin Terminal · Data Protected & Masked</footer>
    </div>
  );
}
