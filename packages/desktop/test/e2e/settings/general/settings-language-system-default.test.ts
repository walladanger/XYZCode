import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_WORKSPACE,
  clearAppData,
  quitElectronAppGracefully,
  waitForDefaultWorkspaceReady,
  waitForWorkspaceApp,
} from "#e2e/helpers/desktop-app";
import { skipOccupationOnboardingIfPresent } from "#e2e/helpers/occupation-onboarding";

const SETTINGS_FILE = join(homedir(), ".zcode", "v2", "setting.json");

describe("设置语言 System default E2E（English-only）", () => {
  after(async () => {
    await browser.electron.restoreAllMocks();
    await clearAppData();
  });

  it("SL-01: 系统首选中文时 System default 仍解析为 en-US", async function () {
    this.timeout(90000);

    await prepareSystemPreference();
    const getPreferredSystemLanguagesMock = await browser.electron.mock(
      "app",
      "getPreferredSystemLanguages",
    );
    const getLocaleMock = await browser.electron.mock("app", "getLocale");
    await getPreferredSystemLanguagesMock.mockReturnValue(["zh-Hans-CN", "en-CN"]);
    await getLocaleMock.mockReturnValue("zh-CN");

    await skipOccupationOnboardingIfPresent();
    await waitForDefaultWorkspaceReady(30000);
    await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30000);

    // English-only：system 偏好解析后写回 en-US，不再跟随系统语言。
    await browser.waitUntil(
      async () => {
        const settings = await readSettings();
        return settings.locale === "en-US";
      },
      {
        timeout: 15000,
        timeoutMsg: "System default 没有按 English-only 写回 en-US",
      },
    );
  });
});

async function prepareSystemPreference() {
  await quitElectronAppGracefully();
  await writeSettings({
    locale: "zh-CN",
    localePreference: "system",
    lastWorkspaceSession: [
      { kind: "local", workspacePath: DEFAULT_WORKSPACE, workspacePurpose: "project" },
    ],
    lastActiveTabIndex: 0,
  });
  await browser.reloadSession();
}

async function writeSettings(patch: Record<string, unknown>) {
  await mkdir(join(homedir(), ".zcode", "v2"), { recursive: true });
  const current = await readSettings();
  await writeFile(SETTINGS_FILE, JSON.stringify({ ...current, ...patch }, null, 2), "utf-8");
}

async function readSettings(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(SETTINGS_FILE, "utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}
