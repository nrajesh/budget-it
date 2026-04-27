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
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Vaulted Money home"
          >
            <img
              src={
                resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"
              }
              alt=""
              className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
            />
            <span className="truncate text-base font-semibold tracking-normal">
              Vaulted Money
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <a href="#trust" className="hover:text-primary">
              {t("home.nav.trust", { defaultValue: "Trust" })}
            </a>
            <a href="#workflow" className="hover:text-primary">
              {t("home.nav.workflow", { defaultValue: "Workflow" })}
            </a>
            <a href="#install" className="hover:text-primary">
              {t("home.nav.install", { defaultValue: "Install" })}
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-slate-200 bg-white/80 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800"
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

      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,hsl(var(--background)),rgba(248,250,252,0.72))] px-4 pt-8 pb-4 dark:border-slate-800 dark:bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.45))] sm:py-14 lg:py-16">
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
                <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                {t("home.proof.offline", { defaultValue: "Works offline" })}
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                {t("home.proof.noCloud", { defaultValue: "No cloud account" })}
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                {t("home.proof.auditable", { defaultValue: "Auditable code" })}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      resolvedTheme === "dark"
                        ? "/logo-dark.png"
                        : "/logo-light.png"
                    }
                    alt=""
                    className="h-8 w-8 object-contain"
                  />
                  <div>
                    <p className="text-sm font-semibold">Ledger workspaces</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Isolate accounts by person or purpose
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-200">
                  Multi-currency
                </span>
              </div>

              <div className="grid gap-2 py-3">
                {ledgerPreviewRows.map((ledger) => (
                  <div
                    key={ledger.name}
                    className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60"
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
                    <div className="text-right">
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

      <section id="trust" className="px-4 pt-3 pb-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
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
        className="border-y border-slate-200 bg-slate-50 px-4 py-10 dark:border-slate-800 dark:bg-slate-900/55 sm:py-12"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal app-accent-text">
              {t("home.workflow.eyebrow", { defaultValue: "Daily use" })}
            </p>
            <h2 className="app-gradient-title mt-2 text-3xl font-bold tracking-normal">
              {t("home.workflow.title", {
                defaultValue: "Everything needed to run a personal ledger.",
              })}
            </h2>
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

      <section
        id="install"
        className="border-t border-slate-200 bg-slate-950 px-4 py-10 text-slate-50 dark:border-slate-800 sm:py-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
                {t("home.commands.eyebrow", { defaultValue: "Quick start" })}
              </p>
              <h2 className="app-gradient-title mt-2 text-3xl font-bold tracking-normal">
                {t("home.commands.title", {
                  defaultValue: "Install it or jump straight into a ledger.",
                })}
              </h2>
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
      <footer
        className="shrink-0 border-t border-border/60 bg-background px-4 py-3 sm:px-6"
        role="contentinfo"
      >
        <p className="mx-auto max-w-md text-center text-xs leading-relaxed text-muted-foreground">
          {t("layout.footer.tagline", {
            defaultValue: "Privacy-first | Data local | Open sourced",
          })}
        </p>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          aria-label={t("layout.footer.githubAria", {
            defaultValue: "Open Vaulted Money on GitHub",
          })}
        >
          {t("layout.footer.heartLink", {
            defaultValue: "Made with ❤️ for your financial freedom",
          })}
        </a>
      </footer>
    </main>
  );
};

export default HomePage;
