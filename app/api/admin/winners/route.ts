import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { nowDubai } from "@/lib/dayjs";
import dayjs from "dayjs";
import { broadcastWinnersUpdate } from "@/lib/sse";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [settings, existingWinners, completedUsers] = await Promise.all([
      prisma.challengeSettings.findUnique({ where: { id: "singleton" } }),
      prisma.winner.findMany({
        include: {
          user: {
            include: {
              registeredBranch: true,
              weighIns: true,
            },
          },
        },
        orderBy: { position: "asc" },
      }),
      prisma.user.findMany({
        where: { status: "COMPLETED" },
        include: {
          registeredBranch: true,
          weighIns: true,
        },
      }),
    ]);

    // Check if finalizeDate has arrived in Dubai Time
    const now = nowDubai();
    const finalizeDate = settings?.finalizeDate ? dayjs(settings.finalizeDate).tz("Asia/Dubai") : null;
    const isFinalizeAllowed = finalizeDate ? now.isAfter(finalizeDate) || now.isSame(finalizeDate) : true;

    // Calculate kg lost for all completed participants
    const candidates = completedUsers
      .map((u) => {
        const day1 = u.weighIns.find((w) => w.type === "DAY_1");
        const finalW = u.weighIns.find((w) => w.type === "FINAL");

        if (!day1 || !finalW) return null;

        const kgLost = parseFloat((Number(day1.weightKg) - Number(finalW.weightKg)).toFixed(3));
        return {
          userId: u.id,
          name: u.name,
          mobile: u.mobile,
          gender: u.gender,
          branchLabel: u.registeredBranch.label,
          day1Weight: Number(day1.weightKg),
          finalWeight: Number(finalW.weightKg),
          kgLost,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.kgLost - a.kgLost);

    const winnersMap: Record<number, any> = {};
    for (const w of existingWinners) {
      const day1 = w.user.weighIns.find((item) => item.type === "DAY_1");
      const finalW = w.user.weighIns.find((item) => item.type === "FINAL");

      winnersMap[w.position] = {
        position: w.position,
        userId: w.userId,
        name: w.user.name,
        prizeAed: w.prizeAed,
        kgLost: Number(w.kgLost),
        branchLabel: w.user.registeredBranch.label,
        day1Weight: day1 ? Number(day1.weightKg) : null,
        finalWeight: finalW ? Number(finalW.weightKg) : null,
      };
    }

    return NextResponse.json({
      finalizeDate: settings?.finalizeDate,
      isFinalizeAllowed,
      candidates,
      winners: winnersMap,
    });
  } catch (error) {
    console.error("Winners GET error:", error);
    return NextResponse.json({ error: "Failed to fetch winners." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { winners } = body; // Array of { position: 1|2|3, userId: string }

    if (!winners || !Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json({ error: "Winners list is required." }, { status: 400 });
    }

    const prizeLookup: Record<number, number> = {
      1: 10000,
      2: 5000,
      3: 3000,
    };

    // Upsert winners in transaction
    const results = [];
    for (const item of winners) {
      const { position, userId } = item;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { weighIns: true },
      });

      if (!user) continue;

      const day1 = user.weighIns.find((w) => w.type === "DAY_1");
      const finalW = user.weighIns.find((w) => w.type === "FINAL");
      const kgLost = day1 && finalW ? parseFloat((Number(day1.weightKg) - Number(finalW.weightKg)).toFixed(3)) : 0;

      // Delete existing winner in this position or for this user to ensure uniqueness
      await prisma.winner.deleteMany({
        where: {
          OR: [{ position }, { userId }],
        },
      });

      const winnerRecord = await prisma.winner.create({
        data: {
          userId,
          position,
          prizeAed: prizeLookup[position] || 0,
          kgLost,
        },
      });
      results.push(winnerRecord);
    }

    // Trigger instant real-time live push to TV displays
    try {
      broadcastWinnersUpdate({ action: "WINNERS_UPDATED", timestamp: Date.now() });
    } catch (e) {
      console.error("Failed to broadcast winners update:", e);
    }

    return NextResponse.json({ success: true, winners: results });
  } catch (error) {
    console.error("Winners POST error:", error);
    return NextResponse.json({ error: "Failed to save winners." }, { status: 500 });
  }
}
