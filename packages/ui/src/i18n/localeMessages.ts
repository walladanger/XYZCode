import enUS from "./locales/en-US.js";

/**
 * 语言 → 翻译消息映射。IntlProvider 与 ErrorBoundary 共用这一份。
 * English-only：界面只保留英文文案表，其它语言表已删除。
 */
export const LOCALE_MESSAGES: Record<"en-US", Record<string, string>> = {
  "en-US": enUS,
};
