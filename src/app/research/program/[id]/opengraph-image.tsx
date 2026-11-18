import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProgramById } from "@/lib/public-data";

/**
 * Share card for a program page: the professor's subject as a tag, the program title, and the professor's photo
 * framed in a circle. A program without a professor (or photo) gets the title on the brand card only. The photo used
 * to be the whole share image, which chat apps cropped to a strip or drew on black (transparent PNGs).
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CRI research program";

// Latin-only subsets of Pretendard (program titles are English); see scripts/brand-images.
const fonts = Promise.all([
  readFile(join(process.cwd(), "src/assets/og/Pretendard-Bold-latin.ttf")),
  readFile(join(process.cwd(), "src/assets/og/Pretendard-Black-latin.ttf")),
]);

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [found, [bold, black]] = await Promise.all([getProgramById(id).catch(() => null), fonts]);
  const program = found?.isPublished ? found : null;
  const professor = program?.professors.find((p) => p.imageUrl) ?? program?.professors[0];
  const title = program?.title ?? "Research Programs";
  const subject = professor?.relatedMajor?.trim() || "Research Program";
  const photo = professor?.imageUrl;
  const textWidth = photo ? 700 : 1056;
  const titleSize = photo ? (title.length > 70 ? 50 : title.length > 40 ? 58 : 70) : title.length > 80 ? 56 : title.length > 50 ? 66 : 80;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: "64px 72px 56px", background: "linear-gradient(135deg, #0F1E4A 0%, #1E3A8A 55%, #4F46E5 100%)", fontFamily: "Pretendard", color: "#fff" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: textWidth }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2 }}>CRI.</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#E0E7FF", background: "rgba(255,255,255,0.14)", border: "2px solid rgba(255,255,255,0.28)", borderRadius: 999, padding: "8px 24px", marginBottom: 24 }}>
              {subject}
            </div>
            <div style={{ display: "flex", fontSize: titleSize, fontWeight: 900, lineHeight: 1.12, letterSpacing: -1 }}>{title}</div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#C7D2FE" }}>criglobal.org</div>
        </div>
        {photo ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flex: 1 }}>
            <div style={{ display: "flex", width: 340, height: 340, borderRadius: 170, background: "#EEF2FF", overflow: "hidden", border: "8px solid rgba(255,255,255,0.9)" }}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img src={photo} width={324} height={324} style={{ objectFit: "cover" }} />
            </div>
          </div>
        ) : null}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: black, weight: 900, style: "normal" },
      ],
    },
  );
}
