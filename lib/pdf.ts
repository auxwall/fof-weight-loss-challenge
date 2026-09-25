import { PDFDocument, rgb, StandardFonts, PDFFont, degrees } from "pdf-lib";
import fs from "fs";
import path from "path";
import { formatDubai } from "./dayjs";

export interface ChallengePdfData {
  userName: string;
  userId: string;
  emiratesId: string;
  mobile: string;
  email: string;
  branchName: string;
  day1WeightKg: number;
  day1Date: Date | string;
  finalWeightKg: number;
  finalDate: Date | string;
  kgLost: number;
  signatureDataUrl?: string | null;
  staffName?: string | null;
  rulesText?: string | null;
}

// ---------------------------------------------------------------------------
// Layout constants — A4 LANDSCAPE (297 x 210mm)
// Exact match to the reference luxury certificate:
// - Flowing red & gold background curves with top-right & bottom-center ribbon medals
// - Deep crimson serif "CERTIFICATE"
// - Elegant italic "Of Participation"
// - Clean sentence-case "This certificate is proudly presented to"
// - Prominent cursive-italic recipient name with gold underline
// - Centered 3-line italic citation text
// - Balanced left & right signature / verification baselines flanking the center medal
// ---------------------------------------------------------------------------
const PAGE_WIDTH = 841.89; // A4 landscape
const PAGE_HEIGHT = 595.28;
// Optical center shifted slightly right (448) to align with the diamond watermark
// and balance against the sweeping decorative waves on the left.
const CONTENT_CENTER_X = 448;
const LOGO_MAX_WIDTH = 200;
const LOGO_MAX_HEIGHT = 200;

// ---- Color palette matching the reference certificate ---------------------
const redCrimson = rgb(0.55, 0.11, 0.14); // #8B1D24 deep crimson header & name
const goldLine = rgb(0.78, 0.62, 0.28); // #C79E47 warm metallic gold accent
const textBlack = rgb(0.08, 0.08, 0.08); // near-black for "Of Participation"
const textDark = rgb(0.18, 0.18, 0.18); // charcoal for body & signatures
const textMuted = rgb(0.45, 0.45, 0.45); // muted gray for subtitles
const pageBgFallback = rgb(0.995, 0.99, 0.97);

