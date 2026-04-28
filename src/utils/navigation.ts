import { Capacitor } from "@capacitor/core";
import { isElectron } from "@/utils/electron";

export const navigateAppPath = (path: string) => {
  if (typeof window === "undefined") return;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const usesHashRouting = isElectron() || Capacitor.isNativePlatform();

  if (usesHashRouting) {
    window.location.hash = `#${normalizedPath}`;
    return;
  }

  window.location.assign(normalizedPath);
};
