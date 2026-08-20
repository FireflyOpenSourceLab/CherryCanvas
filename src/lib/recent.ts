import { stat } from "@tauri-apps/plugin-fs";

export interface RecentFile {
  path: string;
  name: string;
  lastModified: number;
  size: number;
}

const STORAGE_KEY = "cc-recent-files";
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function readAll(): RecentFile[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeAll(files: RecentFile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export async function addRecentFile(path: string) {
  const name = path.split(/[\\/]/).pop()?.replace(/\.ccwi$/, "") ?? "未命名";
  let size = 0;
  let lastModified = Date.now();
  try {
    const info = await stat(path);
    size = info.size;
    if (info.mtime) lastModified = info.mtime.getTime();
  } catch {
    // file might not exist yet, use current time
  }
  const file: RecentFile = { path, name, lastModified, size };
  const files = readAll().filter((f) => f.path !== path);
  files.unshift(file);
  writeAll(files.slice(0, 50));
}

export function getRecentFiles(): RecentFile[] {
  const cutoff = Date.now() - ONE_MONTH_MS;
  return readAll().filter((f) => f.lastModified >= cutoff);
}

export function removeRecentFile(path: string) {
  writeAll(readAll().filter((f) => f.path !== path));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
