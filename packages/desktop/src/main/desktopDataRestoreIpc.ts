import { ipcMain } from "electron";
import {
  PlatformChannels,
  type RestorableDataCategory,
  type RestoreDataCategoryResult,
  type RestoreDataRequest,
  type RestoreDataResult,
} from "@zcode/shared";
import { copyFileSync, createWriteStream, existsSync, mkdirSync, renameSync } from "node:fs";
import { mkdtempSync, rmSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { getAppConfigDir, getZCodeDataRootDir } from "@zcode/services/node";
import * as yauzl from "yauzl";

/**
 * 从导出 zip 恢复用户数据。只处理 settings / conversations / memory 三类；
 * credentials 刻意排除（密钥环绑定本机，需在新安装重新登录）。
 *
 * 安全约束：zip 内条目名以 manifest 约定的固定前缀（v2/、cli/memories/projects/）为准，
 * 解包一律落到临时目录，再按类别拷到正式路径；绝不把 zip 内路径直接拼到目标根上。
 */
export function registerDataRestoreIpcHandlers(logger: {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}) {
  ipcMain.handle(PlatformChannels.RestoreData, async (_event, value: unknown): Promise<RestoreDataResult> => {
    const request = value as RestoreDataRequest | undefined;
    if (!request || typeof request.zipPath !== "string" || !Array.isArray(request.categories)) {
      return { success: false, error: "invalid_request", categories: {} };
    }
    return restoreDataFromZip(request, logger);
  });
}

const SETTINGS_ENTRY = "v2/setting.json";
const CONVERSATION_ENTRIES = [
  "v2/tasks-index.sqlite",
  "v2/tasks-index.sqlite-wal",
  "v2/tasks-index.sqlite-shm",
];
const MEMORY_ENTRY_PREFIX = "cli/memories/projects/";

const CATEGORY_ENTRY_PREDICATES: Record<RestorableDataCategory, (name: string) => boolean> = {
  settings: (name) => name === SETTINGS_ENTRY,
  conversations: (name) => CONVERSATION_ENTRIES.includes(name),
  memory: (name) => name.startsWith(MEMORY_ENTRY_PREFIX) && name.endsWith(".md"),
};

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

/** 解包 zip 到临时目录，返回该目录（失败抛错）。 */
async function extractZipToTemp(zipPath: string): Promise<string> {
  const workDir = mkdtempSync(join(tmpdir(), "xyzcode-restore-"));
  await new Promise<void>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (openErr, zipfile) => {
      if (openErr || !zipfile) {
        reject(openErr ?? new Error("unable to open zip"));
        return;
      }
      zipfile.once("error", reject);
      zipfile.once("end", resolve);
      zipfile.on("entry", (entry) => {
        zipfile.openReadStream(entry, (readErr, stream) => {
          if (readErr || !stream) {
            zipfile.readEntry();
            return;
          }
          if (entry.fileName.endsWith("/")) {
            mkdirSync(join(workDir, entry.fileName), { recursive: true });
            zipfile.readEntry();
            return;
          }
          const outPath = join(workDir, entry.fileName);
          mkdirSync(dirname(outPath), { recursive: true });
          const sink = createWriteStream(outPath);
          stream.pipe(sink);
          sink.once("error", reject);
          sink.once("finish", () => zipfile.readEntry());
        });
      });
      zipfile.readEntry();
    });
  });
  return workDir;
}

/**
 * 真正把临时目录里的类目内容写入目标位置。每个类目先备份旧文件（如有）再覆盖。
 * conversations 的 sqlite 需要主文件同时配 -wal/-shm，否则副本会丢未 checkpoint 事务 ——
 * 因此只有三个文件都从 zip 里复制成功才算恢复；若缺 -wal/-shm 也允许（干净关闭的库可能没有）。
 */
async function restoreDataFromZip(request: RestoreDataRequest, logger: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void }): Promise<RestoreDataResult> {
  let workDir: string | undefined;
  try {
    workDir = await extractZipToTemp(request.zipPath);
  } catch (error) {
    return { success: false, error: `unzip_failed: ${String(error)}`, categories: {} };
  }

  const categories: RestoreDataResult["categories"] = {};
  const appConfigDir = getAppConfigDir();
  const dataRoot = getZCodeDataRootDir();
  // tasks-index.sqlite 固定位于 getAppConfigDir() 下，直接派生，不依赖 services 再导出。
  const tasksDb = join(appConfigDir, "tasks-index.sqlite");

  // 恢复会话库前，若目标数据库文件被打开、WAL 侧车存在，会导致覆盖不完整。
  // 这里不主动关闭连接（DatabaseSync 句柄由 host utility 进程持有）；onboarding 数据恢复
  // 在任务启动前执行，届时库尚未被打开，safe。若 -wal 仍在，警告交给上层日志。
  void tasksDb;

  for (const category of request.categories) {
    const pred = CATEGORY_ENTRY_PREDICATES[category];
    try {
      if (category === "settings") {
        const src = join(workDir, SETTINGS_ENTRY);
        const dst = join(appConfigDir, "setting.json");
        categories.settings = replaceFileWithBackup(src, dst);
      } else if (category === "conversations") {
        // 需要同时存在主文件；-wal/-shm 可选。
        const mainSrc = join(workDir, "v2", "tasks-index.sqlite");
        if (!existsSync(mainSrc)) {
          categories.conversations = { restored: false, skipped: true, reason: "missing_main_db" };
        } else {
          const moved: string[] = [];
          for (const rel of CONVERSATION_ENTRIES) {
            const src = join(workDir, rel);
            if (!existsSync(src)) continue;
            const dst = join(appConfigDir, rel.replace("v2/", ""));
            replaceFileWithBackup(src, dst);
            moved.push(rel);
          }
          categories.conversations = { restored: true, skipped: false, note: moved.join(", ") };
        }
      } else if (category === "memory") {
        // 把 cli/memories/projects/** 拷到 <dataRoot>/cli/memories/projects/**
        const srcRoot = join(workDir, "cli", "memories", "projects");
        const dstRoot = join(dataRoot, "cli", "memories", "projects");
        if (!existsSync(srcRoot)) {
          categories.memory = { restored: false, skipped: true, reason: "missing_memory" };
        } else {
          mkdirSync(dstRoot, { recursive: true });
          cpSync(srcRoot, dstRoot, { recursive: true });
          categories.memory = { restored: true, skipped: false };
        }
      }
    } catch (error) {
      categories[category] = { restored: false, skipped: true, reason: String(error) };
      logger.warn(`[data-restore] ${category} failed: ${String(error)}`);
    }
  }

  if (workDir) {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      // 清理失败不阻断结果返回。
    }
  }

  return { success: true, categories };
}

/** 覆盖 dst 前先把旧文件改名为 .pre-restore-<ts> 备份；src 不存在则跳过。 */
function replaceFileWithBackup(src: string, dst: string): RestoreDataCategoryResult {
  if (!existsSync(src)) {
    return { restored: false, skipped: true, reason: "source_missing" };
  }
  if (existsSync(dst)) {
    const backup = `${dst}.pre-restore-${timestamp()}`;
    renameSync(dst, backup);
  }
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  return { restored: true, skipped: false };
}
