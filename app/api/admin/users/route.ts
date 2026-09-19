import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { maskEmiratesId } from "@/lib/mask";
import { getDaysRemaining } from "@/lib/dayjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const branchId = searchParams.get("branchId") || "";
    const status = searchParams.get("status") || "";
    const gender = searchParams.get("gender") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { emiratesId: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
      ];
    }

    if (branchId) {
      where.registeredBranchId = branchId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (gender && gender !== "ALL") {
      where.gender = gender;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        registeredBranch: true,
        weighIns: { include: { branch: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedUsers = users.map((u) => {
      let currentStatus = u.status;
      if (u.status === "ACTIVE" && u.deadlineDate) {
        const daysInfo = getDaysRemaining(u.deadlineDate);
        if (daysInfo.isExpired) currentStatus = "DISQUALIFIED";
      }

      const day1 = u.weighIns.find((w) => w.type === "DAY_1");
      const finalW = u.weighIns.find((w) => w.type === "FINAL");
      const kgLost =
        day1 && finalW ? parseFloat((day1.weightKg - finalW.weightKg).toFixed(1)) : null;

      return {
        id: u.id,
        name: u.name,
        rawEmiratesId: u.emiratesId,
        maskedEmiratesId: maskEmiratesId(u.emiratesId),
        mobile: u.mobile,
        email: u.email,
        gender: u.gender,
        branchId: u.registeredBranchId,
        branchLabel: u.registeredBranch.label,
        status: currentStatus,
        day1Date: u.day1Date,
        day1Weight: day1 ? day1.weightKg : null,
        day1PhotoUrl: day1?.photoUrl || null,
        finalDate: finalW ? finalW.createdAt : null,
        finalWeight: finalW ? finalW.weightKg : null,
        finalPhotoUrl: finalW?.photoUrl || null,
        finalSignatureUrl: finalW?.signatureUrl || null,
        kgLost,
        deadlineDate: u.deadlineDate,
        daysRemaining: u.deadlineDate ? getDaysRemaining(u.deadlineDate) : null,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json({ error: "Failed to fetch participants." }, { status: 500 });
  }
}
