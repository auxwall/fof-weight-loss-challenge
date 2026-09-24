import { NextRequest, NextResponse } from "next/server";
import { generateChallengePdf, ChallengePdfData } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const data: ChallengePdfData = {
      userName: searchParams.get("name") || "Mohammed Faiz CS",
      userId: searchParams.get("userId") || "FOF-WLC89472",
      emiratesId: "784-1992-1234567-1",
      mobile: "+971 50 123 4567",
      email: "participant@example.com",
      branchName: searchParams.get("branch") || "Al Barsha",
      day1WeightKg: parseFloat(searchParams.get("day1") || "92.500"),
      day1Date: new Date("2026-09-01T10:00:00"),
      finalWeightKg: parseFloat(searchParams.get("final") || "81.200"),
      finalDate: new Date("2026-10-01T18:00:00"),
      kgLost: parseFloat(searchParams.get("lost") || "11.300"),
      staffName: "Coach Tariq",
    };

    const pdfBytes = await generateChallengePdf(data);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="certificate-preview.pdf"',
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("PDF preview generation error:", error);
    return new NextResponse(`Failed to generate PDF preview: ${error?.message}`, {
      status: 500,
    });
  }
}
