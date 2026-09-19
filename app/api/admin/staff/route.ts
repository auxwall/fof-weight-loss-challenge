import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { StaffRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const staffMembers = await prisma.staff.findMany({ include: { branch: true, _count: { select: { weighInsLogged: true } } }, orderBy: { createdAt: "asc" } });

    return NextResponse.json({ staff: staffMembers.map((s) => ({ id: s.id, username: s.username, name: s.name, role: s.role, branchId: s.branchId, branchLabel: s.branch?.label || "All Branches", weighInsCount: s._count.weighInsLogged, createdAt: s.createdAt, })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch staff list." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    

    const body = await req.json();
    const { username, password, name, branchId, role } = body;

    if (!username || !password) return NextResponse.json({ error: "Username and password are required." },{ status: 400 });

    const cleanUsername = username.trim().toLowerCase();

    const existing = await prisma.staff.findUnique({ where: { username: cleanUsername } });
    if (existing) return NextResponse.json({ error: "A staff account with this username already exists." },{ status: 409 });

    const passwordHash = await hashPassword(password);

    const newStaff = await prisma.staff.create({
      data: {
        username: cleanUsername,
        passwordHash,
        name: name?.trim() || null,
        branchId: branchId || null,
        role: role === "SUPER_ADMIN" ? StaffRole.SUPER_ADMIN : StaffRole.STAFF,
      },
      include: { branch: true },
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: newStaff.id,
        username: newStaff.username,
        name: newStaff.name,
        role: newStaff.role,
        branchLabel: newStaff.branch?.label || "All Branches",
      },
    });
  } catch (error) {
    console.error("Staff creation error:", error);
    return NextResponse.json(
      { error: "Failed to create staff account." },
      { status: 500 }
    );
  }
}
