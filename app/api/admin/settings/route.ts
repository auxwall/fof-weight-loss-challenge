import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    

    const settings = await prisma.challengeSettings.findUnique({ where: { id: "singleton" } });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { registrationStart, registrationEnd, finalizeDate, rulesText, termsText } = body;

    const updated = await prisma.challengeSettings.upsert({
      where: { id: "singleton" },
      update: {
        registrationStart: registrationStart ? new Date(registrationStart) : null,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        finalizeDate: finalizeDate ? new Date(finalizeDate) : null,
        rulesText: rulesText || null,
        termsText: termsText || null,
      },
      create: {
        id: "singleton",
        registrationStart: registrationStart ? new Date(registrationStart) : null,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        finalizeDate: finalizeDate ? new Date(finalizeDate) : null,
        rulesText: rulesText || null,
        termsText: termsText || null,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
