import { NextRequest } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const qualityRaw = formData.get("quality")?.toString() ?? "72";
    const format = (formData.get("format")?.toString() ?? "jpeg").toLowerCase();

    if (!file) {
      return new Response("No file uploaded", { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const quality = Math.max(1, Math.min(100, Number(qualityRaw) || 72));

    let outputBuffer: Buffer;
    let contentType = "image/jpeg";
    let ext = "jpg";

    if (format === "webp") {
      outputBuffer = await sharp(inputBuffer)
        .rotate()
        .webp({ quality })
        .toBuffer();
      contentType = "image/webp";
      ext = "webp";
    } else if (format === "png") {
      outputBuffer = await sharp(inputBuffer)
        .rotate()
        .png({ compressionLevel: 9 })
        .toBuffer();
      contentType = "image/png";
      ext = "png";
    } else {
      outputBuffer = await sharp(inputBuffer)
        .rotate()
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      contentType = "image/jpeg";
      ext = "jpg";
    }

    const originalName = file.name?.replace(/\.[^.]+$/, "") || "compressed";
    const filename = `${originalName}-compressed.${ext}`;

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Original-Bytes": String(inputBuffer.length),
        "X-Compressed-Bytes": String(outputBuffer.length),
      },
    });
  } catch (error) {
  console.error("Compression route error:", error);

  const message =
    error instanceof Error ? error.message : "Unknown server error";

  return new Response(`Compression failed: ${message}`, { status: 500 });
}
}