import { useState } from "react";
import { Smartphone } from "lucide-react";

/**
 * Visual scale factor — the iframe renders at real device dimensions,
 * then CSS `transform: scale()` shrinks it to look like a miniature phone.
 * 0.75 = 75 % of real size → gives the "looking at a phone on a desk" feel.
 */
const PREVIEW_SCALE = 0.75;

const HomeHeroDemo = () => {
  const [deviceLabel, setDeviceLabel] = useState("iPhone 17");
  const [deviceWidth, setDeviceWidth] = useState<number | "">(393);
  const [deviceHeight, setDeviceHeight] = useState<number | "">(852);

  // Use fallback values if inputs are empty or invalid
  const width = typeof deviceWidth === "number" && deviceWidth > 0 ? deviceWidth : 393;
  const height = typeof deviceHeight === "number" && deviceHeight > 0 ? deviceHeight : 852;

  // The iframe renders at the real device resolution.
  // The outer wrapper is sized to the *visual* (scaled-down) dimensions
  // so the rest of the page layout flows correctly.
  const visualWidth = Math.round(width * PREVIEW_SCALE);
  const visualHeight = Math.round(height * PREVIEW_SCALE);

  return (
    <div className="mx-auto w-full max-w-[26rem]">
      <div className="mb-4 text-center">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
          Actual mobile /ledgers screen
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Rendered live from the app at real device dimensions so the homepage
          matches the real mobile experience.
        </p>
      </div>

      {/* Editable Device config */}
      <div className="relative mb-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <Smartphone className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={deviceLabel}
            onChange={(e) => setDeviceLabel(e.target.value)}
            placeholder="Phone name"
            className="w-full bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <input
            type="number"
            value={deviceWidth}
            onChange={(e) => {
              const val = e.target.value;
              setDeviceWidth(val === "" ? "" : Number(val));
            }}
            placeholder="W"
            className="w-10 bg-transparent text-right focus:outline-none dark:text-slate-300"
          />
          <span>×</span>
          <input
            type="number"
            value={deviceHeight}
            onChange={(e) => {
              const val = e.target.value;
              setDeviceHeight(val === "" ? "" : Number(val));
            }}
            placeholder="H"
            className="w-10 bg-transparent focus:outline-none dark:text-slate-300"
          />
          <span>pt</span>
        </div>
      </div>

      {/* Phone frame */}
      <div className="flex justify-center">
        <div
          className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-3 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.8),rgba(2,6,23,0.98))] dark:shadow-black/45"
          style={{ width: `${visualWidth + 24}px` }}
        >
          <div
            className="mx-auto mb-3 h-1.5 rounded-full bg-slate-300/80 dark:bg-slate-700/80"
            style={{ width: `${Math.round(visualWidth * 0.35)}px` }}
          />

          {/* Scaled viewport wrapper — outer div is visual size, inner iframe is real size */}
          <div
            className="relative mx-auto overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-slate-950 shadow-sm dark:border-slate-700"
            style={{
              width: `${visualWidth}px`,
              height: `${visualHeight}px`,
            }}
          >
            <iframe
              title={`Vaulted Money mobile ledger screen – ${deviceLabel || "Custom Phone"}`}
              src="/ledgers?preview=homepage-mobile"
              className="border-0 bg-slate-950"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] leading-5 text-slate-400 dark:text-slate-500">
        Live app preview · rendered at {Math.round(PREVIEW_SCALE * 100)}% scale
      </p>
    </div>
  );
};

export default HomeHeroDemo;

