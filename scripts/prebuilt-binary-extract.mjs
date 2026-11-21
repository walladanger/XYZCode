import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import process from "node:process";
import { runCommand, runCommandAndReadStdout } from "./spawn-command.mjs";

// Bugfix: Windows GNU tar（Git Bash）会把绝对路径里的盘符冒号（C:）当成远程主机名，
// 也不解析含 ../ 前缀的相对归档路径；反斜杠路径会被 MSYS 参数转换破坏。tar 参数统一
// 转正斜杠，归档路径优先改用不跨越 cwd 的相对形式；必须用绝对路径时给 GNU tar 加
// --force-local 才能本地解包。bsdtar 与 Linux/macOS 不受影响。
function toTarPosixPath(pathValue) {
  return pathValue.replaceAll("\\", "/");
}

function resolveTarArchiveArg(archivePath, cwd) {
  if (process.platform === "win32") {
    try {
      const relativeArchivePath = relative(cwd, archivePath);
      if (relativeArchivePath && !relativeArchivePath.startsWith("..")) {
        return toTarPosixPath(relativeArchivePath);
      }
    } catch {
      // 跨盘符时 relative 会抛错，退回正斜杠绝对路径。
    }
  }

  return toTarPosixPath(archivePath);
}

let gnuTarOnWindowsCache;
function isGnuTarOnWindows() {
  if (gnuTarOnWindowsCache !== undefined) {
    return gnuTarOnWindowsCache;
  }
  gnuTarOnWindowsCache = false;
  if (process.platform === "win32") {
    try {
      const versionOutput = runCommandAndReadStdout("tar", ["--version"]);
      gnuTarOnWindowsCache = /GNU tar/u.test(versionOutput);
    } catch {
      // 拿不到版本信息时按非 GNU tar 处理（bsdtar 默认行为）。
    }
  }
  return gnuTarOnWindowsCache;
}

export function extractPrebuiltArchive({ archivePath, archiveExt, extractDir, cwd }) {
  mkdirSync(extractDir, { recursive: true });
  if (archiveExt === "zip") {
    if (process.platform === "win32") {
      runCommand("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `Expand-Archive -LiteralPath '${archivePath.replaceAll("'", "''")}' -DestinationPath '${extractDir.replaceAll("'", "''")}' -Force`,
      ]);
      return;
    }

    runCommand("unzip", ["-q", archivePath, "-d", extractDir], { cwd });
    return;
  }

  const tarCwd = cwd ?? process.cwd();
  const archiveArg = resolveTarArchiveArg(archivePath, tarCwd);
  const tarArgs = ["-xzf", archiveArg, "-C", toTarPosixPath(extractDir)];
  // GNU tar 在 win32 上遇到绝对归档路径（含盘符冒号）需要 --force-local 才能本地解包。
  if (isGnuTarOnWindows() && /^[A-Za-z]:[\\/]/u.test(archiveArg)) {
    tarArgs.unshift("--force-local");
  }
  runCommand("tar", tarArgs, { cwd: tarCwd });
}

export function findPrebuiltBinary(rootDir, binaryName) {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const nested = findPrebuiltBinary(fullPath, binaryName);
      if (nested) return nested;
      continue;
    }

    if (entry.isFile() && entry.name === binaryName) return fullPath;
  }

  return undefined;
}

export function assertPrebuiltArchiveSha256(expectedSha256) {
  const normalizedExpectedSha256 = String(expectedSha256 ?? "")
    .trim()
    .toLowerCase();
  if (!/^[a-f0-9]{64}$/u.test(normalizedExpectedSha256)) {
    throw new Error("missing prebuilt archive SHA-256");
  }
  return normalizedExpectedSha256;
}

export function verifyPrebuiltArchiveSha256(archivePath, expectedSha256) {
  const normalizedExpectedSha256 = assertPrebuiltArchiveSha256(expectedSha256);
  const actualSha256 = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
  if (actualSha256 !== normalizedExpectedSha256) {
    throw new Error(
      `Archive SHA-256 mismatch: expected ${normalizedExpectedSha256}, received ${actualSha256}`,
    );
  }
}

export async function extractPrebuiltBinary({
  archiveExt,
  archivePath,
  archiveSha256,
  binaryName,
  binaryPath,
  cwd,
  targetPlatform,
  validateBinary,
}) {
  verifyPrebuiltArchiveSha256(archivePath, archiveSha256);
  mkdirSync(dirname(binaryPath), { recursive: true });
  mkdirSync(tmpdir(), { recursive: true });
  const tempDir = mkdtempSync(join(tmpdir(), "zcode-prebuilt-binary-"));
  const extractDir = join(tempDir, "extract");

  try {
    extractPrebuiltArchive({ archivePath, archiveExt, extractDir, cwd });
    const extractedBinaryPath = findPrebuiltBinary(extractDir, binaryName);
    if (!extractedBinaryPath) {
      throw new Error(`Failed to locate ${binaryName} in extracted archive`);
    }

    // foreign target 不能靠执行目标文件验真，必须在覆盖正式路径前校验临时产物。
    await validateBinary?.(extractedBinaryPath);
    copyFileSync(extractedBinaryPath, binaryPath);
    if (targetPlatform !== "win32") {
      chmodSync(binaryPath, 0o755);
    }
  } finally {
    // Bugfix: Windows 下解压产物可能被杀毒/索引器或尚未退出的解压子进程短暂持有句柄，
    // rmSync 立即删除会 EPERM，且 finally 里抛出的异常会掩盖真正的解压错误。
    // 带重试删除，失败时仅告警，让原始错误正常抛出。
    try {
      rmSync(tempDir, { force: true, recursive: true, maxRetries: 10, retryDelay: 500 });
    } catch (error) {
      console.warn(`[warn] 清理临时目录失败（可忽略）: ${tempDir}`);
      console.warn(`[warn] ${String(error)}`);
    }
  }
}
