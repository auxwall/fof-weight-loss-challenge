import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import StaffDashboardClient from "./StaffDashboardClient";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/staff/login");
  }

  const staff = await prisma.staff.findUnique({
    where: { id: session.userId },
    include: { branch: true },
  });

  const branches = await prisma.branch.findMany({
    orderBy: { label: "asc" },
  });

  return (
    <StaffDashboardClient
      staffName={staff?.name || staff?.username || "Staff Member"}
      branchLabel={staff?.branch?.label || "All Branches"}
      role={staff?.role || "STAFF"}
      branches={branches}
    />
  );
}
