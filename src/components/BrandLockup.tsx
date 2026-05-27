import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type BrandLockupSize = "header" | "sidebar" | "hero" | "mobile";

interface BrandLockupProps {
  size?: BrandLockupSize;
  className?: string;
  nameClassName?: string;
  iconWrapperClassName?: string;
  imageClassName?: string;
  showName?: boolean;
}

const sizeStyles: Record<
  BrandLockupSize,
  {
    wrapper: string;
    iconWrapper: string;
    title: string;
  }
> = {
  header: {
    wrapper: "gap-2 sm:gap-2.5",
    iconWrapper:
      "[height:clamp(2.5rem,10vw,6rem)] [width:clamp(2.5rem,10vw,6rem)]",
    title: "text-[clamp(1.55rem,7vw,2rem)]",
  },
  sidebar: {
    wrapper: "gap-0",
    iconWrapper: "h-12 w-12 sm:h-14 sm:w-14",
    title: "text-[1.05rem] sm:text-[1.12rem]",
  },
  hero: {
    wrapper: "flex-col gap-0.5 text-center",
    iconWrapper: "h-28 w-28 sm:h-40 sm:w-40 lg:h-48 lg:w-48",
    title: "text-[2.85rem] sm:text-5xl lg:text-6xl",
  },
  mobile: {
    wrapper: "gap-2.5",
    iconWrapper: "h-11 w-11",
    title: "text-[1.4rem]",
  },
};

const BrandLockup = ({
  size = "header",
  className,
  nameClassName,
  iconWrapperClassName,
  imageClassName,
  showName = true,
}: BrandLockupProps) => {
  const { resolvedTheme } = useTheme();
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex items-center", styles.wrapper, className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          styles.iconWrapper,
          iconWrapperClassName,
        )}
      >
        <img
          src={resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
          alt="Vaulted Money"
          className={cn(
            "h-full w-full shrink-0 object-contain transition-transform",
            imageClassName,
          )}
        />
      </div>

      {showName && (
        <span
          className={cn(
            "app-gradient-title min-w-0 whitespace-nowrap font-black leading-none tracking-normal",
            styles.title,
            nameClassName,
          )}
        >
          Vaulted Money
        </span>
      )}
    </div>
  );
};

export default BrandLockup;
