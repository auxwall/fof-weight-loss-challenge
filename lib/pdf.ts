import { PDFDocument, rgb, StandardFonts, PDFFont, degrees } from "pdf-lib";
import fs from "fs";
import path from "path";
import dayjs, { formatDubai, DUBAI_TZ } from "./dayjs";

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
// Production-safe asset resolver
// ---------------------------------------------------------------------------
export function resolveAssetPath(relativePath: string): string | null {
  const cleanPath = relativePath.replace(/^[/\\]+/, "");
  const candidates = [
    path.join(process.cwd(), "storage", cleanPath),
    path.join(process.cwd(), "public", cleanPath),
    path.join(process.cwd(), cleanPath),
    path.join(__dirname, "..", "storage", cleanPath),
    path.join(__dirname, "..", "public", cleanPath),
    path.join(__dirname, "..", "..", "storage", cleanPath),
    path.join(__dirname, "..", "..", "public", cleanPath),
    path.join(__dirname, "storage", cleanPath),
    path.join(__dirname, "public", cleanPath),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 100% WinAnsi-safe text sanitizer (Prevents fatal "WinAnsi cannot encode" errors)
// Replaces mathematical minus signs (0x2212), curly quotes, dashes, bullets,
// emojis, Arabic and non-Latin characters so standard PDF fonts NEVER crash.
// ---------------------------------------------------------------------------
export function sanitizePdfText(str: string | null | undefined): string {
  if (!str) return "";
  return (
    str
      // Normalize Unicode decomposition
      .normalize("NFKD")
      // Replace all unicode minus signs and dashes (including 0x2212 mathematical minus!)
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
      // Replace smart/curly quotes & apostrophes
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      // Replace ellipsis
      .replace(/\u2026/g, "...")
      // Replace bullets
      .replace(/[\u2022\u25CF\u25CB]/g, "*")
      // Replace non-breaking spaces and zero-width spaces
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // Filter out characters above 255 (e.g. Arabic, emojis, Cyrillic, CJK)
      .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, "")
      .trim()
  );
}

// Safe font width measurement that never throws
export function safeWidthOfTextAtSize(font: PDFFont, text: string, size: number): number {
  const clean = sanitizePdfText(text);
  if (!clean) return 0;
  try {
    return font.widthOfTextAtSize(clean, size);
  } catch {
    return clean.length * (size * 0.55);
  }
}

// Safe text drawing helper that never throws
export function safeDrawText(targetPage: any, text: string, options: any): void {
  const clean = sanitizePdfText(text);
  if (!clean) return;
  try {
    targetPage.drawText(clean, options);
  } catch (err) {
    console.warn("safeDrawText suppressed font encoding error:", err);
  }
}

// Shared text wrapping utility
export function wrapPdfText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const cleanText = sanitizePdfText(text);
  if (!cleanText) return [];
  const words = cleanText.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (safeWidthOfTextAtSize(font, attempt, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ---------------------------------------------------------------------------
// Layout constants — A4 LANDSCAPE (297 x 210mm)
// ---------------------------------------------------------------------------
const PAGE_WIDTH = 841.89; // A4 landscape
const PAGE_HEIGHT = 595.28;
const CONTENT_CENTER_X = 448;
const LOGO_MAX_WIDTH = 200;
const LOGO_MAX_HEIGHT = 200;

// Color palette
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

  // Drawing helpers
  const drawRight = (text: string, rightX: number, y: number, size: number, font: PDFFont, color = textMuted) => {
    const clean = sanitizePdfText(text);
    if (!clean) return;
    const w = safeWidthOfTextAtSize(font, clean, size);
    safeDrawText(page, clean, { x: rightX - w, y, size, font, color });
  };

  const drawCentered = (text: string, centerX: number, y: number, size: number, font: PDFFont, color = textDark) => {
    const clean = sanitizePdfText(text);
    if (!clean) return;
    const w = safeWidthOfTextAtSize(font, clean, size);
    safeDrawText(page, clean, { x: centerX - w / 2, y, size, font, color });
  };

  // 1. Background template
  const templatePath = resolveAssetPath("certificate-template.jpg");
  let hasTemplate = false;

  if (templatePath) {
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

  // Ref ID
  drawRight(`REF: ${data.userId}`, width - 42, height - 28, 7.5, fontRegular, textMuted);

  // 2. Header flow: Gym Logo + Titles
  let cursorY = height - 42;

  // Gym logo
  const logoPath = resolveAssetPath("logo.png");
  if (logoPath) {
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
    } catch {
      cursorY -= 20;
    }
  } else {
    cursorY -= 20;
  }

  drawCentered("CERTIFICATE", CONTENT_CENTER_X, cursorY - 30, 41, fontSerifBold, redCrimson);
  cursorY -= 33;

  drawCentered("Of Participation", CONTENT_CENTER_X, cursorY - 30, 22, fontSerifItalic, textBlack);
  cursorY -= 40;

  drawCentered("This certificate is proudly presented to", CONTENT_CENTER_X, cursorY - 20, 12, fontRegular, textDark);
  cursorY -= 48;

  // 3. Recipient name
  const safeName = sanitizePdfText(data.userName) || data.userId;
  drawCentered(safeName, CONTENT_CENTER_X, cursorY - 30, 46, fontSerifItalic, redCrimson);
  cursorY -= 14;

  const underlineW = 380;
  page.drawLine({
    start: { x: CONTENT_CENTER_X - underlineW / 2, y: cursorY - 30 },
    end: { x: CONTENT_CENTER_X + underlineW / 2, y: cursorY - 30 },
    thickness: 1.25,
    color: goldLine,
  });
  cursorY -= 44;

  // 4. Citation paragraph
  const kgLostDisplay = `${Math.abs(Number(data.kgLost)).toFixed(3)} kg`;
  const safeBranch = sanitizePdfText(data.branchName) || "Face Off Fitness";
  const paragraph =
    `has successfully completed the Club Weight Loss Challenge at ${safeBranch}, ` +
    `achieving a verified total weight loss of ${kgLostDisplay} - from ${Number(data.day1WeightKg).toFixed(3)} kg ` +
    `on ${formatDubai(data.day1Date, "DD MMM YYYY")} to ${Number(data.finalWeightKg).toFixed(3)} kg on ${formatDubai(
      data.finalDate,
      "DD MMM YYYY"
    )}.`;
  const paraLines = wrapPdfText(paragraph, fontSerifItalic, 12.5, 480);
  for (const line of paraLines) {
    drawCentered(line, CONTENT_CENTER_X, cursorY - 20, 12.5, fontSerifItalic, textDark);
    cursorY -= 20;
  }

  // 5. Verification / Signatories
  const lineY = 100;
  const colHalfW = 68;
  const leftColX = 300;
  const rightColX = 596;

  // Official Stamp (Top of Right Signatory) - Uses the luxury certificate stamp
  const certStampPath = resolveAssetPath("certificate-stamp.png") || resolveAssetPath("stamp.png");
  if (certStampPath) {
    try {
      const stampBytes = fs.readFileSync(certStampPath);
      const stampImage = await pdfDoc.embedPng(stampBytes);
      const stampW = 160;
      const stampH = (stampW / stampImage.width) * stampImage.height;

      const centerX = rightColX;
      const centerY = lineY + 6 + stampH / 2;

      page.drawImage(stampImage, {
        x: centerX - stampW / 2,
        y: centerY - stampH / 2,
        width: stampW,
        height: stampH,
      });
    } catch (err) {
      console.error("Failed to embed certificate stamp:", err);
    }
  }

  drawCentered(formatDubai(new Date(), "DD MMM YYYY"), leftColX, lineY + 10, 10.5, fontBold, textDark);
  page.drawLine({
    start: { x: leftColX - colHalfW, y: lineY },
    end: { x: leftColX + colHalfW, y: lineY },
    thickness: 0.5,
    color: textDark,
  });
  drawCentered("Date", leftColX, lineY - 16, 10.5, fontBold, textDark);

  page.drawLine({
    start: { x: rightColX - colHalfW, y: lineY },
    end: { x: rightColX + colHalfW, y: lineY },
    thickness: 0.5,
    color: textDark,
  });
  drawCentered("Authorized club signature", rightColX, lineY - 16, 9.5, fontBold, textDark);

  drawCentered(
    "WEIGHT LOSS CHALLENGE - DUBAI, UAE - CONFIDENTIAL & VERIFIED",
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
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const marginX = 40;
  const contentWidth = PAGE_W - marginX * 2;

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const cRed = rgb(0.83, 0.11, 0.14);
  const cDark = rgb(0.12, 0.12, 0.12);
  const cGray = rgb(0.4, 0.4, 0.4);
  const cLightGray = rgb(0.9, 0.9, 0.9);
  const cBoxBg = rgb(0.97, 0.97, 0.97);

  // Helper for multi-line text wrapping with sanitization
  const wrapParagraph = (text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] => {
    const lines: string[] = [];
    const cleanText = sanitizePdfText(text);
    const rawParagraphs = cleanText.split("\n");
    for (const rawP of rawParagraphs) {
      if (!rawP.trim()) {
        lines.push("");
        continue;
      }
      const words = rawP.split(/\s+/);
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = safeWidthOfTextAtSize(font, testLine, fontSize);
        if (testWidth > maxWidth && currentLine) {
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

  const rawRules = (data.rulesText && data.rulesText.trim()) || defaultRules;
  const rawTerms = (data.termsText && data.termsText.trim()) || defaultTerms;

  const rulesText = sanitizePdfText(rawRules);
  const termsText = sanitizePdfText(rawTerms);

  // Embed logo once
  const logoPath = resolveAssetPath("logo.png");
  let logoImage: any = null;
  let logoDrawW = 105;
  let logoDrawH = 30;
  if (logoPath) {
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
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 6,
      width: PAGE_W,
      height: 6,
      color: cRed,
    });

    if (pageNum === 1) {
      const titleText = data.day1WeightKg ? "DAY-1 CHALLENGE AGREEMENT & RULES" : "TERMS & CONDITIONS & OFFICIAL RULES";
      const titleW = safeWidthOfTextAtSize(fontBold, titleText, 12);
      safeDrawText(page, titleText, {
        x: PAGE_W - marginX - titleW,
        y: y - 10,
        size: 12,
        font: fontBold,
        color: cDark,
      });

      const subTitle = "Face Off Fitness - 30-Day Weight Loss Challenge";
      const subTitleW = safeWidthOfTextAtSize(fontRegular, subTitle, 8.5);
      safeDrawText(page, subTitle, {
        x: PAGE_W - marginX - subTitleW,
        y: y - 22,
        size: 8.5,
        font: fontRegular,
        color: cRed,
      });

      const dateStr = data.day1Date ? formatDubai(data.day1Date, "DD MMM YYYY") : formatDubai(new Date(), "DD MMM YYYY");
      const refText = `User ID: ${sanitizePdfText(data.userId)} - Date: ${dateStr}`;
      const refW = safeWidthOfTextAtSize(fontRegular, refText, 8);
      safeDrawText(page, refText, {
        x: PAGE_W - marginX - refW,
        y: y - 33,
        size: 8,
        font: fontRegular,
        color: cGray,
      });
    } else {
      safeDrawText(page, "TERMS & CONDITIONS & OFFICIAL RULES (CONTINUED)", {
        x: marginX,
        y: PAGE_H - 26,
        size: 9.5,
        font: fontBold,
        color: cDark,
      });
      const pageInfo = `User ID: ${sanitizePdfText(data.userId)} - Page ${pageNum}`;
      const pageInfoW = safeWidthOfTextAtSize(fontRegular, pageInfo, 8);
      safeDrawText(page, pageInfo, {
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
    safeDrawText(page, "FACE OFF FITNESS", { x: marginX, y: y - 16, size: 14, font: fontBold, color: cRed });
  }

  drawPageHeader(1);
  y -= 48;

  page.drawLine({
    start: { x: marginX, y },
    end: { x: PAGE_W - marginX, y },
    thickness: 1,
    color: cLightGray,
  });

  y -= 12;

  // 1. Participant & Day-1 Details Summary Box
  const safeUserName = sanitizePdfText(data.userName) || data.userId || "Participant";
  const safeBranchName = sanitizePdfText(data.branchName) || "Face Off Fitness";
  const safeEmiratesId = sanitizePdfText(data.emiratesId) || "Verified ID";
  const safeMobile = sanitizePdfText(data.mobile) || "-";
  const safeEmail = sanitizePdfText(data.email) || "-";
  const safeStaffDisplay = sanitizePdfText(data.staffName) || (data.day1WeightKg ? "Authorized Staff" : "Online Registration");

  // Calculate Second Weigh-In date (Day 30) and Final Window (Day 30 & Day 31)
  const hasWeight = data.day1WeightKg !== undefined && data.day1WeightKg !== null && !isNaN(Number(data.day1WeightKg));
  const startingWeightText = hasWeight ? `${Number(data.day1WeightKg).toFixed(3)} kg` : "Pending (Day-1 Visit)";
  const day1DateDisplay = data.day1Date ? formatDubai(data.day1Date, "DD MMM YYYY") : "Pending Day-1 Visit";

  let secondWeighInText = "After 30th Day";
  let finalWindowDisplay = data.deadlineDate ? formatDubai(data.deadlineDate, "DD MMM YYYY") : "30 Days from Day-1";

  if (data.day1Date) {
    const d1 = dayjs(data.day1Date).tz(DUBAI_TZ);
    const day30Formatted = d1.add(29, "day").format("DD MMM YYYY");
    const day31Formatted = data.deadlineDate ? formatDubai(data.deadlineDate, "DD MMM YYYY") : d1.add(30, "day").format("DD MMM YYYY");
    secondWeighInText = `After 30th Day (${day30Formatted})`;
    finalWindowDisplay = `${day30Formatted} - ${day31Formatted} (Final Window)`;
  }

  const col1X = marginX + 12;
  const col2X = marginX + 175;
  const col3X = marginX + 345;
  const usableValWidth = contentWidth - 24 - 82;

  // Pre-wrap name and club to full width
  const nameLines = wrapPdfText(safeUserName, fontBold, 7.5, usableValWidth);
  const branchLines = wrapPdfText(safeBranchName, fontBold, 7.5, usableValWidth);

  const nameLinesCount = Math.max(1, nameLines.length);
  const branchLinesCount = Math.max(1, branchLines.length);
  const lineHeight = 13.5;
  const boxHeight = 16 + (nameLinesCount + branchLinesCount + 3) * lineHeight;

  page.drawRectangle({
    x: marginX,
    y: y - boxHeight,
    width: contentWidth,
    height: boxHeight,
    color: cBoxBg,
    borderColor: cLightGray,
    borderWidth: 1,
  });

  let curY = y - 14;

  // 1. Participant Name (Full Width with Text Wrap)
  safeDrawText(page, "Participant Name:", { x: col1X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  for (let i = 0; i < nameLinesCount; i++) {
    safeDrawText(page, nameLines[i], { x: col1X + 82, y: curY, size: 7.5, font: fontBold, color: cDark });
    if (i < nameLinesCount - 1) curY -= lineHeight;
  }
  curY -= lineHeight;

  // 2. Registered Club (Full Width with Text Wrap)
  safeDrawText(page, "Registered Club:", { x: col1X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  for (let i = 0; i < branchLinesCount; i++) {
    safeDrawText(page, branchLines[i], { x: col1X + 82, y: curY, size: 7.5, font: fontBold, color: cDark });
    if (i < branchLinesCount - 1) curY -= lineHeight;
  }
  curY -= lineHeight;

  // 3. Identification & Contact Row (3 Columns)
  safeDrawText(page, "Emirates ID:", { x: col1X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  safeDrawText(page, safeEmiratesId, { x: col1X + 54, y: curY, size: 7.5, font: fontBold, color: cDark });

  safeDrawText(page, "Mobile / Phone:", { x: col2X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  safeDrawText(page, safeMobile, { x: col2X + 68, y: curY, size: 7.5, font: fontRegular, color: cDark });

  safeDrawText(page, "Email Address:", { x: col3X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  safeDrawText(page, safeEmail, { x: col3X + 62, y: curY, size: 7.5, font: fontRegular, color: cDark });
  curY -= lineHeight;

  // 4. Starting Weight & Staff Details (Starting weight in black color)
  safeDrawText(page, "Starting Weight:", { x: col1X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  safeDrawText(page, startingWeightText, { x: col1X + 68, y: curY, size: 7.5, font: fontBold, color: cDark });

  safeDrawText(page, "Day-1 Date:", { x: col2X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  safeDrawText(page, day1DateDisplay, { x: col2X + 54, y: curY, size: 7.5, font: fontBold, color: cDark });

  safeDrawText(page, "Logged By Staff:", { x: col3X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  safeDrawText(page, safeStaffDisplay, { x: col3X + 68, y: curY, size: 7.5, font: fontRegular, color: cDark });
  curY -= lineHeight + 2;

  // Divider line before final return window
  page.drawLine({
    start: { x: col1X, y: curY + 9 },
    end: { x: PAGE_W - marginX - 12, y: curY + 9 },
    thickness: 0.5,
    color: cLightGray,
  });

  // 5. Second Weigh-In (After 30th Day) & Final Window (Red Color)
  safeDrawText(page, "Second Weigh-In:", { x: col1X, y: curY, size: 7.5, font: fontRegular, color: cGray });
  safeDrawText(page, secondWeighInText, { x: col1X + 78, y: curY, size: 7.5, font: fontBold, color: cDark });

  safeDrawText(page, "Final Window:", { x: col2X + 45, y: curY, size: 7.5, font: fontRegular, color: cGray });
  safeDrawText(page, finalWindowDisplay, { x: col2X + 104, y: curY, size: 7.5, font: fontBold, color: cRed });

  y -= boxHeight + 14;

  // 2. Terms & Conditions Content
  safeDrawText(page, "CHALLENGE AGREEMENT, RULES & TERMS AND CONDITIONS", {
    x: marginX,
    y,
    size: 8.5,
    font: fontBold,
    color: cRed,
  });
  y -= 11;

  const combinedAgreementText = termsText || rulesText;
  const agreementLines = wrapParagraph(combinedAgreementText, contentWidth, 7, fontRegular);

  for (const line of agreementLines) {
    if (line === "") {
      y -= 3;
      continue;
    }

    if (y < 155) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      drawPageHeader(pdfDoc.getPageCount());
      y = PAGE_H - 50;

      safeDrawText(page, "CHALLENGE AGREEMENT & TERMS AND CONDITIONS (CONTINUED)", {
        x: marginX,
        y,
        size: 8.5,
        font: fontBold,
        color: cRed,
      });
      y -= 12;
    }

    safeDrawText(page, line, {
      x: marginX,
      y,
      size: 7,
      font: fontRegular,
      color: cDark,
    });
    y -= 10;
  }

  // Additional rules section if distinct
  if (rulesText && termsText && rulesText.trim() !== termsText.trim()) {
    y -= 6;
    if (y < 155) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      drawPageHeader(pdfDoc.getPageCount());
      y = PAGE_H - 50;
    }

    safeDrawText(page, "ADDITIONAL CHALLENGE RULES", {
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
      safeDrawText(page, line, {
        x: marginX,
        y,
        size: 7,
        font: fontRegular,
        color: cDark,
      });
      y -= 10;
    }
  }

  // Ensure signatures fit on current page or add new page
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

  safeDrawText(page, "PARTICIPANT DIGITAL SIGNATURE & CONSENT", {
    x: leftSigX,
    y: sigSectionY,
    size: 7.5,
    font: fontBold,
    color: cDark,
  });

  // Embed Customer Digital Signature Image
  let embeddedSig = false;
  if (data.signatureDataUrl && typeof data.signatureDataUrl === "string" && data.signatureDataUrl.trim().length > 0) {
    try {
      let sigBytes: Buffer | null = null;
      let isPng = true;

      if (data.signatureDataUrl.startsWith("data:image/")) {
        const base64Data = data.signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
        sigBytes = Buffer.from(base64Data, "base64");
        isPng = !data.signatureDataUrl.includes("image/jpeg") && !data.signatureDataUrl.includes("image/jpg");
      } else {
        // Resolve from filesystem
        const rawPath = data.signatureDataUrl.trim().replace(/^[/\\]+/, "");
        const cand = resolveAssetPath(rawPath.replace(/^public[/\\]/, ""));
        if (cand && fs.existsSync(cand)) {
          sigBytes = fs.readFileSync(cand);
          isPng = !cand.toLowerCase().endsWith(".jpg") && !cand.toLowerCase().endsWith(".jpeg");
        } else {
          // Fallback direct check (checks storage/ and public/)
          const fallbackCandidates = [
            path.join(process.cwd(), "storage", rawPath),
            path.join(process.cwd(), "public", rawPath),
            path.join(process.cwd(), rawPath),
            rawPath,
          ];
          for (const fc of fallbackCandidates) {
            if (fs.existsSync(fc)) {
              sigBytes = fs.readFileSync(fc);
              isPng = !fc.toLowerCase().endsWith(".jpg") && !fc.toLowerCase().endsWith(".jpeg");
              break;
            }
          }
        }
      }

      if (sigBytes && sigBytes.length > 0) {
        let sigImage: any = null;
        try {
          sigImage = isPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
        } catch {
          try {
            sigImage = isPng ? await pdfDoc.embedJpg(sigBytes) : await pdfDoc.embedPng(sigBytes);
          } catch (embedFallbackErr) {
            console.error("Signature image embed fallback failed:", embedFallbackErr);
          }
        }

        if (sigImage) {
          const targetW = 140;
          const targetH = Math.min(46, (targetW / sigImage.width) * sigImage.height);

          page.drawImage(sigImage, {
            x: leftSigX,
            y: sigSectionY - 50,
            width: targetW,
            height: targetH,
          });
          embeddedSig = true;
        }
      }
    } catch (sigErr) {
      console.error("Could not embed participant signature in Terms PDF:", sigErr);
    }
  }

  if (!embeddedSig) {
    safeDrawText(page, "(Digitally Signed on Day-1 Weigh-In)", {
      x: leftSigX,
      y: sigSectionY - 32,
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

  safeDrawText(page, `${safeUserName} (Participant)`, {
    x: leftSigX,
    y: sigSectionY - 64,
    size: 7,
    font: fontBold,
    color: cDark,
  });

  const signedDateText = data.day1Date ? formatDubai(data.day1Date, "DD MMM YYYY, hh:mm A") : formatDubai(new Date(), "DD MMM YYYY, hh:mm A");
  safeDrawText(page, `Date Signed: ${signedDateText}`, {
    x: leftSigX,
    y: sigSectionY - 74,
    size: 6.5,
    font: fontRegular,
    color: cGray,
  });

  // Right Side: Authorized Club Verification & Stamp (Uses the original stamp)
  safeDrawText(page, "AUTHORIZED CLUB VERIFICATION & STAMP", {
    x: rightSigX,
    y: sigSectionY,
    size: 7.5,
    font: fontBold,
    color: cDark,
  });

  const stampPath = resolveAssetPath("stamp.png");
  if (stampPath) {
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
    } catch {}
  }

  page.drawLine({
    start: { x: rightSigX, y: sigSectionY - 52 },
    end: { x: rightSigX + sigColW, y: sigSectionY - 52 },
    thickness: 0.75,
    color: cDark,
  });

  safeDrawText(page, `Face Off Fitness - ${safeBranchName}`, {
    x: rightSigX,
    y: sigSectionY - 64,
    size: 7,
    font: fontBold,
    color: cDark,
  });

  safeDrawText(page, `Verified by: ${safeStaffDisplay}`, {
    x: rightSigX,
    y: sigSectionY - 74,
    size: 6.5,
    font: fontRegular,
    color: cGray,
  });

  // Footer Disclaimer on each page
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    safeDrawText(
      pages[i],
      `WEIGHT LOSS CHALLENGE - OFFICIAL LEGAL AGREEMENT - FACE OFF FITNESS DUBAI, UAE - PAGE ${i + 1} OF ${pages.length}`,
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