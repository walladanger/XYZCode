import finderIcon from "@/onboarding/assets/finder.png";
import terminalIcon from "@/onboarding/assets/terminal.png";
import feishuIcon from "@/onboarding/assets/feishu.png";
import type { DraftSuggestedPromptItem } from "@/v4/draftSuggestedPromptItems.js";

type RecommendedPrompt = DraftSuggestedPromptItem & {
  category: "development" | "office" | "finance" | "utility";
};

export const officeSuggestedPrompts: RecommendedPrompt[] = [
  {
    id: "official-0",
    category: "development",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/github/icon.png",
    label: {
      cn: "Review recent changes in this repository and highlight what matters.",
      en: "Review recent changes in this repository and highlight what matters.",
    },
    prompt: {
      cn: "Review recent changes in this repository and highlight what matters.",
      en: "Review recent changes in this repository and highlight what matters.",
    },
    plugin: {
      stableId: "github@zcode-plugins-official",
      label: {
        cn: "github",
        en: "github",
      },
    },
  },
  {
    id: "official-1",
    category: "development",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/gitlab/icon.png",
    label: {
      cn: "Review this branch and find issues to fix before submitting a merge request.",
      en: "Review this branch and find issues to fix before submitting a merge request.",
    },
    prompt: {
      cn: "Review this branch and find issues to fix before submitting a merge request.",
      en: "Review this branch and find issues to fix before submitting a merge request.",
    },
    plugin: {
      stableId: "gitlab@zcode-plugins-official",
      label: {
        cn: "gitlab",
        en: "gitlab",
      },
    },
  },
  {
    id: "official-2",
    category: "development",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/mimosa/icon.png",
    label: {
      cn: "Scan this project for security issues and prioritize high-risk fixes.",
      en: "Scan this project for security issues and prioritize high-risk fixes.",
    },
    prompt: {
      cn: "Scan this project for security issues and prioritize high-risk fixes.",
      en: "Scan this project for security issues and prioritize high-risk fixes.",
    },
    plugin: {
      stableId: "mimosa@zcode-plugins-official",
      label: {
        cn: "mimosa",
        en: "mimosa",
      },
    },
  },
  {
    id: "official-3",
    category: "development",
    iconUrl: "https://docs.cloudbase.net/en/img/favicon.png",
    label: {
      cn: "Build a to-do mini program with sign-in and data storage.",
      en: "Build a to-do mini program with sign-in and data storage.",
    },
    prompt: {
      cn: "Build a to-do mini program with sign-in and data storage.",
      en: "Build a to-do mini program with sign-in and data storage.",
    },
    plugin: {
      stableId: "cloudbase-skills@zcode-plugins-official",
      label: {
        cn: "cloudbase-skills",
        en: "cloudbase-skills",
      },
    },
  },
  {
    id: "official-4",
    category: "development",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/video2code/icon.png",
    label: {
      cn: "Recreate my website recording as an interactive page.",
      en: "Recreate my website recording as an interactive page.",
    },
    prompt: {
      cn: "Recreate my website recording as an interactive page.",
      en: "Recreate my website recording as an interactive page.",
    },
    plugin: {
      stableId: "video2code@zcode-plugins-official",
      label: {
        cn: "video2code",
        en: "video2code",
      },
    },
  },
  {
    id: "official-5",
    category: "development",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/browser-use/icon.png",
    label: {
      cn: "Check my local website for layout and interaction issues.",
      en: "Check my local website for layout and interaction issues.",
    },
    prompt: {
      cn: "Check my local website for layout and interaction issues.",
      en: "Check my local website for layout and interaction issues.",
    },
    plugin: {
      stableId: "browser-use@zcode-plugins-official",
      label: {
        cn: "browser-use",
        en: "browser-use",
      },
    },
  },
  {
    id: "official-6",
    category: "office",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/lark-cli/icon.png",
    label: {
      cn: "Review yesterday’s Lark work records and list today’s follow-ups.",
      en: "Review yesterday’s Lark work records and list today’s follow-ups.",
    },
    prompt: {
      cn: "Review yesterday’s Lark work records and list today’s follow-ups.",
      en: "Review yesterday’s Lark work records and list today’s follow-ups.",
    },
    plugin: {
      stableId: "lark-cli@zcode-plugins-official",
      label: {
        cn: "lark-cli",
        en: "lark-cli",
      },
    },
  },
  {
    id: "official-7",
    category: "office",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/tencent-meeting-cli/icon.png",
    label: {
      cn: "Summarize attendance at my most recent Tencent Meeting.",
      en: "Summarize attendance at my most recent Tencent Meeting.",
    },
    prompt: {
      cn: "Summarize attendance at my most recent Tencent Meeting.",
      en: "Summarize attendance at my most recent Tencent Meeting.",
    },
    plugin: {
      stableId: "tencent-meeting-cli@zcode-plugins-official",
      label: {
        cn: "tencent-meeting-cli",
        en: "tencent-meeting-cli",
      },
    },
  },
  {
    id: "official-8",
    category: "office",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/wecom-cli/icon.png",
    label: {
      cn: "Review today’s WeCom calendar and to-dos and organize my work.",
      en: "Review today’s WeCom calendar and to-dos and organize my work.",
    },
    prompt: {
      cn: "Review today’s WeCom calendar and to-dos and organize my work.",
      en: "Review today’s WeCom calendar and to-dos and organize my work.",
    },
    plugin: {
      stableId: "wecom-cli@zcode-plugins-official",
      label: {
        cn: "wecom-cli",
        en: "wecom-cli",
      },
    },
  },
  {
    id: "official-9",
    category: "office",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/document-skills/icon.png",
    label: {
      cn: "Turn my notes into a clearly formatted Word document.",
      en: "Turn my notes into a clearly formatted Word document.",
    },
    prompt: {
      cn: "Turn my notes into a clearly formatted Word document.",
      en: "Turn my notes into a clearly formatted Word document.",
    },
    plugin: {
      stableId: "documents@zcode-plugins-official",
      label: {
        cn: "documents",
        en: "documents",
      },
    },
  },
  {
    id: "official-10",
    category: "office",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/document-skills/icon.png",
    label: {
      cn: "Analyze this Excel file, identify key trends and create charts.",
      en: "Analyze this Excel file, identify key trends and create charts.",
    },
    prompt: {
      cn: "Analyze this Excel file, identify key trends and create charts.",
      en: "Analyze this Excel file, identify key trends and create charts.",
    },
    plugin: {
      stableId: "spreadsheets@zcode-plugins-official",
      label: {
        cn: "spreadsheets",
        en: "spreadsheets",
      },
    },
  },
  {
    id: "official-11",
    category: "office",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/video-agent/icon.png",
    label: {
      cn: "Edit this long video into a one-minute highlight reel with subtitles.",
      en: "Edit this long video into a one-minute highlight reel with subtitles.",
    },
    prompt: {
      cn: "Edit this long video into a one-minute highlight reel with subtitles.",
      en: "Edit this long video into a one-minute highlight reel with subtitles.",
    },
    plugin: {
      stableId: "video-agent-kit@zcode-plugins-official",
      label: {
        cn: "video-agent-kit",
        en: "video-agent-kit",
      },
    },
  },
  {
    id: "official-12",
    category: "finance",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/corporate-due-diligence/icon.png",
    label: {
      cn: "Perform due diligence on this company, focusing on relationships and business risks.",
      en: "Perform due diligence on this company, focusing on relationships and business risks.",
    },
    prompt: {
      cn: "Perform due diligence on this company, focusing on relationships and business risks.",
      en: "Perform due diligence on this company, focusing on relationships and business risks.",
    },
    plugin: {
      stableId: "vet-companies@zcode-plugins-official",
      label: {
        cn: "vet-companies",
        en: "vet-companies",
      },
    },
  },
  {
    id: "official-13",
    category: "finance",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/business-analysis/icon.png",
    label: {
      cn: "Use this income and expense data to forecast cash flow for the next 13 weeks.",
      en: "Use this income and expense data to forecast cash flow for the next 13 weeks.",
    },
    prompt: {
      cn: "Use this income and expense data to forecast cash flow for the next 13 weeks.",
      en: "Use this income and expense data to forecast cash flow for the next 13 weeks.",
    },
    plugin: {
      stableId: "run-fpa@zcode-plugins-official",
      label: {
        cn: "run-fpa",
        en: "run-fpa",
      },
    },
  },
  {
    id: "official-14",
    category: "finance",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/portfolio-tracking/icon.png",
    label: {
      cn: "Summarize today’s watchlist performance and notable announcements.",
      en: "Summarize today’s watchlist performance and notable announcements.",
    },
    prompt: {
      cn: "Summarize today’s watchlist performance and notable announcements.",
      en: "Summarize today’s watchlist performance and notable announcements.",
    },
    plugin: {
      stableId: "watch-positions@zcode-plugins-official",
      label: {
        cn: "watch-positions",
        en: "watch-positions",
      },
    },
  },
  {
    id: "official-15",
    category: "utility",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/skill-creator/icon.png",
    label: {
      cn: "Turn my recurring workflow into a reusable skill.",
      en: "Turn my recurring workflow into a reusable skill.",
    },
    prompt: {
      cn: "Turn my recurring workflow into a reusable skill.",
      en: "Turn my recurring workflow into a reusable skill.",
    },
    plugin: {
      stableId: "skill-creator@zcode-plugins-official",
      label: {
        cn: "skill-creator",
        en: "skill-creator",
      },
    },
  },
  {
    id: "official-16",
    category: "utility",
    iconUrl: "https://cdn-zcode.z.ai/zcode/official-plugin/assets/zcode-guide/icon.png",
    label: {
      cn: "Review my ZCode configuration and suggest useful adjustments.",
      en: "Review my ZCode configuration and suggest useful adjustments.",
    },
    prompt: {
      cn: "Review my ZCode configuration and suggest useful adjustments.",
      en: "Review my ZCode configuration and suggest useful adjustments.",
    },
    plugin: {
      stableId: "zcode-guide@zcode-plugins-official",
      label: {
        cn: "zcode-guide",
        en: "zcode-guide",
      },
    },
  },
];

