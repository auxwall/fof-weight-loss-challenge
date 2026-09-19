import fs from "fs";
import path from "path";

export interface SaveImageOptions {
  fileName: string;
  folder: string; // e.g. 'scales', 'signatures'
  base64Data?: string | null;
  buffer?: Buffer | null;
  filePath?: string | null;
  extension?: "jpg" | "png" | "jpeg" | "webp";
}

/**
 * Saves an image locally into public/uploads/Auxwall/${folder}/,
 * matching the architecture of D:\App\backend\controller\imageHandler\saveNewImage.js.
 *
 * Returns the public URL path: e.g. "/uploads/Auxwall/scales/scale_day1_12345.jpg"
 */
export async function saveNewImage({ fileName, folder, base64Data, buffer, filePath, extension = "jpg" }: SaveImageOptions): Promise<string> {
  
  if (!folder) throw new Error("Folder name not declared");
  if (!fileName) throw new Error("File name not declared");

  let imageBuffer: Buffer;

  if (buffer) {
    imageBuffer = buffer;
  } else if (base64Data) {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    imageBuffer = Buffer.from(cleanBase64, "base64");
  } else if (filePath) {
    imageBuffer = await fs.promises.readFile(filePath);
  } else {
    throw new Error("No image data provided to saveNewImage");
  }

  const cleanFileName = fileName.replace(/[^a-zA-Z0-9_\-]/g, "_");
  const fullFileName = `${cleanFileName}.${extension}`;

  // Local filesystem storage inside Next.js public directory
  const dir = path.join(process.cwd(), "public", "uploads", "Auxwall", folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const localFilePath = path.join(dir, fullFileName);
  await fs.promises.writeFile(localFilePath, imageBuffer);

  // If temp file path was passed, clean it up
  if (filePath && fs.existsSync(filePath)) {
    try {
      await fs.promises.unlink(filePath);
    } catch {}
  }

  // Return relative URL path directly accessible via browser / Next.js static serving
  return `/uploads/Auxwall/${folder}/${fullFileName}`;
}
