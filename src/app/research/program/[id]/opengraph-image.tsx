import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProgramById } from "@/lib/public-data";

/**
 * Share card for a program page. It used to be the professor's square, transparent photo, which chat apps cropped
 * to a strip or drew on black. This keeps the photo but frames it on a 1200x630 card with the program title.
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
  const photo = program?.isPublished ? program.professors.find((p) => p.imageUrl)?.imageUrl : undefined;
  const titleSize = title.length > 70 ? 50 : title.length > 40 ? 60 : 72;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #0F1E4A 0%, #1E3A8A 55%, #4F46E5 100%)", fontFamily: "Pretendard", color: "#fff" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 56px 72px", width: photo ? 720 : 1080 }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2 }}>CRI.</div>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 900, lineHeight: 1.12, letterSpacing: -1 }}>{title}</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#C7D2FE" }}>criglobal.org</div>
        </div>
        {photo ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div style={{ display: "flex", width: 380, height: 380, borderRadius: 190, background: "#EEF2FF", overflow: "hidden", border: "8px solid rgba(255,255,255,0.9)" }}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img src={photo} width={364} height={364} style={{ objectFit: "cover" }} />
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
