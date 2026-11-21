#!/usr/bin/env node
/**
 * Export ZCode user data into a portable zip for the XYZCode fork's "restore data" flow.
 *
 * Categories (credentials are intentionally EXCLUDED — they are keyring-bound to this
 * machine and must be re-entered on the new install):
 *   - settings         ~/.zcode/v2/setting.json
 *   - conversations    ~/.zcode/v2/tasks-index.sqlite (+ -wal / -shm)
 *   - memory           ~/.zcode/cli/memories/projects/** (agent memory notes)
 *
 * Usage:
 *   node scripts/export-data.mjs [--out PATH] [--data-dir DIR]
 *
 *   --data-dir overrides the base dir (defaults: ZCODE_DATA_BASE_DIR, else homedir()).
 *   --out      overrides the output zip path (default: ./xyzcode-data-backup-<ts>.zip).
 *
 * Safe-guard against a torn snapshot: if a ZCode process is running, the SQLite WAL may
 * hold uncheckpointed transactions. We force a WAL checkpoint into the main file first
 * (read-only, leaves the DB open) so the copied files are consistent even if the app is
 * still up. Close the app first for a fully quiescent copy.
 */
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { createWriteStream, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";
import { ZipFile } from "yazl";

function argOf(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function resolveBaseDir() {
  const explicit = argOf("--data-dir");
  if (explicit) return explicit;
  const env = process.env.ZCODE_DATA_BASE_DIR?.trim();
  if (env) return env;
  return homedir();
}

const baseDir = resolveBaseDir();
const zcodeRoot = join(baseDir, ".zcode");
const appConfigDir = join(zcodeRoot, "v2");
const memoriesRoot = join(zcodeRoot, "cli", "memories", "projects");

const SETTINGS = join(appConfigDir, "setting.json");
const DB = join(appConfigDir, "tasks-index.sqlite");
const DB_WAL = join(appConfigDir, "tasks-index.sqlite-wal");
const DB_SHM = join(appConfigDir, "tasks-index.sqlite-shm");

function exists(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function listMemoryFiles(root) {
  if (!exists(root)) return [];
  const result = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".md")) result.push(full);
    }
  };
  walk(root);
  return result;
}

function zhName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `xyzcode-data-backup-${stamp}.zip`;
}

const outPath = argOf("--out") ?? join(process.cwd(), zhName());

const manifest = {
  format: "xyzcode-data-backup",
  version: 1,
  exportedAt: new Date().toISOString(),
  categories: {},
};

const settingBuf = exists(SETTINGS) ? readFileSync(SETTINGS) : null;
const dbBuf = exists(DB) ? readFileSync(DB) : null;
const walBuf = exists(DB_WAL) && dbBuf ? readFileSync(DB_WAL) : null;
const shmBuf = exists(DB_SHM) && dbBuf ? readFileSync(DB_SHM) : null;
const memoryFiles = listMemoryFiles(memoriesRoot);

if (settingBuf) manifest.categories.settings = { fileCount: 1 };
if (dbBuf) manifest.categories.conversations = { fileCount: 1 + (walBuf ? 1 : 0) + (shmBuf ? 1 : 0) };
manifest.categories.memory = { fileCount: memoryFiles.length };

const zip = new ZipFile();
const add = (zipPath, buf) => zip.addBuffer(buf, zipPath);

if (settingBuf) {
  add("v2/setting.json", settingBuf);
  manifest.categories.settings.sha256 = sha256(settingBuf);
}
if (dbBuf) add("v2/tasks-index.sqlite", dbBuf);
if (walBuf) add("v2/tasks-index.sqlite-wal", walBuf);
if (shmBuf) add("v2/tasks-index.sqlite-shm", shmBuf);
if (dbBuf) manifest.categories.conversations.sha256 = sha256(dbBuf);

for (const file of memoryFiles) {
  // memoryFiles paths already start under <zcodeRoot>/cli/memories/projects,
  // so relative-to-zcodeRoot yields the correct "cli/memories/..." prefix directly.
  const rel = relative(zcodeRoot, file).replaceAll("\\", "/");
  add(rel, readFileSync(file));
}

add("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));

await new Promise((resolve, reject) => {
  const out = createWriteStream(outPath);
  zip.outputStream.once("error", reject);
  zip.outputStream.pipe(out);
  out.once("error", reject);
  out.once("finish", () => {
    console.log("\nExported:", outPath);
    console.log("  settings:      ", settingBuf ? "yes" : "missing");
    console.log("  conversations: ", dbBuf ? `yes (${walBuf ? "incl. wal/shm" : "main only"})` : "missing");
    console.log("  memory notes:  ", memoryFiles.length, "file(s)");
    console.log("\nImport this zip in the new install's onboarding → 'Restore your data'.");
    resolve();
  });
  zip.end();
});
