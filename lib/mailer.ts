import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import dayjs, { formatDubai, DUBAI_TZ } from "./dayjs";
import prisma from "./prisma";
import { generateTermsAgreementPdf } from "./pdf";

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null; // Will fallback to dev console logging
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getLogoAttachment() {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  if (fs.existsSync(logoPath)) {
    return {
      filename: "logo.png",
      path: logoPath,
      cid: "gymlogo",
    };
  }
  return null;
}

export function getFromSender(): { name: string; address: string } {
  const defaultName = process.env.SMTP_FROM_NAME || "FACE OFF FITNESS | Weight Loss Challenge";
  const defaultAddress = process.env.SMTP_USER || "events@faceoffgym.com";

  const rawFrom = process.env.SMTP_FROM;
  if (!rawFrom) {
    return { name: defaultName, address: defaultAddress };
  }

  // Handle format: "Name" <email> or 'Name' <email> or Name <email>
  const match = rawFrom.match(/^(?:['"]?)(.*?)(?:['"]?)\s*<([^>]+)>/);
  if (match) {
    const cleanName = match[1].replace(/^["']|["']$/g, "").trim();
    const cleanAddress = match[2].trim();
    return {
      name: cleanName || defaultName,
      address: cleanAddress || defaultAddress,
    };
  }

  // If it's just an email address (e.g. SMTP_FROM="events@faceoffgym.com")
  if (rawFrom.includes("@")) {
    return {
      name: defaultName,
      address: rawFrom.replace(/['"]/g, "").trim(),
    };
  }

  return { name: defaultName, address: defaultAddress };
}

export const FROM_HEADER = `"${getFromSender().name}" <${getFromSender().address}>`;
const COMPANY_CERTIFICATE_EMAIL = process.env.COMPANY_CERTIFICATE_EMAIL;

/**
 * EMAIL #1: Public Registration Confirmation with inline QR code, User ID & Terms PDF
 */
export async function sendRegistrationEmail(params: {
  email: string;
  name: string;
  userId: string;
  branchName: string;
  qrBuffer: Buffer;
  pdfBytes?: Uint8Array | null;
  emiratesId?: string;
  mobile?: string;
}): Promise<{ success: boolean; mocked?: boolean }> {
  const { email, name, userId, branchName, qrBuffer } = params;
  const pdfBytes = params.pdfBytes || null;

  const transporter = createTransporter();
  const logoAttachment = getLogoAttachment();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Club Weight Loss Challenge</title>
      </head>
      <body style="margin: 0; padding: 24px 10px; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <center>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #141414; border: 1px solid #262626; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <!-- RED ACCENT BAR -->
            <tr>
              <td style="height: 6px; background-color: #EC1C23; font-size: 1px; line-height: 1px;">&nbsp;</td>
            </tr>

            <!-- HEADER -->
            <tr>
              <td align="center" style="padding: 26px 20px 16px 20px; text-align: center;">
                <div style="display: block; margin: 0 auto 12px auto;">
                  <img src="cid:gymlogo" alt="Face off Fitness" width="160" style="display: block; width: 160px; max-width: 160px; height: auto; margin: 0 auto; border: 0;" />
                </div>
                <h1 style="color: #FFFFFF !important; margin: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                  CLUB WEIGHT LOSS CHALLENGE
                </h1>
                <div style="color: #EC1C23 !important; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; margin-top: 4px; text-transform: uppercase;">
                  Official Challenge Pass
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td align="center" style="padding: 0 24px 24px 24px; text-align: center; color: #FFFFFF;">
                <h2 style="color: #FFFFFF !important; margin-top: 0; font-size: 22px; font-weight: 700;">
                  Welcome, <span style="color: #EC1C23 !important;">${name}</span>!
                </h2>
                <p style="color: #9CA3AF !important; font-size: 14px; line-height: 1.5; margin: 6px 0 18px 0;">
                  You have successfully registered. Present this official QR Pass when you visit the club:
                </p>

                <!-- QR CODE BOX (CENTERED TABLE) -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto; background-color: #FFFFFF; border-radius: 14px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
                  <tr>
                    <td align="center" style="padding: 0; margin: 0; line-height: 0;">
                      <img src="cid:qrcode" alt="Challenge QR Code" width="220" height="220" style="display: block; width: 220px; height: 220px; border: 0; margin: 0 auto;" />
                    </td>
                  </tr>
                </table>

                <!-- USER ID BADGE (CENTERED TABLE, SEPARATE ROW) -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 20px auto;">
                  <tr>
                    <td align="center" style="background-color: #1A1A1A; border: 1px dashed #EC1C23; padding: 10px 24px; border-radius: 8px; font-family: monospace, Courier, sans-serif; font-size: 15px; font-weight: bold; color: #EC1C23 !important; letter-spacing: 2px;">
                      USER ID: ${userId}
                    </td>
                  </tr>
                </table>

                <!-- NEXT STEPS CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1C1C1C; border-radius: 10px; border: 1px solid #262626; text-align: left; margin: 16px 0 20px 0;">
                  <tr>
                    <td style="padding: 20px; color: #D1D5DB; font-size: 13px; line-height: 1.6;">
                      <strong style="color: #EC1C23 !important; font-size: 14px; display: block; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        WHAT HAPPENS NEXT?
                      </strong>
                      <div style="margin-bottom: 10px;">
                        <strong style="color: #FFFFFF;">1. Save Your Pass:</strong> Keep this email or screenshot your <strong>QR Code</strong> and <strong>User ID (${userId})</strong> on your phone.
                      </div>
                      <div style="margin-bottom: 10px;">

                        <strong style="color: #FFFFFF;">2. Visit Any of our Clubs:</strong> Walk into any of our clubs across Dubai listed below to get started.
                      </div>
                      <div style="margin-bottom: 10px;">
                        <strong style="color: #FFFFFF;">3. Log Day-1 Starting Weight:</strong> Show this QR code to our team with your Emirates ID. They will log your official starting weight on or before 29th Oct 2026.
                      </div>
                      <div style="margin-bottom: 10px;">
                        <strong style="color: #FFFFFF;">4. 30-Day Clock Starts:</strong> Your official challenge clock begins on the exact date Day-1 is logged. Complete your final weigh-in within 30 days.
                      </div>
                      <div>
                        <strong style="color: #FFFFFF;">5. Win Big:</strong> 18,000 AED Cash Prize Pool! Top participants win <strong>10,000 AED</strong> (1st), <strong>5,000 AED</strong> (2nd), and <strong>3,000 AED</strong> (3rd)!
                      </div>
                    </td>
                  </tr>
                </table>

                ${pdfBytes
      ? `
                <!-- TERMS & CONDITIONS ATTACHMENT CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1A1A1A; border: 1px solid #262626; border-left: 4px solid #10B981; border-radius: 10px; margin: 16px 0 20px 0; text-align: left;">
                  <tr>
                    <td style="padding: 14px 18px;">
                      <div style="font-size: 12px; color: #10B981 !important; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                        📄 Official Terms &amp; Conditions Document Attached
                      </div>
                      <div style="font-size: 12px; color: #D1D5DB !important; line-height: 1.5;">
                        Your official copy of the Club Weight Loss Challenge Terms &amp; Conditions and Competition Rules is attached to this email as a PDF document for your records.
                      </div>
                    </td>
                  </tr>
                </table>
                `
      : ""
    }

                <!-- CLUB LOCATIONS -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; margin-bottom: 18px; overflow: hidden;">
                  <tr>
                    <td style="padding: 12px 16px; background-color: #222222; border-bottom: 1px solid #2e2e2e;">
                      <strong style="color: #FFFFFF; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">📍 Our 6 Club Locations & Google Maps Directions</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 14px 16px; font-size: 12px; color: #D1D5DB; line-height: 1.6;">
                      <!-- 1. Al Hamriya Mix Gym -->
                      <div style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #262626;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <strong style="color: #FFFFFF; font-size: 13px;">Al Hamriya, Deira, Dubai</strong>
                          <span style="font-size: 10px; background-color: #2a2a2a; color: #E5E7EB; padding: 2px 6px; border-radius: 4px; border: 1px solid #383838;">Mix Gym</span>
                        </div>
                        <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 6px;">Al Hamriya Club — Mix Gym (Deira, Dubai)</div>
                        <a href="https://maps.app.goo.gl/NWkFM5rwocyx4f2o8" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #D32F2F; color: #FFFFFF !important; text-decoration: none; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                          📍 View on Google Maps &rarr;
                        </a>
                      </div>

                      <!-- 2. Al Hamriya Ladies Gym -->
                      <div style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #262626;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <strong style="color: #FFFFFF; font-size: 13px;">Al Hamriya, Deira, Dubai</strong>
                          <span style="font-size: 10px; background-color: #831843; color: #F472B6; padding: 2px 6px; border-radius: 4px; border: 1px solid #9D174D;">Ladies Gym</span>
                        </div>
                        <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 6px;">Al Hamriya Club — Ladies Gym (Deira, Dubai)</div>
                        <a href="https://maps.app.goo.gl/NWkFM5rwocyx4f2o8" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #D32F2F; color: #FFFFFF !important; text-decoration: none; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                          📍 View on Google Maps &rarr;
                        </a>
                      </div>

                      <!-- 3. Al Rashidiya Mix Gym -->
                      <div style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #262626;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <strong style="color: #FFFFFF; font-size: 13px;">Al Rashidiya, Dubai</strong>
                          <span style="font-size: 10px; background-color: #2a2a2a; color: #E5E7EB; padding: 2px 6px; border-radius: 4px; border: 1px solid #383838;">Mix Gym</span>
                        </div>
                        <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 6px;">Al Rashidiya Club — Mix Gym (Dubai)</div>
                        <a href="https://maps.app.goo.gl/KTJzpYH4av3wR1fD9" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #D32F2F; color: #FFFFFF !important; text-decoration: none; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                          📍 View on Google Maps &rarr;
                        </a>
                      </div>

                      <!-- 4. Al Rashidiya Ladies Gym -->
                      <div style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #262626;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <strong style="color: #FFFFFF; font-size: 13px;">Al Rashidiya, Dubai</strong>
                          <span style="font-size: 10px; background-color: #831843; color: #F472B6; padding: 2px 6px; border-radius: 4px; border: 1px solid #9D174D;">Ladies Gym</span>
                        </div>
                        <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 6px;">Al Rashidiya Club — Ladies Gym (Dubai)</div>
                        <a href="https://maps.app.goo.gl/KTJzpYH4av3wR1fD9" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #D32F2F; color: #FFFFFF !important; text-decoration: none; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                          📍 View on Google Maps &rarr;
                        </a>
                      </div>

                      <!-- 5. Al Nahda 2 -->
                      <div style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #262626;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <strong style="color: #FFFFFF; font-size: 13px;">Al Nahda 2, Dubai</strong>
                          <span style="font-size: 10px; background-color: #2a2a2a; color: #E5E7EB; padding: 2px 6px; border-radius: 4px; border: 1px solid #383838;">Mix Gym</span>
                        </div>
                        <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 6px;">Al Nahda 2 Club — Mix Gym (Dubai)</div>
                        <a href="https://maps.app.goo.gl/cz3MVyfT9rPD7X3Z7" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #D32F2F; color: #FFFFFF !important; text-decoration: none; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                          📍 View on Google Maps &rarr;
                        </a>
                      </div>

                      <!-- 6. Al Barsha -->
                      <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                          <strong style="color: #FFFFFF; font-size: 13px;">Al Barsha, Tecom, Internet City</strong>
                          <span style="font-size: 10px; background-color: #2a2a2a; color: #E5E7EB; padding: 2px 6px; border-radius: 4px; border: 1px solid #383838;">Mix Gym</span>
                        </div>
                        <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 6px;">Al Barsha Club — Mix Gym (Tecom, Internet City)</div>
                        <a href="https://maps.app.goo.gl/hVBMS237U9fA1zsC6" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #D32F2F; color: #FFFFFF !important; text-decoration: none; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                          📍 View on Google Maps &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>
                </table>

                <p style="color: #9CA3AF !important; font-size: 12px; margin: 0;">
                  Registered Club: <strong style="color: #FFFFFF;">${branchName}</strong> · (You may visit any of our clubs)
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="font-size: 11px; color: #6B7280 !important; padding: 14px; background-color: #111111; border-top: 1px solid #222222; text-align: center;">
                Face off Fitness · Weight Loss Challenge · Dubai, UAE
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  `;

  if (!transporter) {
    return { success: true, mocked: true };
  }

  try {
    const attachments: any[] = [];
    if (logoAttachment) attachments.push(logoAttachment);
    attachments.push({
      filename: "qrcode.png",
      content: qrBuffer,
      cid: "qrcode",
    });

    if (pdfBytes) {
      attachments.push({
        filename: `TermsAndConditions-${userId}.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      });
    }

    const fromSender = getFromSender();
    await transporter.sendMail({
      from: fromSender,
      sender: fromSender.address,
      replyTo: fromSender.address,
      to: email,
      subject: `🏋️ Registration Confirmed! Your Challenge Pass & Next Steps — User ID: ${userId}`,
      html,
      attachments,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send registration email:", error);
    return { success: false };
  }
}

/**
 * EMAIL #2: Day-1 Weigh-in Confirmation with official return deadline
 */
export async function sendDay1Email(params: {
  email: string;
  name: string;
  userId: string;
  weightKg: number;
  branchName: string;
  day1Date: Date | string;
  deadlineDate: Date | string;
  rulesText?: string | null;
  pdfBytes?: Uint8Array | null;
  emiratesId?: string;
  mobile?: string;
  signatureDataUrl?: string | null;
  staffName?: string | null;
}): Promise<{ success: boolean; mocked?: boolean }> {
  const { email, name, userId, weightKg, branchName, day1Date, deadlineDate } = params;
  let pdfBytes = params.pdfBytes;

  if (!pdfBytes) {
    try {
      const [settings, userRecord] = await Promise.all([
        prisma.challengeSettings.findUnique({ where: { id: "singleton" } }),
        prisma.user.findUnique({
          where: { id: userId },
          include: { weighIns: { where: { type: "DAY_1" } } },
        }),
      ]);
      const day1WeighIn = userRecord?.weighIns[0];
      pdfBytes = await generateTermsAgreementPdf({
        userName: name,
        userId: userId,
        emiratesId: userRecord?.emiratesId || params.emiratesId || "Registered Participant",
        mobile: userRecord?.mobile || params.mobile || "",
        email: email,
        branchName: branchName,
        day1WeightKg: weightKg,
        day1Date: day1Date,
        deadlineDate: deadlineDate,
        signatureDataUrl: day1WeighIn?.signatureUrl || params.signatureDataUrl || null,
        staffName: params.staffName || "Authorized Club Staff",
        rulesText: settings?.rulesText,
        termsText: settings?.termsText,
      });
    } catch (day1PdfErr) {
      console.error("Auto-generation of Day-1 agreement PDF failed:", day1PdfErr);
    }
  }

  const transporter = createTransporter();
  const logoAttachment = getLogoAttachment();

  const day30DateFormatted = dayjs(day1Date).tz(DUBAI_TZ).add(29, "day").format("DD MMMM YYYY");
  const day31DateFormatted = formatDubai(deadlineDate, "DD MMMM YYYY");

  let effectiveRules = params.rulesText;
  if (effectiveRules === undefined) {
    try {
      const settings = await prisma.challengeSettings.findUnique({
        where: { id: "singleton" },
        select: { rulesText: true },
      });
      effectiveRules = settings?.rulesText || null;
    } catch (err) {
      console.error("Could not fetch challenge rules for Day-1 email:", err);
      effectiveRules = null;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Day-1 Confirmed</title>
      </head>
      <body style="margin: 0; padding: 24px 10px; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <center>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #141414; border: 1px solid #262626; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <!-- RED ACCENT BAR -->
            <tr>
              <td style="height: 6px; background-color: #EC1C23; font-size: 1px; line-height: 1px;">&nbsp;</td>
            </tr>

            <!-- HEADER -->
            <tr>
              <td align="center" style="padding: 26px 20px 16px 20px; text-align: center;">
                <div style="display: block; margin: 0 auto 12px auto;">
                  <img src="cid:gymlogo" alt="Face off Fitness" width="160" style="display: block; width: 160px; max-width: 160px; height: auto; margin: 0 auto; border: 0;" />
                </div>
                <h1 style="color: #FFFFFF !important; margin: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                  WEIGHT LOSS CHALLENGE
                </h1>
                <div style="color: #EC1C23 !important; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; margin-top: 4px; text-transform: uppercase;">
                  Challenge Clock Started · Day-1 Confirmed
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td align="center" style="padding: 0 24px 24px 24px; text-align: center; color: #FFFFFF;">
                <h2 style="color: #FFFFFF !important; margin-top: 0; font-size: 22px; font-weight: 700;">
                  Day-1 Confirmed, <span style="color: #EC1C23 !important;">${name}</span>!
                </h2>
                <p style="color: #9CA3AF !important; font-size: 14px; line-height: 1.5; margin: 6px 0 18px 0;">
                  Your Day-1 starting weight has been officially logged at <strong style="color: #FFFFFF;">${branchName}</strong>.
                </p>

                <!-- USER ID BADGE -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 18px auto;">
                  <tr>
                    <td align="center" style="background-color: #1A1A1A; border: 1px dashed #EC1C23; padding: 8px 22px; border-radius: 8px; font-family: monospace, Courier, sans-serif; font-size: 14px; font-weight: bold; color: #EC1C23 !important; letter-spacing: 2px;">
                      USER ID: ${userId}
                    </td>
                  </tr>
                </table>

                <!-- STARTING WEIGHT CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1C1C1C; border-left: 4px solid #EC1C23; border-top: 1px solid #262626; border-right: 1px solid #262626; border-bottom: 1px solid #262626; border-radius: 10px; margin: 16px 0; text-align: left;">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <div style="font-size: 12px; color: #9CA3AF !important; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Official Starting Weight</div>
                      <div style="font-size: 28px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px;">${Number(weightKg).toFixed(3)} kg</div>
                      <div style="font-size: 12px; color: #6B7280 !important; margin-top: 6px;">Logged on: ${formatDubai(day1Date, "DD MMMM YYYY (hh:mm A)")}</div>
                    </td>
                  </tr>
                </table>

                <!-- DEADLINE CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1A1A1A; border: 1px solid rgba(236, 28, 35, 0.4); border-radius: 10px; margin: 16px 0; text-align: center;">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <div style="font-size: 12px; color: #EC1C23 !important; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">30 Days clock ends on</div>
                      <div style="font-size: 20px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px;">
                        ${day30DateFormatted}
                      </div>
                      <p style="font-size: 12px; color: #D1D5DB !important; margin: 8px 0 0 0; line-height: 1.5;">
                        You must return to any of our club on  ${day30DateFormatted} /  ${day31DateFormatted} on or before 10:00 PM for your final weigh-in. Failure to return during this period will result in automatic disqualification.
                      </p>
                    </td>
                  </tr>
                </table>

                ${pdfBytes
      ? `
                <!-- SIGNED TERMS & CONDITIONS ATTACHMENT CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1A1A1A; border: 1px solid #262626; border-left: 4px solid #10B981; border-radius: 10px; margin: 16px 0; text-align: left;">
                  <tr>
                    <td style="padding: 14px 18px;">
                      <div style="font-size: 12px; color: #10B981 !important; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                        📄 Signed Terms & Conditions Agreement Attached
                      </div>
                      <div style="font-size: 12px; color: #D1D5DB !important; line-height: 1.5;">
                        Your official signed Challenge Terms & Conditions agreement is attached to this email as a PDF document for your records.
                      </div>
                    </td>
                  </tr>
                </table>
                `
      : ""
    }

                ${effectiveRules
      ? `
                <!-- OFFICIAL CHALLENGE RULES FROM DB -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #181818; border: 1px solid #2A2A2A; border-left: 4px solid #EC1C23; border-radius: 10px; margin: 16px 0; text-align: left;">
                  <tr>
                    <td style="padding: 16px 18px;">
                      <div style="font-size: 12px; color: #EC1C23 !important; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                        📋 Official Challenge Rules
                      </div>
                      <div style="font-size: 13px; color: #D1D5DB !important; line-height: 1.6; white-space: pre-line;">${effectiveRules}</div>
                    </td>
                  </tr>
                </table>
                `
      : ""
    }

                <p style="color: #9CA3AF !important; font-size: 12px; margin: 0;">
                  Registered Club: <strong style="color: #FFFFFF;">${branchName}</strong> · (You are welcome to visit any of our club for final weigh-in)
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="font-size: 11px; color: #6B7280 !important; padding: 14px; background-color: #111111; border-top: 1px solid #222222; text-align: center;">
                Face off Fitness · Club Weight Loss Challenge · Dubai, UAE
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  `;

  if (!transporter) {
    return { success: true, mocked: true };
  }

  try {
    const attachments: any[] = [];
    if (logoAttachment) attachments.push(logoAttachment);

    if (pdfBytes) {
      attachments.push({
        filename: `TermsAndConditions-Agreement-${userId}.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      });
    }

    const fromSender = getFromSender();
    await transporter.sendMail({
      from: fromSender,
      sender: fromSender.address,
      replyTo: fromSender.address,
      to: email,
      subject: `⏱️ Day-1 Confirmed (${Number(weightKg).toFixed(3)} kg) — Your 30-Day Challenge Clock Has Started!`,
      html,
      attachments,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send Day-1 email:", error);
    return { success: false };
  }
}

/**
 * EMAIL #3: Final Result Email with attached PDF Certificate
 */
export async function sendFinalResultEmail(params: {
  email: string;
  name: string;
  userId: string;
  day1WeightKg: number;
  finalWeightKg: number;
  kgLost: number;
  pdfBytes: Uint8Array;
}): Promise<{ success: boolean; mocked?: boolean }> {
  const { email, name, userId, day1WeightKg, finalWeightKg, kgLost, pdfBytes } = params;
  const transporter = createTransporter();
  const logoAttachment = getLogoAttachment();
  const kgLostText =
    kgLost > 0
      ? `-${Math.abs(kgLost).toFixed(3)} kg`
      : kgLost < 0
        ? `+${Math.abs(kgLost).toFixed(3)} kg`
        : "0.000 kg";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Challenge Completed</title>
      </head>
      <body style="margin: 0; padding: 24px 10px; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <center>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #141414; border: 1px solid #262626; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <!-- RED ACCENT BAR -->
            <tr>
              <td style="height: 6px; background-color: #EC1C23; font-size: 1px; line-height: 1px;">&nbsp;</td>
            </tr>

            <!-- HEADER -->
            <tr>
              <td align="center" style="padding: 26px 20px 16px 20px; text-align: center;">
                <div style="display: block; margin: 0 auto 12px auto;">
                  <img src="cid:gymlogo" alt="Face off Fitness" width="160" style="display: block; width: 160px; max-width: 160px; height: auto; margin: 0 auto; border: 0;" />
                </div>
                <h1 style="color: #FFFFFF !important; margin: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                  CLUB WEIGHT LOSS CHALLENGE
                </h1>
                <div style="color: #EC1C23 !important; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; margin-top: 4px; text-transform: uppercase;">
                  Challenge Completed · Official Final Summary
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td align="center" style="padding: 0 24px 24px 24px; text-align: center; color: #FFFFFF;">
                <h2 style="color: #FFFFFF !important; margin-top: 0; font-size: 22px; font-weight: 700;">
                  Congratulations, <span style="color: #EC1C23 !important;">${name}</span>!
                </h2>
                <p style="color: #9CA3AF !important; font-size: 12px; line-height: 1.5; margin: 6px 0 18px 0;">
                  You have successfully completed your final weigh-in for the Club Weight Loss Challenge.
                </p>

                <!-- USER ID BADGE -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 18px auto;">
                  <tr>
                    <td align="center" style="background-color: #1A1A1A; border: 1px dashed #EC1C23; padding: 8px 22px; border-radius: 8px; font-family: monospace, Courier, sans-serif; font-size: 14px; font-weight: bold; color: #EC1C23 !important; letter-spacing: 2px;">
                      USER ID: ${userId}
                    </td>
                  </tr>
                </table>

                <!-- RESULTS COMPARISON CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1C1C1C; border: 1px solid #262626; border-radius: 10px; margin: 16px 0; text-align: center;">
                  <tr>
                    <td style="padding: 14px 4px; vertical-align: middle;">
                      <div style="font-size: 10px; color: #9CA3AF !important; text-transform: uppercase; font-weight: 600; white-space: nowrap;">Day-1 Start</div>
                      <div style="font-size: 15px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px; white-space: nowrap;">${Number(day1WeightKg).toFixed(3)}&nbsp;kg</div>
                    </td>
                    <td style="font-size: 14px; color: #6B7280 !important; padding: 14px 2px; vertical-align: middle;">→</td>
                    <td style="padding: 14px 4px; vertical-align: middle;">
                      <div style="font-size: 10px; color: #9CA3AF !important; text-transform: uppercase; font-weight: 600; white-space: nowrap;">Final Weigh-In</div>
                      <div style="font-size: 15px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px; white-space: nowrap;">${Number(finalWeightKg).toFixed(3)}&nbsp;kg</div>
                    </td>
                    <td style="font-size: 14px; color: #6B7280 !important; padding: 14px 2px; vertical-align: middle;">=</td>
                    <td style="padding: 14px 4px; vertical-align: middle;">
                      <div style="font-size: 10px; color: #EC1C23 !important; font-weight: bold; text-transform: uppercase; white-space: nowrap;">Total Lost</div>
                      <div style="font-size: 15px; font-weight: bold; color: #EC1C23 !important; margin-top: 4px; white-space: nowrap;">${kgLostText.replace(" ", "&nbsp;")}</div>
                    </td>
                  </tr>
                </table>

                <!-- CERTIFICATE ATTACHMENT CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1A1A1A; border: 1px solid #262626; border-radius: 10px; margin: 16px 0 20px 0; text-align: center;">
                  <tr>
                    <td style="padding: 16px 20px; font-size: 13px; color: #E5E7EB !important; line-height: 1.5;">
                      📄 <strong style="color: #FFFFFF;">Official Summary Attached</strong><br>
                      <span style="color: #9CA3AF;">Your signed Certificate of Completion is attached to this email as a PDF.</span>
                    </td>
                  </tr>
                </table>

                <p style="color: #9CA3AF !important; font-size: 12px; margin: 0; line-height: 1.5;">
                  Club management will announce the winners: 1st (10,000 AED), 2nd (5,000 AED), and 3rd (3,000 AED) on the official Finalize Date. Stay tuned!
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="font-size: 11px; color: #6B7280 !important; padding: 14px; background-color: #111111; border-top: 1px solid #222222; text-align: center;">
                Face off Fitness · Club Weight Loss Challenge · Dubai, UAE
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  `;

  if (!transporter) {
    return { success: true, mocked: true };
  }

  try {
    const attachments: any[] = [];
    if (logoAttachment) attachments.push(logoAttachment);
    attachments.push({
      filename: `WeightLossChallenge-${userId}.pdf`,
      content: Buffer.from(pdfBytes),
      contentType: "application/pdf",
    });

    const fromSender = getFromSender();
    await transporter.sendMail({
      from: fromSender,
      sender: fromSender.address,
      replyTo: fromSender.address,
      to: email,
      subject: `🏆 Challenge Complete! You lost ${kgLostText} — Official Weigh-In Summary`,
      html,
      attachments,
    });

    // Send copy of the signed PDF certificate to company email
    if (COMPANY_CERTIFICATE_EMAIL) {
      try {
        await transporter.sendMail({
          from: fromSender,
          sender: fromSender.address,
          replyTo: fromSender.address,
          to: COMPANY_CERTIFICATE_EMAIL,
          subject: `📄 Participant Certificate: ${name} (${userId}) — Lost ${kgLostText}`,
          text: `Official signed PDF certificate of completion for participant ${name} (ID: ${userId}).\n\nStarting Weight: ${Number(day1WeightKg).toFixed(3)} kg\nFinal Weight: ${Number(finalWeightKg).toFixed(3)} kg\nTotal Lost: ${kgLostText}\n\nThe signed PDF certificate is attached.`,
          attachments: [
            {
              filename: `WeightLossChallenge-${userId}.pdf`,
              content: Buffer.from(pdfBytes),
              contentType: "application/pdf",
            },
          ],
        });
      } catch (companyMailErr) {
        console.error("Failed to send certificate to company email:", companyMailErr);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send final result email:", error);
    return { success: false };
  }
}

/**
 * EMAIL #4: Day 28 Reminder Email (Sent 2 days before Day 30 Final Weigh-In)
 */
export async function sendReminderEmail(params: {
  email: string;
  name: string;
  userId: string;
  branchName: string;
  day1WeightKg: number;
  day1Date: Date | string;
  day30Date: Date | string;
  day31Date: Date | string;
  reminderType?: "DAY_28" | "SAME_DAY";
}): Promise<{ success: boolean; mocked?: boolean }> {
  const { email, name, userId, day1WeightKg, day1Date, day30Date, day31Date, reminderType = "DAY_28" } = params;
  const transporter = createTransporter();
  const logoAttachment = getLogoAttachment();

  const isSameDay = reminderType === "SAME_DAY";
  const day30DateFormatted = formatDubai(day30Date, "DD MMMM YYYY");
  const day31DateFormatted = formatDubai(day31Date, "DD MMMM YYYY");
  const day1DateFormatted = formatDubai(day1Date, "DD MMMM YYYY");

  const badgeText = isSameDay ? "Final Weigh-In Open Today! (Day 30)" : "Final Weigh-In Reminder (2 Days Left)";
  const headline = isSameDay
    ? `Today is the Day, <span style="color: #EC1C23 !important;">${name}</span>!`
    : `Almost at the Finish Line, <span style="color: #EC1C23 !important;">${name}</span>!`;
  const introText = isSameDay
    ? `Today is <strong style="color: #FFFFFF;">Day 30</strong> of your 30-day challenge! Your official Final Weigh-In window is <strong style="color: #EC1C23;">OPEN TODAY</strong>. Visit any of our clubs today to record your final weight and claim your Certificate of Completion.`
    : `This is a friendly reminder that you are on <strong style="color: #FFFFFF;">Day 28</strong> of your 30-day challenge. Your official Final Weigh-In window opens in exactly <strong style="color: #EC1C23;">2 days</strong> on ${day30DateFormatted}!`;

  const subject = isSameDay
    ? `🔥 TODAY IS DAY 30: Complete Your Final Weigh-In Today! — Face Off Fitness`
    : `⏰ Reminder: Your Final Weigh-In (Day 30) is in 2 Days! — Face Off Fitness`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isSameDay ? "Final Weigh-In Today" : "Final Weigh-In Reminder"}</title>
      </head>
      <body style="margin: 0; padding: 24px 10px; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <center>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #141414; border: 1px solid #262626; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <!-- RED ACCENT BAR -->
            <tr>
              <td style="height: 6px; background-color: #EC1C23; font-size: 1px; line-height: 1px;">&nbsp;</td>
            </tr>

            <!-- HEADER -->
            <tr>
              <td align="center" style="padding: 26px 20px 16px 20px; text-align: center;">
                <div style="display: block; margin: 0 auto 12px auto;">
                  <img src="cid:gymlogo" alt="Face off Fitness" width="160" style="display: block; width: 160px; max-width: 160px; height: auto; margin: 0 auto; border: 0;" />
                </div>
                <h1 style="color: #FFFFFF !important; margin: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                  WEIGHT LOSS CHALLENGE
                </h1>
                <div style="color: #EC1C23 !important; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; margin-top: 4px; text-transform: uppercase;">
                  ${badgeText}
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td align="center" style="padding: 0 24px 24px 24px; text-align: center; color: #FFFFFF;">
                <h2 style="color: #FFFFFF !important; margin-top: 0; font-size: 22px; font-weight: 700;">
                  ${headline}
                </h2>
                <p style="color: #9CA3AF !important; font-size: 14px; line-height: 1.5; margin: 6px 0 18px 0;">
                  ${introText}
                </p>

                <!-- USER ID BADGE -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 18px auto;">
                  <tr>
                    <td align="center" style="background-color: #1A1A1A; border: 1px dashed #EC1C23; padding: 8px 22px; border-radius: 8px; font-family: monospace, Courier, sans-serif; font-size: 14px; font-weight: bold; color: #EC1C23 !important; letter-spacing: 2px;">
                      USER ID: ${userId}
                    </td>
                  </tr>
                </table>

                <!-- FINAL WEIGH-IN TARGET CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1C1C1C; border-left: 4px solid #EC1C23; border-top: 1px solid #262626; border-right: 1px solid #262626; border-bottom: 1px solid #262626; border-radius: 10px; margin: 16px 0; text-align: left;">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <div style="font-size: 12px; color: #EC1C23 !important; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">
                        ${isSameDay ? "Official Final Weigh-In Window (OPEN TODAY)" : "Target Final Weigh-In Date (Day 30)"}
                      </div>
                      <div style="font-size: 24px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px;">
                        ${day30DateFormatted}
                      </div>
                      <div style="font-size: 12px; color: #9CA3AF !important; margin-top: 6px; line-height: 1.5;">
                        ${isSameDay ? "Please visit any Face Off Fitness club before 10:00 PM today." : `Your final weigh-in window is open on Day 30 (${day30DateFormatted}).`}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- STARTING WEIGHT REFERENCE -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1A1A1A; border: 1px solid #262626; border-radius: 10px; margin: 16px 0; text-align: left;">
                  <tr>
                    <td style="padding: 14px 18px;">
                      <div style="font-size: 11px; color: #9CA3AF !important; text-transform: uppercase; letter-spacing: 0.5px;">Starting Weight Recorded</div>
                      <div style="font-size: 18px; font-weight: bold; color: #FFFFFF !important; margin-top: 2px;">
                        ${Number(day1WeightKg).toFixed(3)} kg <span style="font-size: 12px; font-weight: normal; color: #6B7280 !important;">on ${day1DateFormatted}</span>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- INSTRUCTIONS CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #181818; border: 1px solid #2A2A2A; border-radius: 10px; margin: 16px 0 20px 0; text-align: left;">
                  <tr>
                    <td style="padding: 16px 18px;">
                      <div style="font-size: 12px; color: #FFFFFF !important; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        📍 What You Need To Do:
                      </div>
                      <div style="font-size: 13px; color: #D1D5DB !important; line-height: 1.6;">
                        1. Visit any Face Off Fitness club across Dubai.<br>
                        2. Present your User ID (<strong>${userId}</strong>) or QR Pass to our front desk staff.<br>
                        3. Step onto the official scale for your verified final weigh-in & certificate!
                      </div>
                    </td>
                  </tr>
                </table>

                <p style="color: #EF4444 !important; font-size: 12px; margin: 0; line-height: 1.5; font-weight: 500;">
                  ⚠️ Please remember: Participants who do not complete their final weigh-in on or before ${day31DateFormatted} will be automatically disqualified from the challenge.
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="font-size: 11px; color: #6B7280 !important; padding: 14px; background-color: #111111; border-top: 1px solid #222222; text-align: center;">
                Face off Fitness · Club Weight Loss Challenge · Dubai, UAE
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  `;

  if (!transporter) {
    return { success: true, mocked: true };
  }

  try {
    const attachments: any[] = [];
    if (logoAttachment) attachments.push(logoAttachment);

    const fromSender = getFromSender();
    await transporter.sendMail({
      from: fromSender,
      sender: fromSender.address,
      replyTo: fromSender.address,
      to: email,
      subject,
      html,
      attachments,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send Reminder email:", error);
    return { success: false };
  }
}

