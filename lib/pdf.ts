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