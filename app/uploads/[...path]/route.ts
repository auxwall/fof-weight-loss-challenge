import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/auth";

// MIME types for challenge proofs & media
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".json": "application/json",
};

/**
 * Detects MIME type by inspecting magic header bytes,
 * falling back to the filename extension.
 */
function getMimeType(buffer: Buffer, filePath: string): string {
  if (buffer.length >= 4) {
    // JPEG magic bytes: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    // PNG magic bytes: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return "image/png";
    }
    // WebP magic bytes: "RIFF" .... "WEBP"
    if (
      buffer.length >= 12 &&
      buffer.toString("utf8", 0, 4) === "RIFF" &&
      buffer.toString("utf8", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }
    // PDF magic bytes: "%PDF"
    if (buffer.toString("utf8", 0, 4) === "%PDF") {
      return "application/pdf";
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Resolves a sequence of path segments case-insensitively on Linux
 * to ensure /uploads/Auxwall/ vs /uploads/auxwall/ both work seamlessly.
 */
function resolvePathCaseInsensitive(baseDir: string, segments: string[]): string | null {
  let currentDir = baseDir;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!fs.existsSync(currentDir)) return null;

    try {
      const entries = fs.readdirSync(currentDir);
      let match = entries.find((e) => e === segment);
      if (!match) {
        const lowerSegment = segment.toLowerCase();
        match = entries.find((e) => e.toLowerCase() === lowerSegment);
      }

      if (!match) return null;
      currentDir = path.join(currentDir, match);
    } catch {
      return null;
    }
  }

  return currentDir;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path?: string[] } | Promise<{ path?: string[] }> }
) {
  try {
    // 1. Strict Authentication Check: Only logged-in STAFF or SUPER_ADMIN can view proofs
    const session = await getSession();
    if (!session || (session.role !== "STAFF" && session.role !== "SUPER_ADMIN")) {
      return new NextResponse("Unauthorized: Please log in to view this document.", {
        status: 401,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 2. Safe path extraction
    const resolvedParams = await Promise.resolve(params);
    const pathSegments = resolvedParams?.path;

    if (!pathSegments || !Array.isArray(pathSegments) || pathSegments.length === 0) {
      return new NextResponse("File path required", { status: 400 });
    }

    // 3. Guard against path traversal attempts (e.g. "../")
    if (pathSegments.some((s) => s.includes("..") || path.isAbsolute(s))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 4. Look in private storage/uploads first, with public/uploads as fallback
    const candidateDirs = [
      path.resolve(process.cwd(), "storage", "uploads"),
      path.resolve(process.cwd(), "public", "uploads"),
    ];

    let targetFilePath: string | null = null;

    for (const baseDir of candidateDirs) {
      if (!fs.existsSync(baseDir)) continue;

      const directPath = path.resolve(baseDir, ...pathSegments);
      // Guard against traversal outside baseDir
      if (!directPath.startsWith(baseDir + path.sep)) continue;

      if (fs.existsSync(directPath)) {
        targetFilePath = directPath;
        break;
      }

      // Case-insensitive lookup for Linux VPS
      const caseResolved = resolvePathCaseInsensitive(baseDir, pathSegments);
      if (caseResolved && fs.existsSync(caseResolved)) {
        targetFilePath = caseResolved;
        break;
      }
    }

    if (!targetFilePath || !fs.existsSync(targetFilePath)) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const stat = await fs.promises.stat(targetFilePath);
    if (!stat.isFile()) {
      return new NextResponse("Target is not a file", { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(targetFilePath);
    const contentType = getMimeType(fileBuffer, targetFilePath);

    // 6. Return the protected image with private caching
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        // "private" ensures intermediate CDNs/proxies do not cache personal ID photos
        "Cache-Control": "private, max-age=3600, must-revalidate",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Error serving secure uploaded file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