export function getRecommendedPromptPool(
  isOfficeMode: boolean,
  occupation?: string | null,
): DraftSuggestedPromptItem[] {
  const preferred = occupation === "finance" ? "finance" : isOfficeMode ? "office" : "development";
  const eligible = officeSuggestedPrompts.filter(
    (item) => item.category !== "finance" || occupation === "finance",
  );
  return [
    ...eligible.filter((item) => item.category === preferred),
    ...eligible.filter((item) => item.category !== preferred),
  ];
}

export const defaultSuggestedPrompts: DraftSuggestedPromptItem[] = [
  {
    id: "office-organize",
    iconUrl: finderIcon,
    label: {
      cn: "Help me see which files are taking up the most space on my computer.",
      en: "Help me see which files are taking up the most space on my computer.",
    },
    prompt: {
      cn: "Help me see which files are taking up the most space on my computer.",
      en: "Help me see which files are taking up the most space on my computer.",
    },
  },
  {
    id: "office-clean",
    iconUrl: terminalIcon,
    label: {
      cn: "Use Mole CLI to clean redundant files on my computer.",
      en: "Use Mole CLI to clean redundant files on my computer.",
    },
    prompt: {
      cn: "Use Mole CLI to clean redundant files on my computer.",
      en: "Use Mole CLI to clean redundant files on my computer.",
    },
  },
  {
    id: "office-review",
    iconUrl: feishuIcon,
    label: {
      cn: "Use Feishu CLI to review my work from yesterday and organize today’s to-dos.",
      en: "Use Feishu CLI to review my work from yesterday and organize today’s to-dos.",
    },
    prompt: {
      cn: "Use Feishu CLI to review my work from yesterday and organize today’s to-dos.",
      en: "Use Feishu CLI to review my work from yesterday and organize today’s to-dos.",
    },
  },
];
