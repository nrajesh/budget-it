import * as React from "react";
import { cn } from "@/lib/utils";

/** Single Tamil glyph — compact language affordance (no wrapping). */
export function LanguageIcon({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-[15px] font-semibold leading-none text-current",
        className,
      )}
      style={{
        fontFamily:
          '"Noto Sans Tamil", "Tamil Sangam MN", ui-sans-serif, system-ui, sans-serif',
      }}
      {...props}
    >
      க
    </span>
  );
}
