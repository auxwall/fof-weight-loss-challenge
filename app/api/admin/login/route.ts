import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." },{ status: 400 });
    }

    const admin = await prisma.staff.findUnique({ where: { username: username.trim().toLowerCase() } });

    if (!admin || admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Invalid credentials or unauthorized role." },{ status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials or unauthorized role." },{ status: 401 });
    }

    const token = await signToken({ userId: admin.id, username: admin.username, role: "SUPER_ADMIN", branchId: null, name: admin.name || "Super Administrator", });

    const res = NextResponse.json({ success: true, user: { id: admin.id, username: admin.username, name: admin.name, role: admin.role, }, });

    setSessionCookie(res, token);
    return res;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." },{ status: 500 });
  }
}
