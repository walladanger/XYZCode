import {
  DEFAULT_WORKSPACE,
  clearAppData,
  quitElectronAppGracefully,
  readSettings,
  seedSettings,
  waitForDefaultWorkspaceReady,
  waitForWorkspaceApp,
} from "#e2e/helpers/desktop-app";
import { startHelpConfigFixture } from "#e2e/helpers/help-client-config-fixture";

type HelpServer = Awaited<ReturnType<typeof startHelpConfigFixture>>;
type Request = HelpServer["requests"][number];

const HELP_MENU_TRIGGER = 'button[data-testid="workspace-help-menu-trigger"]';
// English-only：任何来源的界面语言都解析为 en-US，预热请求带它即说明链路正常。
const ENGLISH = "en-US";

// spec：docs/zcode-endpoint-client-language-header.md。
// Host 请求经 NodeApiClient，带 x-request-id；Main 请求经 Electron net，不带。以此区分两条链路。
const isHost = (request: Request) => Boolean(request.headers["x-request-id"]);
function expectLanguage(requests: Request[], locale: string) {
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((request) => request.headers["x-client-language"])).toEqual(
    requests.map(() => locale),
  );
}

describe("ZCode endpoint X-Client-Language 固定为 en-US", () => {
  const servers: HelpServer[] = [];

  async function mockExternal() {
    const external = await browser.electron.mock("shell", "openExternal");
    await external.mockResolvedValue(undefined);
  }
  afterEach(async () => {
    await browser.keys("Escape");
    await browser.electron.restoreAllMocks();
  });
  after(async () => {
    for (const server of servers) await server.close();
    await clearAppData();
  });

  async function startServer() {
    const server = await startHelpConfigFixture({
      community_urls: {
        "zh-CN": "https://example.com/E2E_CLIENT_LANGUAGE_ZH",
        "en-US": "https://example.com/E2E_CLIENT_LANGUAGE_EN",
      },
    });
    servers.push(server);
    return server;
  }

  /** 在当前窗口打开帮助菜单，返回该窗口 Host 新发出的 client/configs 请求。 */
  async function openHelpMenuForHostRequests(server: HelpServer) {
    const before = server.requests.filter(isHost).length;
    await $(HELP_MENU_TRIGGER).click();
    await browser.waitUntil(async () => server.requests.filter(isHost).length > before, {
      timeout: 15000,
      timeoutMsg: "打开帮助菜单后 Host 没有请求 client/configs",
    });
    await browser.keys("Escape");
    return server.requests.filter(isHost).slice(before);
  }

  async function restartWithSeed(seed: Record<string, unknown>) {
    await waitForDefaultWorkspaceReady(30000);
    const server = await startServer();
    // 渲染进程的 localStorage 偏好优先于 setting.json，且跨重启保留；清除上一个用例的残留。
    await browser.execute(() => localStorage.removeItem("zcode-locale-preference"));
    await quitElectronAppGracefully();
    await seedSettings({
      ...seed,
      zcodeEndpointOrigin: server.origin,
      lastWorkspaceSession: [
        { kind: "local", workspacePath: DEFAULT_WORKSPACE, workspacePurpose: "project" },
      ],
      lastActiveTabIndex: 0,
    } as Parameters<typeof seedSettings>[0]);
    await browser.reloadSession();
    await waitForDefaultWorkspaceReady(30000);
    await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30000);
    await mockExternal();
    await browser.waitUntil(async () => server.requests.some((request) => !isHost(request)), {
      timeout: 15000,
      timeoutMsg: "启动后 Main 没有发出 client/configs 灰度预热",
    });
    return server;
  }

  it("CLH-01: 重启后启动预热、Host 与 Main 的请求都使用 en-US", async function () {
    this.timeout(120000);
    await waitForDefaultWorkspaceReady(30000);
    const server = await startServer();
    await quitElectronAppGracefully();
    await seedSettings({
      locale: ENGLISH,
      localePreference: ENGLISH,
      zcodeEndpointOrigin: server.origin,
      lastWorkspaceSession: [
        { kind: "local", workspacePath: DEFAULT_WORKSPACE, workspacePurpose: "project" },
      ],
      lastActiveTabIndex: 0,
    });
    await browser.reloadSession();
    await waitForDefaultWorkspaceReady(30000);
    await waitForWorkspaceApp(DEFAULT_WORKSPACE, 30000);
    await mockExternal();

    // 用户操作前到达的 Main 请求只有 client/configs 灰度预热（可能有多个灰度项）。
    await browser.waitUntil(async () => server.requests.some((request) => !isHost(request)), {
      timeout: 15000,
      timeoutMsg: "启动后 Main 没有发出 client/configs 灰度预热",
    });
    expectLanguage(
      server.requests.filter((request) => !isHost(request)),
      ENGLISH,
    );
    expectLanguage(await openHelpMenuForHostRequests(server), ENGLISH);
  });

  it("CLH-04: 旧格式（旧字段降级为 en-US、uiLocale=ja-JP）冷启动后请求仍为 en-US", async function () {
    this.timeout(120000);
    // English-only：Main 冷启动同步读 setting.json 时把任何持久化语言收口为 en-US。
    const server = await restartWithSeed({
      locale: "en-US",
      localePreference: "en-US",
      uiLocale: "ja-JP",
      uiLocalePreference: "ja-JP",
    });
    expectLanguage(
      server.requests.filter((request) => !isHost(request)),
      ENGLISH,
    );
    expectLanguage(await openHelpMenuForHostRequests(server), ENGLISH);
  });

  it("CLH-05: 旧字段直接存 ja-JP（开发期内部版本写入）仍识别并迁移，界面保持 en-US", async function () {
    this.timeout(120000);
    const server = await restartWithSeed({ locale: "ja-JP", localePreference: "ja-JP" });
    expectLanguage(
      server.requests.filter((request) => !isHost(request)),
      ENGLISH,
    );
    expectLanguage(await openHelpMenuForHostRequests(server), ENGLISH);
    // 读到旧版本不认识的旧字段值会立即迁移落盘，避免之后降级时旧版本重置整份设置。
    await browser.waitUntil(async () => (await readSettings()).locale === ENGLISH, {
      timeout: 15000,
      timeoutMsg: "旧字段 ja-JP 没有被迁移成 en-US",
    });
  });
});
