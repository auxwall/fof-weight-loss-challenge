import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { formatDubai } from "./dayjs";
import prisma from "./prisma";

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

const FROM_HEADER = process.env.SMTP_FROM || "Gym Weight Loss Challenge <noreply@gymchallenge.ae>";
const COMPANY_CERTIFICATE_EMAIL = process.env.COMPANY_CERTIFICATE_EMAIL;

/**
 * EMAIL #1: Public Registration Confirmation with inline QR code & User ID
 */
export async function sendRegistrationEmail(params: {
  email: string;
  name: string;
  userId: string;
  branchName: string;
  qrBuffer: Buffer;
}): Promise<{ success: boolean; mocked?: boolean }> {
  const { email, name, userId, branchName, qrBuffer } = params;
  const transporter = createTransporter();
  const logoAttachment = getLogoAttachment();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gym Weight Loss Challenge</title>
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
                  GYM WEIGHT LOSS CHALLENGE
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
                  You have successfully registered. Present this official QR Pass when you visit the gym:
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
                        <strong style="color: #FFFFFF;">2. Visit Any Branch:</strong> Walk into any of our 4 branches: <strong>Al Rashidiya, Al Barsha, Abu Hail, or Al Nahda</strong>.
                      </div>
                      <div style="margin-bottom: 10px;">
                        <strong style="color: #FFFFFF;">3. Log Day-1 Starting Weight:</strong> Show this QR code to our team. They will log your official starting weight.
                      </div>
                      <div style="margin-bottom: 10px;">
                        <strong style="color: #FFFFFF;">4. 30-Day Clock Starts:</strong> Your official challenge clock begins on the exact date Day-1 is logged. Complete your final weigh-in within 30 days.
                      </div>
                      <div>
                        <strong style="color: #FFFFFF;">5. Win Big:</strong> Top 3 participants with the highest absolute weight lost win <strong>15,000 AED</strong> (1st), <strong>5,000 AED</strong> (2nd), and <strong>3,000 AED</strong> (3rd)!
                      </div>
                    </td>
                  </tr>
                </table>

                <p style="color: #9CA3AF !important; font-size: 12px; margin: 0;">
                  Registered Branch: <strong style="color: #FFFFFF;">${branchName}</strong> · (You may visit any branch)
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="font-size: 11px; color: #6B7280 !important; padding: 14px; background-color: #111111; border-top: 1px solid #222222; text-align: center;">
                Face off Fitness · Gym Weight Loss Challenge · Dubai, UAE
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

    await transporter.sendMail({
      from: FROM_HEADER,
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
}): Promise<{ success: boolean; mocked?: boolean }> {
  const { email, name, userId, weightKg, branchName, day1Date, deadlineDate } = params;
  const transporter = createTransporter();
  const logoAttachment = getLogoAttachment();

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
                  GYM WEIGHT LOSS CHALLENGE
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
                      <div style="font-size: 28px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px;">${weightKg.toFixed(1)} kg</div>
                      <div style="font-size: 12px; color: #6B7280 !important; margin-top: 6px;">Logged on: ${formatDubai(day1Date, "DD MMMM YYYY (hh:mm A)")}</div>
                    </td>
                  </tr>
                </table>

                <!-- DEADLINE CARD -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1A1A1A; border: 1px solid rgba(236, 28, 35, 0.4); border-radius: 10px; margin: 16px 0; text-align: center;">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <div style="font-size: 12px; color: #EC1C23 !important; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Final Weigh-In Deadline</div>
                      <div style="font-size: 20px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px;">
                        ${formatDubai(deadlineDate, "DD MMMM YYYY (hh:mm A)")}
                      </div>
                      <p style="font-size: 12px; color: #D1D5DB !important; margin: 8px 0 0 0; line-height: 1.5;">
                        ⚠️ You must return to any branch on or before Day 30 for your final weigh-in. Failure to return results in automatic disqualification.
                      </p>
                    </td>
                  </tr>
                </table>

                ${
                  effectiveRules
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
                  Registered Branch: <strong style="color: #FFFFFF;">${branchName}</strong> · (You are welcome to visit any branch for final weigh-in)
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="font-size: 11px; color: #6B7280 !important; padding: 14px; background-color: #111111; border-top: 1px solid #222222; text-align: center;">
                Face off Fitness · Gym Weight Loss Challenge · Dubai, UAE
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

    await transporter.sendMail({
      from: FROM_HEADER,
      to: email,
      subject: `⏱️ Day-1 Confirmed (${weightKg} kg) — Your 30-Day Challenge Clock Has Started!`,
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
  const kgLostText = `${kgLost > 0 ? "-" : ""}${Math.abs(kgLost).toFixed(1)} kg`;

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
                  GYM WEIGHT LOSS CHALLENGE
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
                  You have successfully completed your final weigh-in for the Gym Weight Loss Challenge.
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
                      <div style="font-size: 15px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px; white-space: nowrap;">${day1WeightKg.toFixed(1)}&nbsp;kg</div>
                    </td>
                    <td style="font-size: 14px; color: #6B7280 !important; padding: 14px 2px; vertical-align: middle;">→</td>
                    <td style="padding: 14px 4px; vertical-align: middle;">
                      <div style="font-size: 10px; color: #9CA3AF !important; text-transform: uppercase; font-weight: 600; white-space: nowrap;">Final Weigh-In</div>
                      <div style="font-size: 15px; font-weight: bold; color: #FFFFFF !important; margin-top: 4px; white-space: nowrap;">${finalWeightKg.toFixed(1)}&nbsp;kg</div>
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
                  Gym management will announce the 1st (15,000 AED), 2nd (5,000 AED), and 3rd (3,000 AED) winners on the official Finalize Date. Stay tuned!
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="font-size: 11px; color: #6B7280 !important; padding: 14px; background-color: #111111; border-top: 1px solid #222222; text-align: center;">
                Face off Fitness · Gym Weight Loss Challenge · Dubai, UAE
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

    await transporter.sendMail({
      from: FROM_HEADER,
      to: email,
      subject: `🏆 Challenge Complete! You lost ${kgLostText} — Official Weigh-In Summary`,
      html,
      attachments,
    });

    // Send copy of the signed PDF certificate to company email
    try {
      await transporter.sendMail({
        from: FROM_HEADER,
        to: COMPANY_CERTIFICATE_EMAIL,
        subject: `📄 Participant Certificate: ${name} (${userId}) — Lost ${kgLostText}`,
        text: `Official signed PDF certificate of completion for participant ${name} (ID: ${userId}).\n\nStarting Weight: ${day1WeightKg.toFixed(1)} kg\nFinal Weight: ${finalWeightKg.toFixed(1)} kg\nTotal Lost: ${kgLostText}\n\nThe signed PDF certificate is attached.`,
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

    return { success: true };
  } catch (error) {
    console.error("Failed to send final result email:", error);
    return { success: false };
  }
}
