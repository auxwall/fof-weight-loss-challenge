import prisma from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import StaffManager from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {

  const [staff, branches] = await Promise.all([
    prisma.staff.findMany({include: { branch: true, _count: { select: { weighInsLogged: true } } },orderBy: { createdAt: "asc" },}),
    prisma.branch.findMany({ orderBy: { label: "asc" }, }),
  ]);

  const mappedStaff = staff.map((s) => ({
    id: s.id,
    username: s.username,
    name: s.name,
    role: s.role,
    branchId: s.branchId,
    branchLabel: s.branch?.label || "All Clubs",
    weighInsCount: s._count.weighInsLogged,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <AdminNav />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 flex-1 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">STAFF &amp; CLUBS</h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">Create club staff logins and assign floor access across the 6 Dubai clubs.</p>
        </div>

        <StaffManager initialStaff={mappedStaff} branches={branches} />
      </main>

      <footer className="border-t border-surface-border py-4 text-center text-xs text-zinc-500">Admin Terminal · Staff Access Control</footer>
    </div>
  );
}
