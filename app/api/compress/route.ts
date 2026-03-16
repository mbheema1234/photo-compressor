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
      return new Response("No file uploaded in form field 'file'", { status: 400 });
    }

    console.log("Uploaded file info:", {
      name: file.name,
      type: file.type,
      size: file.size,
      requestedFormat: format,
      qualityRaw,
    });

    const allowedInputTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/heic",
      "image/heif",
    ];

    if (!allowedInputTypes.includes(file.type)) {
      return new Response(`Unsupported input type: ${file.type}`, { status: 400 });
    }

    if (!["jpeg", "jpg", "png", "webp"].includes(format)) {
      return new Response(`Unsupported output format: ${format}`, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const quality = Math.max(1, Math.min(100, Number(qualityRaw) || 72));

    let pipeline = sharp(inputBuffer).rotate();

    let outputBuffer: Buffer;
    let contentType = "image/jpeg";
    let ext = "jpg";

    if (format === "webp") {
      outputBuffer = await pipeline
        .resize({ width: 2048, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
      contentType = "image/webp";
      ext = "webp";
    } else if (format === "png") {
      outputBuffer = await pipeline
        .resize({ width: 2048, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
      contentType = "image/png";
      ext = "png";
    } else {
      outputBuffer = await pipeline
        .resize({ width: 2048, withoutEnlargement: true })
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