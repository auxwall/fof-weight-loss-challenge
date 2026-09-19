import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDaysRemaining } from "@/lib/dayjs";
import CheckinClient from "./CheckinClient";
import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";

export const dynamic = "force-dynamic";

interface CheckinPageProps {
  params: {
    userId: string;
  };
}

export default async function CheckinPage({ params }: CheckinPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/staff/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      registeredBranch: true,
      weighIns: {
        include: {
          branch: true,
          loggedByStaff: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const branches = await prisma.branch.findMany({
    orderBy: { label: "asc" },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-center">
        <div className="gym-card rounded-2xl p-8 max-w-sm w-full border-surface-border">
          <UserX className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-white mb-1">Participant Not Found</h1>
          <p className="text-xs text-zinc-400 mb-6">
            No record matches User ID: <code className="text-gymRed font-mono">{params.userId}</code>
          </p>
          <Link
            href="/staff/dashboard"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Floor Search</span>
          </Link>
        </div>
      </div>
    );
  }

  // Check on read for auto-disqualification
  let computedStatus = user.status;
  let daysInfo = null;

  if (user.deadlineDate) {
    daysInfo = getDaysRemaining(user.deadlineDate);
    if (user.status === "ACTIVE" && daysInfo.isExpired) {
      computedStatus = "DISQUALIFIED";
      // update database lazily
      await prisma.user.update({
        where: { id: user.id },
        data: { status: "DISQUALIFIED", disqualifiedAt: new Date() },
      });
    }
  }

  const day1WeighIn = user.weighIns.find((w) => w.type === "DAY_1") || null;
  const finalWeighIn = user.weighIns.find((w) => w.type === "FINAL") || null;

  return (
    <CheckinClient
      user={{
        id: user.id,
        name: user.name,
        emiratesId: user.emiratesId,
        mobile: user.mobile,
        email: user.email,
        gender: user.gender,
        branchLabel: user.registeredBranch.label,
        branchId: user.registeredBranchId,
        status: computedStatus,
        day1Date: user.day1Date,
        deadlineDate: user.deadlineDate,
      }}
      day1WeighIn={day1WeighIn}
      finalWeighIn={finalWeighIn}
      daysRemaining={daysInfo}
      branches={branches}
      staffBranchId={session.branchId}
      staffName={session.name || session.username}
    />
  );
}
