import { useState } from "react";
import {
  ArchiveIcon,
  CheckIcon,
  DatabaseIcon,
  FileCogIcon,
  LoaderCircle,
  MemoryStickIcon,
} from "lucide-react";
import type { RestorableDataCategory, RestoreDataResult } from "@zcode/shared";
import { Button } from "@/components/ui/button.js";
import { usePlatform } from "@/hooks/usePlatform.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";

type Category = RestorableDataCategory;

const CATEGORY_KEYS: Category[] = ["settings", "conversations", "memory"];

const CATEGORY_ICON = {
  settings: FileCogIcon,
  conversations: DatabaseIcon,
  memory: MemoryStickIcon,
} as const;

const CATEGORY_LABEL_ID = {
  settings: "onboarding.dataRestore.category.settings",
  conversations: "onboarding.dataRestore.category.conversations",
  memory: "onboarding.dataRestore.category.memory",
} as const;

export function OnboardingDataRestoreStep() {
  const { intl } = useZCodeIntl();
  const platform = usePlatform();
  const [zipPath, setZipPath] = useState<string | null>(null);
  const [selected, setSelected] = useState<Category[]>(CATEGORY_KEYS);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RestoreDataResult | null>(null);

  const selectZip = async () => {
    const path = await platform.selectFile?.();
    if (path) {
      setZipPath(path);
      setResult(null);
    }
  };

  const toggle = (category: Category) => {
    setSelected((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const runRestore = async () => {
    if (!zipPath || selected.length === 0 || !platform.restoreData) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(await platform.restoreData({ zipPath, categories: selected }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void selectZip()}
          disabled={busy}
        >
          <ArchiveIcon className="size-3.5" />
          {intl.formatMessage({ id: "onboarding.dataRestore.selectZip" })}
        </Button>
        <span className="min-w-0 truncate font-mono text-ui-sm text-foreground-subtle">
          {zipPath ?? intl.formatMessage({ id: "onboarding.dataRestore.noZip" })}
        </span>
      </div>

      <div className="grid gap-2">
        {CATEGORY_KEYS.map((category) => {
          const Icon = CATEGORY_ICON[category];
          const isSelected = selected.includes(category);
          const categoryResult = result?.categories?.[category];
          return (
            <button
              key={category}
              type="button"
              disabled={busy}
              onClick={() => toggle(category)}
              className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-left transition-colors enabled:hover:bg-surface-hover/50 disabled:opacity-70"
            >
              <div className="flex size-5 shrink-0 items-center justify-center">
                <div
                  className={`flex size-4 items-center justify-center rounded-sm border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent"}`}
                >
                  <CheckIcon className="size-3.5" />
                </div>
              </div>
              <Icon className="size-4 shrink-0 text-foreground-subtle" />
              <div className="min-w-0 flex-1">
                <div className="text-ui-base font-medium text-foreground">
                  {intl.formatMessage({ id: CATEGORY_LABEL_ID[category] })}
                </div>
                {categoryResult && categoryResult.restored === false ? (
                  <div className="mt-1 text-ui-sm text-warning">
                    {intl.formatMessage({ id: "onboarding.dataRestore.skipped" })}:{' '}
                    {categoryResult.reason}
                  </div>
                ) : categoryResult && categoryResult.restored ? (
                  <div className="mt-1 text-ui-sm text-success">
                    {intl.formatMessage({ id: "onboarding.dataRestore.restored" })}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3">
        <Button
          type="button"
          variant="default"
          disabled={!zipPath || selected.length === 0 || busy || !platform.restoreData}
          onClick={() => void runRestore()}
        >
          {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
          {intl.formatMessage({ id: "onboarding.dataRestore.run" })}
        </Button>
      </div>
    </div>
  );
}
