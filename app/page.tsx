"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(72);
  const [format, setFormat] = useState("jpeg");
  const [loading, setLoading] = useState(false);

  async function handleCompress() {
    if (!file) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("quality", String(quality));
      form.append("format", format);

      const res = await fetch("/api/compress", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        throw new Error("Compression failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || "compressed-image.jpg";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Compression failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Photo Compressor</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <div style={{ marginTop: 16 }}>
        <label>Format: </label>
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="jpeg">JPEG</option>
          <option value="webp">WebP</option>
          <option value="png">PNG</option>
        </select>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Quality: {quality}</label>
        <input
          type="range"
          min="20"
          max="95"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <button
        onClick={handleCompress}
        disabled={!file || loading}
        style={{ marginTop: 20, padding: "10px 16px" }}
      >
        {loading ? "Compressing..." : "Compress & Download"}
      </button>
    </main>
  );
}