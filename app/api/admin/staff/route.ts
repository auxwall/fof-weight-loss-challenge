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
        branchId: newStaff.branchId,
        branchLabel: newStaff.branch?.label || "All Branches",
        weighInsCount: 0,
        createdAt: newStaff.createdAt,
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

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await req.json();
    const { id, username, password, name, branchId, role } = body;

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { id },
      include: { branch: true, _count: { select: { weighInsLogged: true } } },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
    }

    const updateData: any = {};

    if (username !== undefined) {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) {
        return NextResponse.json({ error: "Username cannot be empty." }, { status: 400 });
      }

      if (cleanUsername !== existingStaff.username) {
        const usernameTaken = await prisma.staff.findUnique({ where: { username: cleanUsername } });
        if (usernameTaken && usernameTaken.id !== id) {
          return NextResponse.json({ error: "This username is already taken by another account." }, { status: 409 });
        }
        updateData.username = cleanUsername;
      }
    }

    if (name !== undefined) {
      updateData.name = name?.trim() || null;
    }

    if (branchId !== undefined) {
      updateData.branchId = branchId || null;
    }

    if (role !== undefined) {
      updateData.role = role === "SUPER_ADMIN" ? StaffRole.SUPER_ADMIN : StaffRole.STAFF;
    }

    if (password && typeof password === "string" && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: { branch: true, _count: { select: { weighInsLogged: true } } },
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: updatedStaff.id,
        username: updatedStaff.username,
        name: updatedStaff.name,
        role: updatedStaff.role,
        branchId: updatedStaff.branchId,
        branchLabel: updatedStaff.branch?.label || "All Branches",
        weighInsCount: updatedStaff._count.weighInsLogged,
        createdAt: updatedStaff.createdAt,
      },
    });
  } catch (error) {
    console.error("Staff update error:", error);
    return NextResponse.json({ error: "Failed to update staff account." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    let staffId = req.nextUrl.searchParams.get("id");
    if (!staffId) {
      try {
        const body = await req.json();
        staffId = body.id;
      } catch {}
    }

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    if (staffId === session.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account while logged in." },
        { status: 400 }
      );
    }

    const staffToDelete = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { _count: { select: { weighInsLogged: true } } },
    });

    if (!staffToDelete) {
      return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    }

    // Safely reassign any weigh-ins logged by this staff to the current superAdmin to prevent foreign key errors
    if (staffToDelete._count.weighInsLogged > 0) {
      await prisma.weighIn.updateMany({
        where: { loggedByStaffId: staffId },
        data: { loggedByStaffId: session.userId },
      });
    }

    await prisma.staff.delete({
      where: { id: staffId },
    });

    return NextResponse.json({
      success: true,
      message: `Staff account '${staffToDelete.username}' has been deleted successfully.`,
    });
  } catch (error) {
    console.error("Staff deletion error:", error);
    return NextResponse.json({ error: "Failed to delete staff account." }, { status: 500 });
  }
}
