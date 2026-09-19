import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffRootPage() {
  const session = await getSession();

  if (!session) {
    redirect("/staff/login");
  }

  if (session.role === "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  redirect("/staff/dashboard");
}