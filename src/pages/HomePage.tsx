import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  Coins,
  Copy,
  Database,
  Download,
  ExternalLink,
  GitFork,
  HardDrive,
  Lock,
  Moon,
  Receipt,
  Shield,
  Sun,
  Terminal,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { GITHUB_REPO_URL } from "@/utils/feedbackLinks";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import SiteFooter from "@/components/SiteFooter";
import BrandLockup from "@/components/BrandLockup";

const webInstallCommand = `git clone https://github.com/nrajesh/vaulted.money.git
cd vaulted.money
pnpm install
pnpm dev`;

const desktopInstallCommand = `git clone https://github.com/nrajesh/vaulted.money.git
cd vaulted.money
pnpm install
pnpm run electron:dev`;

const trustPillars = [
  {
    icon: Shield,
    title: "Privacy-first",
    description:
      "No account required. Your financial records stay in your browser or desktop app unless you export them.",
    previewTitle: "Local-only ledger",
    previewMeta: "Browser storage",
    previewStat: "0 accounts",
    previewDetail: "required online",
  },
  {
    icon: HardDrive,
    title: "Data local",
    description:
      "Vaulted Money is built around local ledgers, IndexedDB, and optional file backups instead of a hosted database.",
    previewTitle: "Backup vault",
    previewMeta: "Encrypted JSON",
    previewStat: "Auto",
    previewDetail: "backup rhythm",
  },
  {
    icon: GitFork,
    title: "Open sourced",
    description:
      "The code, roadmap, and privacy posture are auditable in the public repository.",
    previewTitle: "Auditable source",
    previewMeta: "MIT project",
    previewStat: "Public",
    previewDetail: "roadmap and code",
  },
];

const moneyTools = [
  { icon: BookOpen, label: "Multi-ledger tracking" },
  { icon: Coins, label: "Multi-currency balances" },
  { icon: Users, label: "Account scopes for different people" },
  { icon: Receipt, label: "CSV transaction imports" },
  { icon: Wallet, label: "Accounts, vendors, categories" },
  { icon: Lock, label: "Encrypted backup options" },
];

const ledgerPreviewRows = [
  {
    icon: Wallet,
    name: "Personal",
    scope: "Only you",
    currency: "USD",
    balance: "$24,860",
    tone: "emerald",
  },
  {
    icon: Users,
    name: "Family",
    scope: "Shared bills",
    currency: "EUR",
    balance: "€8,430",
    tone: "sky",
  },
  {
    icon: Building2,
    name: "Business",
    scope: "Accountant view",
    currency: "INR",
    balance: "₹6.2L",
    tone: "amber",
  },
];

const usageFundamentals = [
  {
    icon: Upload,
    title: "Bring your history with CSV",
    description:
      "Start with a ledger, then import bank exports from the Transactions screen. Mapping columns once makes future imports faster.",
  },
  {
    icon: Archive,
    title: "Back up before you rely on the browser",
    description:
      "Local-first means your data is yours, but private windows, browser resets, or clearing site data can erase local storage.",
  },
  {
    icon: Download,
    title: "Automate a backup rhythm",
    description:
      "Use encrypted or plain JSON exports, and enable automated backups when your browser or desktop platform supports it.",
  },
];

const commands = [
  {
    id: "web",
    title: "Run the web app",
    detail: "Best for trying Vaulted Money in a browser.",
    command: webInstallCommand,
  },
  {
    id: "desktop",
    title: "Run the desktop app",
    detail: "Best for a local app window with desktop backup support.",
    command: desktopInstallCommand,
  },
];

const roadmapMilestones = [
  {
    window: "August-September 2026",
    title: "Native iOS and Android apps",
    summary:
      "Planned mobile releases will bring Vaulted Money into dedicated iPhone and Android app experiences while keeping the local-first model intact.",
    label: "Planned",
    status: "Next",
    accent: "violet",
  },
  {
    window: "May 2026",
    title: "Privacy and public branding refresh",
    summary:
      "The public-facing experience expanded with a dedicated privacy page, updated branding, and sharper trust messaging for new users.",
    label: "Current",
    status: "Released",
    accent: "emerald",
  },
  {
    window: "April 2026",
    title: "Vaulted Money brand and public homepage launch",
    summary:
      "The app was renamed to Vaulted Money, the public homepage landed, and the install story became much clearer for web and desktop users.",
    label: "v1.5-v1.6",
    status: "Released",
    accent: "orange",
  },
  {
    window: "March 2026",
    title: "Language management and localization rollout",
    summary:
      "Multi-language support, language management UX, and broader translation coverage shipped as a major usability milestone.",
    label: "v1.4 era",
    status: "Released",
    accent: "red",
  },
  {
    window: "January 2026",
    title: "Core local-first ledger release",
    summary:
      "The first tagged release established the web app foundation for ledgers, transactions, categories, budgets, and local data ownership.",
    label: "v1.0.0",
    status: "Released",
    accent: "blue",
  },
] as const;

