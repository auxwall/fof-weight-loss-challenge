import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateDeadlineDubai, nowDubai, getDaysRemaining, getFinalWeighInWindow } from "@/lib/dayjs";
import { sendDay1Email, sendFinalResultEmail } from "@/lib/mailer";
import { generateChallengePdf, generateTermsAgreementPdf } from "@/lib/pdf";
import { saveNewImage } from "@/lib/imageHandler";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STAFF" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, type, weightKg, signatureDataUrl, branchId, scalePhoto, personScalePhoto, emiratesIdPhoto } = body;

    if (!userId || !type || weightKg === undefined || weightKg === null) {
      return NextResponse.json(
        { error: "Participant ID, weigh-in type, and weight (kg) are required." },
        { status: 400 }
      );
    }

    const weightStr = String(weightKg).trim();
    if (!/^\d+(\.\d{3})$/.test(weightStr)) {
      return NextResponse.json(
        {
          error:
            "Weight strictly requires exactly 3 decimal places (e.g. 88.123 kg). Formats like 88, 88.2, or 88.33 are not allowed.",
        },
        { status: 400 }
      );
    }

    const weightNum = parseFloat(weightStr);
    if (isNaN(weightNum) || weightNum <= 25 || weightNum > 350) {
      return NextResponse.json(
        { error: "Please enter a valid weight in kg (between 25 and 350 kg)." },
        { status: 400 }
      );
    }

    // Determine branch: staff branch or requested branch
    let effectiveBranchId = session.branchId || branchId;
    if (!effectiveBranchId) {
      const firstBranch = await prisma.branch.findFirst();
      effectiveBranchId = firstBranch?.id;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        registeredBranch: true,
        weighIns: { include: { branch: true, loggedByStaff: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    const now = nowDubai().toDate();

    // ==========================================
    // CASE 1: DAY_1 WEIGH-IN
    // ==========================================
    if (type === "DAY_1") {
      if (user.status !== "REGISTERED") {
        return NextResponse.json(
          { error: `Cannot log Day-1 weigh-in. Participant is currently in '${user.status}' state.` },
          { status: 400 }
        );
      }

      const existingDay1 = user.weighIns.find((w) => w.type === "DAY_1");
      if (existingDay1) {
        return NextResponse.json(
          { error: "Day-1 weigh-in has already been recorded for this participant." },
          { status: 400 }
        );
      }

      if (!signatureDataUrl) {
        return NextResponse.json(
          { error: "Digital signature is required to record Day-1 starting weigh-in." },
          { status: 400 }
        );
      }

      const deadline = calculateDeadlineDubai(now);

      // Save scale photo proof if provided
      let scalePhotoUrl: string | null = null;
      if (scalePhoto) {
        try {
          scalePhotoUrl = await saveNewImage({
            base64Data: scalePhoto,
            folder: "scales",
            fileName: `scale_day1_${user.id}_${Date.now()}`,
          });
        } catch (photoErr) {
          console.error("Failed to save Day-1 scale photo:", photoErr);
        }
      }

      // Save scale + person on machine photo proof if provided
      let personScalePhotoUrl: string | null = null;
      if (personScalePhoto) {
        try {
          personScalePhotoUrl = await saveNewImage({
            base64Data: personScalePhoto,
            folder: "scales",
            fileName: `person_scale_day1_${user.id}_${Date.now()}`,
          });
        } catch (personErr) {
          console.error("Failed to save Day-1 person on scale photo:", personErr);
        }
      }

      // Save digital signature proof if provided
      let savedSignatureUrl: string | null = null;
      if (signatureDataUrl) {
        try {
          savedSignatureUrl = await saveNewImage({
            base64Data: signatureDataUrl,
            folder: "signatures",
            fileName: `signature_day1_${user.id}_${Date.now()}`,
          });
        } catch (sigErr) {
          console.error("Failed to save Day-1 digital signature image:", sigErr);
        }
      }

      // Save Emirates ID photo proof if provided
      let savedEmiratesIdPhotoUrl: string | null = null;
      if (emiratesIdPhoto) {
        try {
          savedEmiratesIdPhotoUrl = await saveNewImage({
            base64Data: emiratesIdPhoto,
            folder: "emirates_ids",
            fileName: `emirates_id_${user.id}_${Date.now()}`,
          });
        } catch (idErr) {
          console.error("Failed to save Day-1 Emirates ID photo:", idErr);
        }
      }

      // Execute atomic transaction: create WeighIn and update User status
      const [weighIn, updatedUser] = await prisma.$transaction([
        prisma.weighIn.create({
          data: {
            userId: user.id,
            type: "DAY_1",
            weightKg: weightNum,
            branchId: effectiveBranchId,
            loggedByStaffId: session.userId,
            photoUrl: scalePhotoUrl,
            personScalePhotoUrl: personScalePhotoUrl || null,
            emiratesIdPhotoUrl: savedEmiratesIdPhotoUrl || emiratesIdPhoto || null,
            signatureUrl: savedSignatureUrl || signatureDataUrl,
          },
          include: { branch: true, loggedByStaff: true },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            status: "ACTIVE",
            day1Date: now,
            deadlineDate: deadline,
          },
        }),
      ]);

      // Fetch challenge settings for terms & rules
      const settings = await prisma.challengeSettings.findUnique({
        where: { id: "singleton" },
      });

      // Generate signed Terms & Conditions Agreement PDF
      let termsPdfBytes: Uint8Array | null = null;
      try {
        termsPdfBytes = await generateTermsAgreementPdf({
          userName: user.name,
          userId: user.id,
          emiratesId: user.emiratesId,
          mobile: user.mobile,
          email: user.email,
          branchName: weighIn.branch.label,
          day1WeightKg: weightNum,
          day1Date: now,
          deadlineDate: deadline,
          signatureDataUrl: signatureDataUrl || savedSignatureUrl,
          staffName: session.name || session.username,
          rulesText: settings?.rulesText,
          termsText: settings?.termsText,
        });
      } catch (pdfErr) {
        console.error("Terms & Conditions PDF generation failed:", pdfErr);
      }

      // Trigger Email #2 with signed Terms & Conditions PDF attached
      try {
        await sendDay1Email({
          email: user.email,
          name: user.name,
          userId: user.id,
          weightKg: weightNum,
          branchName: weighIn.branch.label,
          day1Date: now,
          deadlineDate: deadline,
          rulesText: settings?.rulesText,
          pdfBytes: termsPdfBytes,
          emiratesId: user.emiratesId,
          mobile: user.mobile,
          signatureDataUrl: signatureDataUrl || savedSignatureUrl,
          staffName: session.name || session.username,
        });
      } catch (err) {
        console.error("Day-1 email dispatch failed:", err);
      }

      return NextResponse.json({
        success: true,
        message: "Day-1 weigh-in logged successfully. 30-day challenge clock started!",
        user: updatedUser,
        weighIn: {
          ...weighIn,
          weightKg: Number(weighIn.weightKg),
        },
      });
    }

    // ==========================================
    // CASE 2: FINAL WEIGH-IN
    // ==========================================
    if (type === "FINAL") {
      if (user.status !== "ACTIVE") {
        return NextResponse.json(
          { error: `Cannot log Final weigh-in. Participant is currently '${user.status}'.` },
          { status: 400 }
        );
      }

      // Strict 30-Day Return Window Validation
      const windowInfo = getFinalWeighInWindow(user.day1Date, user.deadlineDate);
      if (windowInfo.status === "EXPIRED") {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: "DISQUALIFIED", disqualifiedAt: now },
        });
        return NextResponse.json(
          { error: windowInfo.message },
          { status: 400 }
        );
      }

      if (!windowInfo.isEligible) {
        return NextResponse.json(
          { error: windowInfo.message },
          { status: 400 }
        );
      }

      if (!signatureDataUrl) {
        return NextResponse.json(
          { error: "Digital signature is required to complete final weigh-in." },
          { status: 400 }
        );
      }

      // Retrieve Day-1 record
      const day1Record = user.weighIns.find((w) => w.type === "DAY_1");
      if (!day1Record) {
        return NextResponse.json(
          { error: "Day-1 record not found for this participant." },
          { status: 400 }
        );
      }

      const kgLost = parseFloat((Number(day1Record.weightKg) - weightNum).toFixed(3));

      // Save scale photo proof if provided
      let scalePhotoUrl: string | null = null;
      if (scalePhoto) {
        try {
          scalePhotoUrl = await saveNewImage({
            base64Data: scalePhoto,
            folder: "scales",
            fileName: `scale_final_${user.id}_${Date.now()}`,
          });
        } catch (photoErr) {
          console.error("Failed to save Final scale photo:", photoErr);
        }
      }

      // Save scale + person photo proof if provided
      let personScalePhotoUrl: string | null = null;
      if (personScalePhoto) {
        try {
          personScalePhotoUrl = await saveNewImage({
            base64Data: personScalePhoto,
            folder: "scales",
            fileName: `person_scale_final_${user.id}_${Date.now()}`,
          });
        } catch (personErr) {
          console.error("Failed to save Final person on scale photo:", personErr);
        }
      }

      // Save Emirates ID photo proof if provided
      let savedEmiratesIdPhotoUrl: string | null = null;
      if (emiratesIdPhoto) {
        try {
          savedEmiratesIdPhotoUrl = await saveNewImage({
            base64Data: emiratesIdPhoto,
            folder: "emirates_ids",
            fileName: `emirates_id_final_${user.id}_${Date.now()}`,
          });
        } catch (idErr) {
          console.error("Failed to save Final Emirates ID photo:", idErr);
        }
      }

      // Save signature as PNG image file and get URL path
      let savedSignatureUrl: string | null = null;
      if (signatureDataUrl) {
        try {
          savedSignatureUrl = await saveNewImage({
            base64Data: signatureDataUrl,
            folder: "signatures",
            fileName: `signature_${user.id}_${Date.now()}`,
            extension: "png",
          });
        } catch (sigErr) {
          console.error("Failed to save digital signature image:", sigErr);
        }
      }

      const existingFinal = user.weighIns.find((w) => w.type === "FINAL");
      if (existingFinal) {
        return NextResponse.json(
          { error: "Final weigh-in has already been recorded for this participant." },
          { status: 400 }
        );
      }

      // Execute atomic transaction: record Final weigh-in and update User status
      const [finalWeighIn, updatedUser] = await prisma.$transaction([
        prisma.weighIn.create({
          data: {
            userId: user.id,
            type: "FINAL",
            weightKg: weightNum,
            branchId: effectiveBranchId,
            loggedByStaffId: session.userId,
            photoUrl: scalePhotoUrl,
            personScalePhotoUrl: personScalePhotoUrl || null,
            emiratesIdPhotoUrl: savedEmiratesIdPhotoUrl || emiratesIdPhoto || null,
            signatureUrl: savedSignatureUrl || signatureDataUrl,
          },
          include: { branch: true, loggedByStaff: true },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            status: "COMPLETED",
          },
        }),
      ]);

      // Fetch challenge settings for rules text
      const settings = await prisma.challengeSettings.findUnique({
        where: { id: "singleton" },
      });

      // Generate PDF Certificate
      let pdfBytes: Uint8Array | null = null;
      try {
        pdfBytes = await generateChallengePdf({
          userName: user.name,
          userId: user.id,
          emiratesId: user.emiratesId,
          mobile: user.mobile,
          email: user.email,
          branchName: finalWeighIn.branch.label,
          day1WeightKg: Number(day1Record.weightKg),
          day1Date: day1Record.createdAt,
          finalWeightKg: weightNum,
          finalDate: now,
          kgLost: kgLost,
          signatureDataUrl: signatureDataUrl,
          staffName: session.name || session.username,
          rulesText: settings?.rulesText,
        });
      } catch (pdfErr) {
        console.error("PDF generation failed:", pdfErr);
      }

      // Trigger Email #3
      if (pdfBytes) {
        try {
          await sendFinalResultEmail({
            email: user.email,
            name: user.name,
            userId: user.id,
            day1WeightKg: Number(day1Record.weightKg),
            finalWeightKg: weightNum,
            kgLost: kgLost,
            pdfBytes: pdfBytes,
          });
        } catch (mailErr) {
          console.error("Final result email failed:", mailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Final weigh-in successfully recorded and verified!",
        user: updatedUser,
        weighIn: {
          ...finalWeighIn,
          weightKg: Number(finalWeighIn.weightKg),
        },
        kgLost,
        day1Weight: Number(day1Record.weightKg),
        finalWeight: weightNum,
      });
    }

    return NextResponse.json({ error: "Invalid weigh-in type." }, { status: 400 });
  } catch (error: any) {
    console.error("Weigh-in processing error:", error);
    return NextResponse.json(
      { error: "Failed to process weigh-in. Please try again." },
      { status: 500 }
    );
  }
}
