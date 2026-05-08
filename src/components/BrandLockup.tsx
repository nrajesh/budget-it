import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type BrandLockupSize = "header" | "sidebar" | "hero" | "mobile";

interface BrandLockupProps {
  size?: BrandLockupSize;
  className?: string;
  nameClassName?: string;
  showName?: boolean;
}

const sizeStyles: Record<
  BrandLockupSize,
  {
    wrapper: string;
    image: string;
    title: string;
  }
> = {
  header: {
    wrapper: "gap-1.5 sm:gap-2",
    image: "h-18 w-18 sm:h-24 sm:w-24",
    title: "text-[2.2rem] sm:text-[2.7rem]",
  },
  sidebar: {
    wrapper: "gap-0",
    image: "h-12 w-12 sm:h-14 sm:w-14",
    title: "text-[1.05rem] sm:text-[1.12rem]",
  },
  hero: {
    wrapper: "flex-col gap-0.5 text-center",
    image: "h-44 w-44 sm:h-52 sm:w-52",
    title: "text-5xl sm:text-6xl",
  },
  mobile: {
    wrapper: "gap-2",
    image: "h-10 w-10",
    title: "text-[1.2rem]",
  },
};

const BrandLockup = ({
  size = "header",
  className,
  nameClassName,
  showName = true,
}: BrandLockupProps) => {
  const { resolvedTheme } = useTheme();
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex items-center", styles.wrapper, className)}>
      <img
        src={resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
        alt="Vaulted Money"
        className={cn("shrink-0 object-contain", styles.image)}
      />

      {showName && (
        <span
          className={cn(
            "app-gradient-title min-w-0 whitespace-nowrap font-black leading-none tracking-[-0.06em]",
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
