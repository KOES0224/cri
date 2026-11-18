import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProgramById } from "@/lib/public-data";

/**
 * Share card for a program page: a CRI class photo (one of several, fixed per program) under a navy wash, with the
 * professor's photo, the professor's subject as a tag and the program title. Everything sits in the centre 630px so
 * the square crop phones show (KakaoTalk, iMessage, WhatsApp) keeps all of it; Facebook/X/Slack show the full card.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CRI research program";

const asset = (file: string) => readFile(join(process.cwd(), "src/assets/og", file));

// Latin-only subsets of Pretendard (program titles are English) and the washed class photos; see scripts/brand-images.
const fonts = Promise.all([asset("Pretendard-Bold-latin.ttf"), asset("Pretendard-Black-latin.ttf")]);
const backgrounds = Promise.all(
  [0, 1, 2, 3, 4, 5].map((i) => asset(`program-bg-${i}.jpg`).then((b) => `data:image/jpeg;base64,${b.toString("base64")}`)),
);

/** Same program, same photo: a stable pick from the id. */
function pick<T>(list: T[], id: string): T {
  let sum = 0;
  for (const ch of id) sum = (sum * 31 + ch.charCodeAt(0)) >>> 0;
  return list[sum % list.length];
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [found, [bold, black], bgs] = await Promise.all([getProgramById(id).catch(() => null), fonts, backgrounds]);
  const program = found?.isPublished ? found : null;
  const professor = program?.professors.find((p) => p.imageUrl) ?? program?.professors[0];
  const title = program?.title ?? "Research Programs";
  // Professor's subject, else the program line when it names one ("Seoul Research Program"), else a generic tag.
  const subject = professor?.relatedMajor?.trim() || (program?.subCategory?.includes("Program") ? program.subCategory : "Research Program");
  const photo = professor?.imageUrl;
  const titleSize = photo ? (title.length > 60 ? 38 : title.length > 30 ? 44 : 52) : title.length > 60 ? 46 : title.length > 30 ? 54 : 64;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Pretendard", color: "#fff" }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={pick(bgs, id)} width={1200} height={630} style={{ position: "absolute", top: 0, left: 0 }} />
        <div style={{ position: "absolute", top: 0, left: 300, width: 600, height: 630, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "34px 0 34px" }}>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1.5 }}>CRI.</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {photo ? (
              <div style={{ display: "flex", width: 176, height: 176, borderRadius: 88, background: "#EEF2FF", overflow: "hidden", border: "6px solid rgba(255,255,255,0.92)", marginBottom: 22 }}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={photo} width={164} height={164} style={{ objectFit: "cover" }} />
              </div>
            ) : null}
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#E0E7FF", background: "rgba(255,255,255,0.16)", border: "2px solid rgba(255,255,255,0.32)", borderRadius: 999, padding: "6px 20px", marginBottom: 18 }}>
              {subject}
            </div>
            <div style={{ display: "flex", textAlign: "center", justifyContent: "center", width: 560, fontSize: titleSize, fontWeight: 900, lineHeight: 1.14, letterSpacing: -0.5 }}>{title}</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#E0E7FF" }}>criglobal.org</div>
        </div>
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
