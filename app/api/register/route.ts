import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isRegistrationWindowOpen } from "@/lib/dayjs";
import { generateQrBuffer, generateQrDataUrl } from "@/lib/qrcode";
import { sendRegistrationEmail } from "@/lib/mailer";
import { generateTermsAgreementPdf } from "@/lib/pdf";
import { RegisterSchema } from "@/lib/validation";
import { Gender } from "@prisma/client";
import { broadcastWinnersUpdate } from "@/lib/sse";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Schema Validation
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || "Invalid registration data." },{ status: 400 });
    }

    const { name, emiratesId, emiratesIdExpiry, mobile, email, gender, dob, branchId } = parsed.data;

    // 2. Check Registration Window in Dubai Time
    const settings = await prisma.challengeSettings.findUnique({ where: { id: "singleton" }, });

    const windowCheck = isRegistrationWindowOpen( settings?.registrationStart, settings?.registrationEnd );

    if (!windowCheck.isOpen) {
      return NextResponse.json({ error: windowCheck.reason || "Registration is currently closed." },{ status: 403 });
    }

    // Clean Emirates ID and Mobile
    const cleanEmiratesId = emiratesId.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    // 3. Duplicate checks
    const existingEmirates = await prisma.user.findUnique({ where: { emiratesId: cleanEmiratesId } });
    if (existingEmirates) {
      return NextResponse.json( { error: "This Emirates ID is already registered for the challenge." }, { status: 409 } );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      return NextResponse.json({ error: "This email address is already registered." }, { status: 409 });
    }

    const existingMobile = await prisma.user.findFirst({ where: { mobile: cleanMobile } });
    if (existingMobile) {
      return NextResponse.json({ error: "This mobile number is already registered." }, { status: 409 });
    }

    // 4. Verify Branch exists
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return NextResponse.json({ error: "Selected club is invalid." }, { status: 400 });
    }

    // 5. Generate random 5-digit ID (10000 - 99999) to protect participant count privacy
    let newUserId = "";
    let isUnique = false;

    while (!isUnique) {
      const randomNum = Math.floor(10000 + Math.random() * 90000); // Guarantees 5 digits (10000–99999)
      newUserId = `FOF-WLC${randomNum}`;
      const existing = await prisma.user.findUnique({ where: { id: newUserId }, select: { id: true } });
      if (!existing) {
        isUnique = true;
      }
    }

    // 6. Create User
    const user = await prisma.user.create({
      data: {
        id: newUserId,
        name: name.trim(),
        emiratesId: cleanEmiratesId,
        emiratesIdExpiry: emiratesIdExpiry ? new Date(emiratesIdExpiry) : null,
        mobile: cleanMobile,
        email: cleanEmail,
        gender: gender === "FEMALE" ? Gender.FEMALE : Gender.MALE,
        dob: dob ? new Date(dob) : null,
        registeredBranchId: branch.id,
        status: "REGISTERED",
      },
    });

    // 6. Generate QR code (encodes User ID only)
    const qrBuffer = await generateQrBuffer(user.id);
    const qrDataUrl = await generateQrDataUrl(user.id);

    // 7. Send Email #1 with QR code Challenge Pass (non-blocking failure)
    try {
      await sendRegistrationEmail({
        email: user.email,
        name: user.name,
        userId: user.id,
        branchName: branch.label,
        qrBuffer,
        emiratesId: user.emiratesId,
        mobile: user.mobile,
      });
    } catch (mailErr) {
      console.error("Email sending failed during registration:", mailErr);
    }

    // Broadcast live registration counter update
    try {
      broadcastWinnersUpdate({ action: "NEW_REGISTRATION", timestamp: Date.now() });
    } catch (e) {
      console.error("Failed to broadcast new registration:", e);
    }

    return NextResponse.json({ success: true, userId: user.id, name: user.name, email: user.email, qrDataUrl, branchLabel: branch.label });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during registration. Please try again.", status: 500 });
  }
}