export async function generateChallengePdf(data: ChallengePdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { width, height } = page.getSize();

  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ---- drawing helpers ---------------------------------------------------
  const drawRight = (text: string, rightX: number, y: number, size: number, font: PDFFont, color = textMuted) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: rightX - w, y, size, font, color });
  };

  const drawCentered = (text: string, centerX: number, y: number, size: number, font: PDFFont, color = textDark) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: centerX - w / 2, y, size, font, color });
  };

  const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const attempt = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(attempt, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = attempt;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  // ---- 1. background: high-res template image or fallback -----------------
  const templatePath = path.join(process.cwd(), "public", "certificate-template.jpg");
  let hasTemplate = false;

  if (fs.existsSync(templatePath)) {
    try {
      const templateBytes = fs.readFileSync(templatePath);
      const templateImage = await pdfDoc.embedJpg(templateBytes);
      page.drawImage(templateImage, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });
      hasTemplate = true;
    } catch (err) {
      console.error("Failed to embed certificate template background:", err);
    }
  }

  if (!hasTemplate) {
    page.drawRectangle({ x: 0, y: 0, width, height, color: pageBgFallback });
  }

  // Ref ID (discreet top-right)
  drawRight(`REF: ${data.userId}`, width - 42, height - 28, 7.5, fontRegular, textMuted);

  // ---- 2. header flow: Gym Logo + Titles ----------------------------------
  let cursorY = height - 42;

  // Gym logo (centered, proportional)
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const ratio = logoImage.width / logoImage.height;
      let logoDrawW = LOGO_MAX_WIDTH;
      let logoDrawH = LOGO_MAX_WIDTH / ratio;
      if (logoDrawH > LOGO_MAX_HEIGHT) {
        logoDrawH = LOGO_MAX_HEIGHT;
        logoDrawW = LOGO_MAX_HEIGHT * ratio;
      }
      page.drawImage(logoImage, {
        x: CONTENT_CENTER_X - logoDrawW / 2,
        y: cursorY - logoDrawH - 20,
        width: logoDrawW,
        height: logoDrawH,
      });
      cursorY -= logoDrawH + 24;
    } catch (err) {
      console.error("Failed to embed logo:", err);
      cursorY -= 16;
    }
  } else {
    cursorY -= 20;
  }

  // Title: "CERTIFICATE" (Crimson Serif Bold, matching reference)
  drawCentered("CERTIFICATE", CONTENT_CENTER_X, cursorY - 30, 41, fontSerifBold, redCrimson);
  cursorY -= 33;

  // Subtitle: "Of Participation" (Black Serif Italic, matching reference)
  drawCentered("Of Participation", CONTENT_CENTER_X, cursorY - 30, 22, fontSerifItalic, textBlack);
  cursorY -= 40;

  // Lead-in: "This certificate is proudly presented to" (Sentence-case, clean charcoal)
  drawCentered("This certificate is proudly presented to", CONTENT_CENTER_X, cursorY - 20, 12, fontRegular, textDark);
  cursorY -= 48;

  // ---- 3. recipient name (Centerpiece in Crimson Script/Italic) -----------
  drawCentered(data.userName, CONTENT_CENTER_X, cursorY - 30, 46, fontSerifItalic, redCrimson);
  cursorY -= 14;

  // Thin gold accent underline below recipient name
  const underlineW = 380;
  page.drawLine({
    start: { x: CONTENT_CENTER_X - underlineW / 2, y: cursorY - 30 },
    end: { x: CONTENT_CENTER_X + underlineW / 2, y: cursorY - 30 },
    thickness: 1.25,
    color: goldLine,
  });
  cursorY -= 44;

  // ---- 4. citation paragraph (centered in Serif Italic with proper spacing)
  const kgLostDisplay = `${Math.abs(Number(data.kgLost)).toFixed(3)} kg`;
  const paragraph =
    `has successfully completed the Club Weight Loss Challenge at ${data.branchName}, ` +
    `achieving a verified total weight loss of ${kgLostDisplay} — from ${Number(data.day1WeightKg).toFixed(3)} kg ` +
    `on ${formatDubai(data.day1Date, "DD MMM YYYY")} to ${Number(data.finalWeightKg).toFixed(3)} kg on ${formatDubai(
      data.finalDate,
      "DD MMM YYYY"
    )}.`;
  const paraLines = wrapText(paragraph, fontSerifItalic, 12.5, 480);
  for (const line of paraLines) {
    drawCentered(line, CONTENT_CENTER_X, cursorY - 20, 12.5, fontSerifItalic, textDark);
    cursorY -= 20;
  }

  // ---- 5. verification / signatories (balanced horizontal baselines) -----
  const lineY = 100;
  const colHalfW = 68; // 136pt line width
  const leftColX = 300;
  const rightColX = 596;


  // Official Stamp (Top of Right Signatory)
  const stampPath = path.join(process.cwd(), "public", "stamp.png");
  if (fs.existsSync(stampPath)) {
    try {
      const stampBytes = fs.readFileSync(stampPath);
      const stampImage = await pdfDoc.embedPng(stampBytes);
      const stampW = 160;
      const stampH = (stampW / stampImage.width) * stampImage.height;

      // Slight authentic stamp rotation angle (-4 degrees)
      const angleDeg = 8;
      const angleRad = (angleDeg * Math.PI) / 180;

      // Center of the stamp above the signatory baseline
      const centerX = rightColX;
      const centerY = lineY + 6 + stampH / 2;

      // Pivot rotation around center so the stamp stays centered
      const drawX = centerX - (stampW / 2) * Math.cos(angleRad) + (stampH / 2) * Math.sin(angleRad);
      const drawY = centerY - (stampW / 2) * Math.sin(angleRad) - (stampH / 2) * Math.cos(angleRad);

      page.drawImage(stampImage, {
        x: drawX,
        y: drawY,
        width: stampW,
        height: stampH,
        rotate: degrees(angleDeg),
      });
    } catch (err) {
      console.error("Failed to embed stamp in PDF:", err);
    }
  }

  drawCentered(formatDubai(new Date(), "DD MMM YYYY"), leftColX, lineY + 10, 10.5, fontBold, textDark);
  // Left Signatory / Date
  page.drawLine({
    start: { x: leftColX - colHalfW, y: lineY },
    end: { x: leftColX + colHalfW, y: lineY },
    thickness: 0.5,
    color: textDark,
  });
  drawCentered("Date", leftColX, lineY - 16, 10.5, fontBold, textDark);

  // Right Signatory / Branch
  page.drawLine({
    start: { x: rightColX - colHalfW, y: lineY },
    end: { x: rightColX + colHalfW, y: lineY },
    thickness: 0.5,
    color: textDark,
  });
  drawCentered("Authorized club signature", rightColX, lineY - 16, 9.5, fontBold, textDark);

  // Discreet official footer
  drawCentered(
    "WEIGHT LOSS CHALLENGE · DUBAI, UAE · CONFIDENTIAL & VERIFIED",
    CONTENT_CENTER_X,
    28,
    7,
    fontRegular,
    textMuted
  );

  return pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Day-1 Terms & Conditions Agreement PDF (A4 Portrait)
