import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // 1. Find staff by username (case-insensitive)
    const staff = await prisma.staff.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: "insensitive",
        },
      },
      include: { branch: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // 2. Verify password strictly against database hash
    const isValid = await verifyPassword(password, staff.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // 4. Create and sign JWT session token
    const token = await signToken({
      userId: staff.id,
      username: staff.username,
      role: staff.role,
      branchId: staff.branchId,
      name: staff.name || staff.username,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: staff.id,
        username: staff.username,
        name: staff.name,
        role: staff.role,
        branch: staff.branch?.label || "All Branches",
      },
    });

    setSessionCookie(res, token);
    return res;
  } catch (error: any) {
    console.error("Staff login error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
