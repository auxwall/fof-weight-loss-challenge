import QRCode from "qrcode";

/**
 * Generates a Data URL (image/png base64) of the QR code for a given User ID.
 */
export async function generateQrDataUrl(userId: string): Promise<string> {
  return QRCode.toDataURL(userId, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
    color: {
      dark: "#0A0A0A",
      light: "#FFFFFF",
    },
  });
}

/**
 * Generates a PNG Buffer of the QR code for email inline attachment.
 */
export async function generateQrBuffer(userId: string): Promise<Buffer> {
  return QRCode.toBuffer(userId, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
    color: {
      dark: "#0A0A0A",
      light: "#FFFFFF",
    },
  });
}