// ---------------------------------------------------------------------------
export interface TermsAgreementPdfData {
  userName: string;
  userId: string;
  emiratesId: string;
  mobile: string;
  email: string;
  branchName: string;
  day1WeightKg?: number | null;
  day1Date?: Date | string | null;
  deadlineDate?: Date | string | null;
  signatureDataUrl?: string | null;
  staffName?: string | null;
  rulesText?: string | null;
  termsText?: string | null;
  isRegistration?: boolean;
}

export async function generateTermsAgreementPdf(data: TermsAgreementPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // A4 Portrait dimensions: 595.28 x 841.89 pt
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const marginX = 40;
  const contentWidth = PAGE_W - marginX * 2; // 515.28 pt

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const cRed = rgb(0.83, 0.11, 0.14); // #D32F2F / #EC1C23
  const cDark = rgb(0.12, 0.12, 0.12);
  const cGray = rgb(0.4, 0.4, 0.4);
  const cLightGray = rgb(0.9, 0.9, 0.9);
  const cBoxBg = rgb(0.97, 0.97, 0.97);

  // Helper for multi-line text wrapping
  const wrapParagraph = (text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] => {
    const lines: string[] = [];
    const rawParagraphs = text.split("\n");
    for (const rawP of rawParagraphs) {
      if (!rawP.trim()) {
        lines.push("");
        continue;
      }
      const words = rawP.split(/\s+/);
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  };

  // Default challenge rules if not set in DB
  const defaultRules = [
    "1. This is an official 30-day weight loss challenge starting from your Day-1 weigh-in at any Face Off Fitness club.",
    "2. All participants must return to any Face Off Fitness club on Day 30 / Day 31 for their official final weigh-in.",
    "3. Failure to return on or before Day 31 results in automatic disqualification.",
    "4. Official starting and final weigh-ins must be conducted under direct staff supervision with digital scale display, Emirates ID, and person on scale photo proofs logged.",
    "5. Winners are determined strictly by total verified kilograms lost (Day-1 Weight minus Final Weight).",
    "6. Cash Prize Pool of 18,000 AED: 1st Place (10,000 AED), 2nd Place (5,000 AED), 3rd Place (3,000 AED).",
    "7. Management's decision on final results, rankings, and prize distribution is final and binding.",
  ].join("\n");

  // Default legal terms & conditions if not set in DB
  const defaultTerms = [
    "1. Participation Eligibility: The participant confirms they are 18 years of age or older, in sound medical and physical health, and under no medical restriction that prohibits participation in weight loss or exercise activities.",
    "2. Official Weigh-In Protocols: The participant agrees to step on the certified club scale and permit authorized staff to take and store scale display photos, participant on scale photos, and Emirates ID verification photos for authentic auditing.",
    "3. Voluntary Undertaking & Health Disclaimer: The participant acknowledges that weight loss routines involve dietary adjustments and physical exertion undertaken voluntarily at their own discretion. Face Off Fitness and its management are held harmless from any personal illness, fatigue, or health complications resulting from extreme or unsafe self-directed regimens.",
    "4. Disqualification Conditions: Any evidence of tampering with weight readings, deceptive attire/objects, deliberate dehydration/unhealthy practices, or failure to perform final weigh-in within the specified window shall lead to immediate disqualification without right of appeal.",
    "5. Marketing & Media Release: The participant grants Face Off Fitness the right to publish winner announcements, names, and leaderboard rankings across gym displays, social media channels, and television screens for promotional purposes.",
    "6. Digital Signature & Legal Enforceability: The participant confirms that their digital signature captured on the registration terminal constitutes an authentic, binding legal signature confirming full acceptance of these Terms, Conditions, and Challenge Rules.",
  ].join("\n");

  const rulesText = (data.rulesText && data.rulesText.trim()) || defaultRules;
  const termsText = (data.termsText && data.termsText.trim()) || defaultTerms;

  // Embed logo once
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  let logoImage: any = null;
  let logoDrawW = 105;
  let logoDrawH = 30;
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
      logoDrawH = (logoDrawW / logoImage.width) * logoImage.height;
    } catch {}
  }

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 36;

  // Header drawing function
  const drawPageHeader = (pageNum: number) => {
    // Red Accent Bar
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 6,
      width: PAGE_W,
      height: 6,
      color: cRed,
    });

    if (pageNum === 1) {
      // First page title
      const titleText = data.day1WeightKg ? "DAY-1 CHALLENGE AGREEMENT & RULES" : "TERMS & CONDITIONS & OFFICIAL RULES";
      const titleW = fontBold.widthOfTextAtSize(titleText, 12);
      page.drawText(titleText, {
        x: PAGE_W - marginX - titleW,
        y: y - 10,
        size: 12,
        font: fontBold,
        color: cDark,
      });

      const subTitle = "Face Off Fitness · 30-Day Weight Loss Challenge";
      const subTitleW = fontRegular.widthOfTextAtSize(subTitle, 8.5);
      page.drawText(subTitle, {
        x: PAGE_W - marginX - subTitleW,
        y: y - 22,
        size: 8.5,
        font: fontRegular,
        color: cRed,
      });

      const dateStr = data.day1Date ? formatDubai(data.day1Date, "DD MMM YYYY") : formatDubai(new Date(), "DD MMM YYYY");
      const refText = `User ID: ${data.userId} · Date: ${dateStr}`;
      const refW = fontRegular.widthOfTextAtSize(refText, 8);
      page.drawText(refText, {
        x: PAGE_W - marginX - refW,
        y: y - 33,
        size: 8,
        font: fontRegular,
        color: cGray,
      });
    } else {
      // Header for continuation page
      page.drawText("TERMS & CONDITIONS & OFFICIAL RULES (CONTINUED)", {
        x: marginX,
        y: PAGE_H - 26,
        size: 9.5,
        font: fontBold,
        color: cDark,
      });
      const pageInfo = `User ID: ${data.userId} · Page ${pageNum}`;
      const pageInfoW = fontRegular.widthOfTextAtSize(pageInfo, 8);
      page.drawText(pageInfo, {
        x: PAGE_W - marginX - pageInfoW,
        y: PAGE_H - 26,
        size: 8,
        font: fontRegular,
        color: cGray,
      });
      page.drawLine({
        start: { x: marginX, y: PAGE_H - 34 },
        end: { x: PAGE_W - marginX, y: PAGE_H - 34 },
        thickness: 0.75,
        color: cLightGray,
      });
    }
  };

  if (logoImage) {
    page.drawImage(logoImage, {
      x: marginX,
      y: y - logoDrawH,
      width: logoDrawW,
      height: logoDrawH,
    });
  } else {
    page.drawText("FACE OFF FITNESS", { x: marginX, y: y - 16, size: 14, font: fontBold, color: cRed });
  }

  drawPageHeader(1);
  y -= 48;

  // Thin top separator
  page.drawLine({
    start: { x: marginX, y },
    end: { x: PAGE_W - marginX, y },
    thickness: 1,
    color: cLightGray,
  });

  y -= 12;

  // 1. Participant & Day-1 Details Summary Box
  const boxHeight = 66;
  page.drawRectangle({
    x: marginX,
    y: y - boxHeight,
    width: contentWidth,
    height: boxHeight,
    color: cBoxBg,
    borderColor: cLightGray,
    borderWidth: 1,
  });

  const col1X = marginX + 12;
  const col2X = marginX + 180;
  const col3X = marginX + 355;
  const row1Y = y - 16;
  const row2Y = y - 33;
  const row3Y = y - 50;

  // Row 1
  page.drawText("Participant Name:", { x: col1X, y: row1Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(data.userName, { x: col1X + 75, y: row1Y, size: 7.5, font: fontBold, color: cDark });

  page.drawText("Emirates ID:", { x: col2X, y: row1Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(data.emiratesId, { x: col2X + 54, y: row1Y, size: 7.5, font: fontBold, color: cDark });

  const hasWeight = data.day1WeightKg !== undefined && data.day1WeightKg !== null && !isNaN(Number(data.day1WeightKg));
  const startingWeightText = hasWeight ? `${Number(data.day1WeightKg).toFixed(3)} kg` : "Pending (Day-1 Visit)";
  page.drawText("Starting Weight:", { x: col3X, y: row1Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(startingWeightText, { x: col3X + 68, y: row1Y, size: hasWeight ? 8.5 : 7.5, font: fontBold, color: hasWeight ? cRed : cGray });

  // Row 2
  page.drawText("Mobile / Phone:", { x: col1X, y: row2Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(data.mobile, { x: col1X + 75, y: row2Y, size: 7.5, font: fontRegular, color: cDark });

  page.drawText("Email Address:", { x: col2X, y: row2Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(data.email, { x: col2X + 54, y: row2Y, size: 7.5, font: fontRegular, color: cDark });

  const day1DateDisplay = data.day1Date ? formatDubai(data.day1Date, "DD MMM YYYY") : "Pending Day-1 Visit";
  page.drawText("Day-1 Date:", { x: col3X, y: row2Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(day1DateDisplay, { x: col3X + 68, y: row2Y, size: 7.5, font: fontBold, color: cDark });

  // Row 3
  page.drawText("Registered Club:", { x: col1X, y: row3Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(data.branchName, { x: col1X + 75, y: row3Y, size: 7.5, font: fontRegular, color: cDark });

  const staffDisplay = data.staffName || (hasWeight ? "Authorized Staff" : "Online Registration");
  page.drawText("Logged By Staff:", { x: col2X, y: row3Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(staffDisplay, { x: col2X + 68, y: row3Y, size: 7.5, font: fontRegular, color: cDark });

  const deadlineDisplay = data.deadlineDate ? formatDubai(data.deadlineDate, "DD MMM YYYY") : "30 Days from Day-1";
  page.drawText("Final Window:", { x: col3X, y: row3Y, size: 7.5, font: fontRegular, color: cGray });
  page.drawText(deadlineDisplay, { x: col3X + 68, y: row3Y, size: 7.5, font: fontBold, color: cRed });

  y -= boxHeight + 14;

  // TERMS & CONDITIONS & RULES (Directly from database settings, identical to /terms page)
  page.drawText("CHALLENGE AGREEMENT, RULES & TERMS AND CONDITIONS", {
    x: marginX,
    y,
    size: 8.5,
    font: fontBold,
    color: cRed,
  });
  y -= 11;

  // Combine termsText (from database) and rulesText if separate, ensuring the exact database terms are displayed
  const combinedAgreementText = termsText || rulesText;
  const agreementLines = wrapParagraph(combinedAgreementText, contentWidth, 7, fontRegular);

  for (const line of agreementLines) {
    if (line === "") {
      y -= 3;
      continue;
    }

    // Check if we need to spill to a continuation page to keep signatures completely intact
    if (y < 155) {
      // Add continuation page
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      drawPageHeader(2);
      y = PAGE_H - 50;

      page.drawText("CHALLENGE AGREEMENT & TERMS AND CONDITIONS (CONTINUED)", {
        x: marginX,
        y,
        size: 8.5,
        font: fontBold,
        color: cRed,
      });
      y -= 12;
    }

    page.drawText(line, {
      x: marginX,
      y,
      size: 7,
      font: fontRegular,
      color: cDark,
    });
    y -= 10;
  }

  // If rulesText is distinct from termsText and both exist in DB, display additional rules section
  if (data.rulesText && data.rulesText.trim() && data.termsText && data.termsText.trim() && data.rulesText.trim() !== data.termsText.trim()) {
    y -= 6;
    if (y < 155) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      drawPageHeader(pdfDoc.getPageCount());
      y = PAGE_H - 50;
    }

    page.drawText("ADDITIONAL CHALLENGE RULES", {
      x: marginX,
      y,
      size: 8.5,
      font: fontBold,
      color: cRed,
    });
    y -= 11;

    const rulesLines = wrapParagraph(rulesText, contentWidth, 7, fontRegular);
    for (const line of rulesLines) {
      if (line === "") {
        y -= 3;
        continue;
      }
      if (y < 155) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        drawPageHeader(pdfDoc.getPageCount());
        y = PAGE_H - 50;
      }
      page.drawText(line, {
        x: marginX,
        y,
        size: 7,
        font: fontRegular,
        color: cDark,
      });
      y -= 10;
    }
  }

  // Ensure signatures are on the current page with sufficient room, or add a dedicated sign page if full
  if (y < 145) {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    drawPageHeader(pdfDoc.getPageCount());
    y = PAGE_H - 50;
  }

  // 3. Signatures & Verification Section
  const sigSectionY = 135;

  page.drawLine({
    start: { x: marginX, y: sigSectionY + 16 },
    end: { x: PAGE_W - marginX, y: sigSectionY + 16 },
    thickness: 1,
    color: cLightGray,
  });

  const sigColW = 200;
  const leftSigX = marginX + 15;
  const rightSigX = PAGE_W - marginX - sigColW - 15;

  // Left Side: Participant Signature Box
  page.drawText("PARTICIPANT DIGITAL SIGNATURE & CONSENT", {
    x: leftSigX,
    y: sigSectionY,
    size: 7.5,
    font: fontBold,
    color: cDark,
  });

  // Embed Customer Signature Image if available
  if (data.signatureDataUrl && data.signatureDataUrl.startsWith("data:image/")) {
    try {
      const base64Data = data.signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
      const sigBytes = Buffer.from(base64Data, "base64");
      const isPng = data.signatureDataUrl.includes("image/png");
      const sigImage = isPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);

      const targetW = 130;
      const targetH = Math.min(42, (targetW / sigImage.width) * sigImage.height);

      page.drawImage(sigImage, {
        x: leftSigX,
        y: sigSectionY - 48,
        width: targetW,
        height: targetH,
      });
    } catch (sigErr) {
      console.error("Could not embed participant signature in Terms PDF:", sigErr);
      page.drawText("(Digitally Signed on Registration / Day-1)", {
        x: leftSigX,
        y: sigSectionY - 30,
        size: 7.5,
        font: fontItalic,
        color: cRed,
      });
    }
  } else {
    page.drawText("(Digitally Signed on Registration / Day-1)", {
      x: leftSigX,
      y: sigSectionY - 30,
      size: 7.5,
      font: fontItalic,
      color: cRed,
    });
  }

  page.drawLine({
    start: { x: leftSigX, y: sigSectionY - 52 },
    end: { x: leftSigX + sigColW, y: sigSectionY - 52 },
    thickness: 0.75,
    color: cDark,
  });
  page.drawText(`${data.userName} (Participant)`, {
    x: leftSigX,
    y: sigSectionY - 64,
    size: 7,
    font: fontBold,
    color: cDark,
  });
  const signedDateText = data.day1Date ? formatDubai(data.day1Date, "DD MMM YYYY, hh:mm A") : formatDubai(new Date(), "DD MMM YYYY, hh:mm A");
  page.drawText(`Date Signed: ${signedDateText}`, {
    x: leftSigX,
    y: sigSectionY - 74,
    size: 6.5,
    font: fontRegular,
    color: cGray,
  });

  // Right Side: Authorized Club Verification & Stamp
  page.drawText("AUTHORIZED CLUB VERIFICATION & STAMP", {
    x: rightSigX,
    y: sigSectionY,
    size: 7.5,
    font: fontBold,
    color: cDark,
  });

  // Official Stamp image on right
  const stampPath = path.join(process.cwd(), "public", "stamp.png");
  if (fs.existsSync(stampPath)) {
    try {
      const stampBytes = fs.readFileSync(stampPath);
      const stampImage = await pdfDoc.embedPng(stampBytes);
      const stampW = 75;
      const stampH = (stampW / stampImage.width) * stampImage.height;
      page.drawImage(stampImage, {
        x: rightSigX + 60,
        y: sigSectionY - 50,
        width: stampW,
        height: stampH,
      });
    } catch {
      // Stamp optional
    }
  }

  page.drawLine({
    start: { x: rightSigX, y: sigSectionY - 52 },
    end: { x: rightSigX + sigColW, y: sigSectionY - 52 },
    thickness: 0.75,
    color: cDark,
  });
  page.drawText(`Face Off Fitness · ${data.branchName}`, {
    x: rightSigX,
    y: sigSectionY - 64,
    size: 7,
    font: fontBold,
    color: cDark,
  });
  const verifiedByText = data.staffName || (data.day1WeightKg ? "Authorized Club Staff" : "Online System / Club Staff");
  page.drawText(`Verified by: ${verifiedByText}`, {
    x: rightSigX,
    y: sigSectionY - 74,
    size: 6.5,
    font: fontRegular,
    color: cGray,
  });

  // Footer Disclaimer on each page
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    pages[i].drawText(
      `WEIGHT LOSS CHALLENGE · OFFICIAL LEGAL AGREEMENT · FACE OFF FITNESS DUBAI, UAE · PAGE ${i + 1} OF ${pages.length}`,
      {
        x: marginX,
        y: 20,
        size: 6.5,
        font: fontRegular,
        color: cGray,
      }
    );
  }

  return pdfDoc.save();
}