const HomePage = () => {
  const { t } = useTranslation();
  const { setTheme, resolvedTheme } = useTheme();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyCommand = async (id: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(id);
      showSuccess(
        t("home.commands.copied", {
          defaultValue: "Install command copied.",
        }),
      );
      window.setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      setCopiedCommand(null);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background pt-16 text-foreground sm:pt-24">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 px-3 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-4">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 sm:h-24">
          <Link
            to="/"
            className="flex min-w-0 flex-1 items-center"
            aria-label="Vaulted Money home"
          >
            <BrandLockup size="header" />
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:flex">
            <a
              href="#trust"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200"
            >
              {t("home.nav.trust", { defaultValue: "Trust" })}
            </a>
            <a
              href="#workflow"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-sky-950/60 dark:hover:text-sky-200"
            >
              {t("home.nav.workflow", { defaultValue: "Workflow" })}
            </a>
            <a
              href="#roadmap"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-200"
            >
              {t("home.nav.roadmap", { defaultValue: "Roadmap" })}
            </a>
            <a
              href="#install"
              className="rounded-full px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-800 dark:text-slate-300 dark:hover:bg-amber-950/60 dark:hover:text-amber-200"
            >
              {t("home.nav.install", { defaultValue: "Install" })}
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 sm:h-10 sm:w-10"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label={t("layout.toggleTheme", {
                defaultValue: "Toggle theme",
              })}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </Button>
            <Button asChild className="hidden h-10 rounded-md sm:inline-flex">
              <Link to="/ledgers">
                {t("home.actions.openApp", { defaultValue: "Open app" })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,hsl(var(--background)),rgba(248,250,252,0.72))] px-4 pt-6 pb-2 dark:border-slate-800 dark:bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.45))] sm:py-8 lg:py-10">
        <div className="mx-auto grid max-w-7xl items-center gap-5 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)]">
          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200">
                {t("home.badges.private", { defaultValue: "Privacy-first" })}
              </span>
              <span className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700 dark:border-sky-700/60 dark:bg-sky-950/50 dark:text-sky-200">
                {t("home.badges.local", { defaultValue: "Data local" })}
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-200">
                {t("home.badges.open", { defaultValue: "Open sourced" })}
              </span>
            </div>

            <h1 className="app-gradient-title max-w-3xl text-4xl font-black leading-[1.02] tracking-normal sm:text-5xl lg:text-6xl">
              Vaulted Money
            </h1>
            <p className="app-page-subtitle text-base sm:text-lg">
              {t("home.hero.subtitle", {
                defaultValue:
                  "A complete local-first money manager for multi-ledger, multi-currency tracking across personal, family, and business accounts.",
              })}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-md px-5">
                <Link to="/ledgers">
                  {t("home.actions.startLedger", {
                    defaultValue: "Start with ledgers",
                  })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-md border-slate-300 px-5 dark:border-slate-700"
              >
                <a href="#install">
                  <Terminal className="h-4 w-4" />
                  {t("home.actions.install", {
                    defaultValue: "Install locally",
                  })}
                </a>
              </Button>
            </div>

            <div className="mt-7 hidden max-w-2xl gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {t("home.proof.noCloud", { defaultValue: "No cloud account" })}
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                {t("home.proof.offline", { defaultValue: "Works offline" })}
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                {t("home.proof.auditable", { defaultValue: "Auditable code" })}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={
                      resolvedTheme === "dark"
                        ? "/logo-dark.png"
                        : "/logo-light.png"
                    }
                    alt=""
                    className="h-8 w-8 object-contain"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      Ledger workspaces
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Isolate accounts by person or purpose
                    </p>
                  </div>
                </div>
                <span className="hidden shrink-0 rounded-md bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-200 sm:inline-flex">
                  Multi-currency
                </span>
              </div>

              <div className="grid gap-2 py-3">
                {ledgerPreviewRows.map((ledger) => (
                  <div
                    key={ledger.name}
                    className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60 sm:grid-cols-[2rem_minmax(0,1fr)_auto]"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        ledger.tone === "emerald" &&
                          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
                        ledger.tone === "sky" &&
                          "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
                        ledger.tone === "amber" &&
                          "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
                      )}
                    >
                      <ledger.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {ledger.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {ledger.scope}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {ledger.currency}
                      </p>
                      <p className="text-sm font-bold">{ledger.balance}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden rounded-lg border border-slate-200 p-4 dark:border-slate-800 sm:block">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Share only what fits</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Keep account groups separate before exporting or sharing.
                    </p>
                  </div>
                  <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div className="grid gap-2 text-sm">
                  {[
                    ["Partner", "Household ledger", "EUR"],
                    ["Accountant", "Business accounts", "INR"],
                    ["You", "All personal accounts", "USD"],
                  ].map(([person, access, currency]) => (
                    <div
                      key={person}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{person}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {access}
                        </p>
                      </div>
                      <span className="self-center rounded-md border border-slate-200 px-2 py-1 text-xs font-medium dark:border-slate-800">
                        {currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="trust"
        className="scroll-mt-24 px-4 pt-8 pb-8 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h2 className="app-gradient-title text-3xl font-bold tracking-normal sm:text-4xl">
              {t("home.nav.trust", { defaultValue: "Trust" })}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {trustPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-slate-900">
                        <pillar.icon className="h-4 w-4 text-slate-800 dark:text-slate-100" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {pillar.previewTitle}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {pillar.previewMeta}
                        </p>
                      </div>
                    </div>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3">
                    <p className="text-2xl font-bold tracking-normal">
                      {pillar.previewStat}
                    </p>
                    <p className="pb-1 text-xs text-slate-500 dark:text-slate-400">
                      {pillar.previewDetail}
                    </p>
                  </div>
                </div>
                <h2 className="app-gradient-title mt-4 text-lg font-semibold">
                  {pillar.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="scroll-mt-24 border-y border-slate-200 bg-slate-50 px-4 py-10 dark:border-slate-800 dark:bg-slate-900/55 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="app-gradient-title text-3xl font-bold tracking-normal sm:text-4xl">
              {t("home.nav.workflow", { defaultValue: "Workflow" })}
            </h2>
            <p className="mt-4 text-xl font-medium text-slate-800 dark:text-slate-200">
              {t("home.workflow.title", {
                defaultValue: "Everything needed to run a personal ledger.",
              })}
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              {t("home.workflow.description", {
                defaultValue:
                  "Create a ledger, import CSV files, reconcile accounts, watch budgets, schedule recurring money movement, and export backups from one local app.",
              })}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-md">
                <Link to="/ledgers">
                  {t("home.actions.goLedgers", {
                    defaultValue: "Go to /ledgers",
                  })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
                  <GitFork className="h-4 w-4" />
                  {t("home.actions.github", { defaultValue: "View source" })}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {moneyTools.map((tool) => (
              <div
                key={tool.label}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                  <tool.icon className="h-5 w-5 text-slate-800 dark:text-slate-100" />
                </div>
                <span className="text-sm font-medium">{tool.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="roadmap"
        className="scroll-mt-24 border-y border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-4 py-10 dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.96))] sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="app-gradient-title text-3xl font-bold tracking-normal sm:text-4xl">
                {t("home.nav.roadmap", { defaultValue: "Roadmap" })}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
                Based on tagged releases and major shipped milestones so far,
                with the next planned platform expansion penciled in for
                August-September 2026.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,15rem)_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white/85 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/65">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Snapshot
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                5 milestones
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Four major items already shipped in 2026, with native iOS and
                Android apps lined up next.
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-[1.1rem] top-0 bottom-0 hidden w-px bg-slate-200 dark:bg-slate-800 sm:block" />
              <div className="space-y-4">
                {roadmapMilestones.map((item) => (
                  <article
                    key={`${item.window}-${item.title}`}
                    className="relative sm:pl-12"
                  >
                    <div
                      className={cn(
                        "absolute left-0 top-6 hidden h-9 w-9 items-center justify-center rounded-full border-4 border-white shadow-sm dark:border-slate-950 sm:flex",
                        item.accent === "emerald" &&
                          "bg-emerald-500 shadow-emerald-500/25",
                        item.accent === "blue" &&
                          "bg-blue-500 shadow-blue-500/25",
                        item.accent === "orange" &&
                          "bg-orange-500 shadow-orange-500/25",
                        item.accent === "red" && "bg-red-500 shadow-red-500/25",
                        item.accent === "violet" &&
                          "bg-violet-500 shadow-violet-500/25",
                      )}
                    />
                    <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            {item.window}
                          </p>
                          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-50">
                            {item.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              item.accent === "red" &&
                                "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-200",
                              item.accent === "orange" &&
                                "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200",
                              item.accent === "blue" &&
                                "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200",
                              item.accent === "emerald" &&
                                "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
                              item.accent === "violet" &&
                                "bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
                            )}
                          >
                            {item.status}
                          </span>
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                            {item.label}
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {item.summary}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="install"
        className="scroll-mt-24 border-t border-slate-200 bg-slate-950 px-4 py-10 text-slate-50 dark:border-slate-800 sm:scroll-mt-28 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="app-gradient-title text-3xl font-bold tracking-normal sm:text-4xl">
                {t("home.nav.install", { defaultValue: "Install" })}
              </h2>
              <p className="mt-4 text-xl font-medium text-slate-300">
                {t("home.commands.title", {
                  defaultValue: "Install it or jump straight into a ledger.",
                })}
              </p>
            </div>
            <Button
              asChild
              className="h-11 rounded-md bg-white text-slate-950 hover:bg-slate-100"
            >
              <Link to="/ledgers">
                {t("home.actions.openLedgers", {
                  defaultValue: "Open /ledgers",
                })}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {commands.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.detail}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => void copyCommand(item.id, item.command)}
                    aria-label={`Copy ${item.title} command`}
                  >
                    {copiedCommand === item.id ? (
                      <Check className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="overflow-x-auto p-4 text-sm leading-7 text-emerald-100">
                  <code>{item.command}</code>
                </pre>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-700/60 dark:bg-amber-950/30">
            <div className="grid gap-4 md:grid-cols-3">
              {usageFundamentals.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <item.icon className="mt-1 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                  <div>
                    <h2 className="app-gradient-title text-base font-semibold">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
};

export default HomePage;
