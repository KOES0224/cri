import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProgramById } from "@/lib/public-data";

/**
 * Share card for a program page: the program title on the brand card. It used to be one professor's photo, which
 * misrepresented programs taught by several faculty and was cropped or drawn on black by chat apps.
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
  const [program, [bold, black]] = await Promise.all([getProgramById(id).catch(() => null), fonts]);
  const title = program?.isPublished ? program.title : "Research Programs";
  const titleSize = title.length > 80 ? 56 : title.length > 50 ? 66 : 80;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px 56px", background: "linear-gradient(135deg, #0F1E4A 0%, #1E3A8A 55%, #4F46E5 100%)", fontFamily: "Pretendard", color: "#fff" }}>
        <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2 }}>CRI.</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: "#A5B4FC", marginBottom: 20 }}>RESEARCH PROGRAM</div>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 900, lineHeight: 1.12, letterSpacing: -1 }}>{title}</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#C7D2FE" }}>criglobal.org</div>
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
