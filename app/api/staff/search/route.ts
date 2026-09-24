import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { maskEmiratesId } from "@/lib/mask";
import { getDaysRemaining } from "@/lib/dayjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STAFF" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || "ALL";
    const branchId = searchParams.get("branchId") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));

    const where: any = {};

    if (query) {
      where.OR = [
        { id: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { emiratesId: { contains: query, mode: "insensitive" } },
        { mobile: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (branchId && branchId !== "ALL") {
      where.registeredBranchId = branchId;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { registeredBranch: true, weighIns: true },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      users: users.map(mapUserWithStatus),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error("Staff search error:", error);
    return NextResponse.json(
      { error: "Failed to search participants." },
      { status: 500 }
    );
  }
}

function mapUserWithStatus(user: any) {
  // Check-on-read auto-disqualification: if ACTIVE and now > deadlineDate -> status is DISQUALIFIED
  let currentStatus = user.status;
  if (user.status === "ACTIVE" && user.deadlineDate) {
    const daysInfo = getDaysRemaining(user.deadlineDate);
    if (daysInfo.isExpired) {
      currentStatus = "DISQUALIFIED";
    }
  }

  const day1WeighIn = user.weighIns.find(
    (w: any) => w.type === "DAY_1"
  );
  const finalWeighIn = user.weighIns.find((w: any) => w.type === "FINAL");

  return {
    id: user.id,
    name: user.name,
    maskedEmiratesId: maskEmiratesId(user.emiratesId),
    rawEmiratesId: user.emiratesId,
    mobile: user.mobile,
    email: user.email,
    gender: user.gender,
    branchLabel: user.registeredBranch?.label || "Unknown",
    branchId: user.registeredBranchId,
    status: currentStatus,
    day1Weight: day1WeighIn ? Number(day1WeighIn.weightKg) : null,
    finalWeight: finalWeighIn ? Number(finalWeighIn.weightKg) : null,
    deadlineDate: user.deadlineDate,
    daysRemaining: user.deadlineDate ? getDaysRemaining(user.deadlineDate) : null,
  };
}
