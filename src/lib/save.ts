import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import getStroke from "perfect-freehand";
import type { StrokeData } from "@/components/TitleBar";

function strokeToSvgPath(stroke: StrokeData): string {
  const outline = getStroke(stroke.points, {
    size: stroke.size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });
  if (outline.length === 0) return "";
  const d = outline.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(String(x0), String(y0), String((x0 + x1) / 2), String((y0 + y1) / 2));
      return acc;
    },
    ["M", String(outline[0][0]), String(outline[0][1]), "Q"],
  );
  d.push("Z");
  return d.join(" ");
}

function buildSvg(strokes: StrokeData[], width: number, height: number): string {
  let paths = "";
  for (const stroke of strokes) {
    const d = strokeToSvgPath(stroke);
    if (d) {
      paths += `  <path d="${d}" fill="${stroke.color}" />\n`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${paths}</svg>`;
}

async function buildPng(strokes: StrokeData[], width: number, height: number): Promise<Uint8Array | null> {
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  for (const stroke of strokes) {
    const d = strokeToSvgPath(stroke);
    if (d) {
      const path = new Path2D(d);
      ctx.fillStyle = stroke.color;
      ctx.fill(path);
    }
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) return null;
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

function buildCcwi(pages: StrokeData[][]): Uint8Array {
  const data = { version: 1 as const, pages };
  const json = JSON.stringify(data);
  return new TextEncoder().encode(json);
}

// --- Save As (opens dialog) ---

export async function exportSVG(
  strokes: StrokeData[],
  width: number,
  height: number,
): Promise<string | null> {
  const svg = buildSvg(strokes, width, height);
  const path = await save({
    defaultPath: "whiteboard.svg",
    filters: [{ name: "SVG", extensions: ["svg"] }],
  });
  if (!path) return null;
  await writeFile(path, new TextEncoder().encode(svg));
  return path;
}

export async function exportPNG(
  strokes: StrokeData[],
  width: number,
  height: number,
): Promise<string | null> {
  const buffer = await buildPng(strokes, width, height);
  if (!buffer) return null;
  const path = await save({
    defaultPath: "whiteboard.png",
    filters: [{ name: "PNG", extensions: ["png"] }],
  });
  if (!path) return null;
  await writeFile(path, buffer);
  return path;
}

export async function exportCCWI(pages: StrokeData[][]): Promise<string | null> {
  const buffer = buildCcwi(pages);
  const path = await save({
    defaultPath: "whiteboard.ccwi",
    filters: [{ name: "CherryCanvas", extensions: ["ccwi"] }],
  });
  if (!path) return null;
  await writeFile(path, buffer);
  return path;
}

// --- Auto-save (writes to existing path, no dialog) ---

export async function saveToPath(
  path: string,
  pages: StrokeData[][],
): Promise<boolean> {
  const buffer = buildCcwi(pages);
  await writeFile(path, buffer);
  return true;
}
